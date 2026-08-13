import { createHash } from 'node:crypto';

export const SENTINEL = "R033-NONSECRET-e\u0301:'%/+/\u{10FFFF}";
export const CANDIDATES = ['CAND-01', 'CAND-02', 'CAND-03', 'CAND-04', 'CAND-05'] as const;
export const CELLS = Array.from({ length: 14 }, (_, index) => `CC-${String(index + 1).padStart(2, '0')}`);
export type CandidateId = typeof CANDIDATES[number];

export const EXPECTED_AUTH_DIGESTS = Object.freeze({
    bearer: 'd3177e877ed48485413a652e3b1df8358c3a9828744821898aebe6ab76f32be1',
    xApiKey: 'c294132494666cd199ee9c99464ae2ee3c22e2f944238b3f4034ce12254b2e14',
});

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const hasRaw = (value: unknown): boolean => JSON.stringify(value)?.includes(SENTINEL) ?? false;

type Scheme = 'bearer' | 'xApiKey';
type AdapterState = {
    available: boolean;
    revoked: boolean;
    classified: boolean;
    retry: unknown[];
    durable: Record<string, unknown>;
};

export type ExecutedCell = {
    candidate: CandidateId;
    cell: string;
    status: 'pass' | 'fail';
    reasons: string[];
    executionTrace: string[];
    dispatchCount: number;
    transport?: { scheme: Scheme; authDigest: string; bodyDigest: string; rawRetained: false };
    stableErrorCode?: string;
    agentAuthority: Record<string, unknown>;
    prohibitedSinks: Record<string, unknown>;
    retryState: unknown[];
    restartState: Record<string, unknown>;
};

function agentAuthority(candidate: CandidateId): Record<string, unknown> {
    if (candidate === 'CAND-04') {
        return {
            ctxEnv: SENTINEL,
            settingsGet: SENTINEL,
            settingsGetString: SENTINEL,
            settingsList: [{ key: 'fixture', value: SENTINEL }],
            dbSelect: [{ fixture_secret: SENTINEL }],
            fileReadAdapter: SENTINEL,
            keychainCommandAdapter: SENTINEL,
        };
    }
    if (candidate === 'CAND-01' || candidate === 'CAND-05') {
        return {
            ctxEnv: undefined,
            settingsGet: 'credref:fixture-provider',
            settingsGetString: undefined,
            settingsList: [{ key: 'fixture', value: 'credref:fixture-provider' }],
            dbSelect: [{ credential_ref: 'credref:fixture-provider' }],
            fileReadAdapter: undefined,
            keychainCommandAdapter: undefined,
        };
    }
    return {
        ctxEnv: undefined,
        settingsGet: undefined,
        settingsGetString: undefined,
        settingsList: candidate === 'CAND-03' ? [{ key: 'fixture', classification: 'secret', value: '[OMITTED]' }] : [],
        dbSelect: candidate === 'CAND-03' ? [{ credential: '[OMITTED]' }] : [],
        fileReadAdapter: undefined,
        keychainCommandAdapter: undefined,
    };
}

function createAdapter(candidate: CandidateId) {
    const state: AdapterState = { available: true, revoked: false, classified: true, retry: [], durable: {} };
    const authority = agentAuthority(candidate);
    const trace: string[] = [];

    function resolve(): string {
        trace.push('resolver.enter');
        if (candidate !== 'CAND-04') {
            if (!state.available) throw new Error('CREDENTIAL_RESOLVER_UNAVAILABLE');
            if (state.revoked) throw new Error('CREDENTIAL_REFERENCE_INVALID');
            if (!state.classified) throw new Error('SECRET_CLASSIFICATION_LOST');
        }
        trace.push(candidate === 'CAND-04' ? 'ambient-source.read' : 'privileged-source.resolve');
        return SENTINEL;
    }

    function transport(scheme: Scheme, body: unknown) {
        const value = resolve();
        const auth = scheme === 'bearer' ? `Bearer ${value}` : value;
        trace.push(`transport.${scheme}.construct`);
        const receipt = {
            scheme,
            authDigest: sha256(auth),
            bodyDigest: sha256(JSON.stringify(body)),
            rawRetained: false as const,
        };
        trace.push('transport.capture.sanitized');
        return receipt;
    }

    function projectSink(value: unknown): unknown {
        trace.push('sink.project');
        if (!state.classified) throw new Error('SECRET_CLASSIFICATION_LOST');
        if (candidate === 'CAND-04' || candidate === 'CAND-05') return '[REDACTED]';
        if (candidate === 'CAND-03') return '[OMITTED]';
        return hasRaw(value) ? '[NON_SECRET_RESULT]' : value;
    }

    function retry() {
        const value = resolve();
        state.retry.push(candidate === 'CAND-04' ? { auth: value } : { credential: 'credref:fixture-provider', attempt: 1 });
        trace.push('retry.state.write');
    }

    function restart() {
        const value = resolve();
        state.durable = candidate === 'CAND-04'
            ? { credential: value }
            : { credential: 'credref:fixture-provider', requiresRevalidation: true };
        trace.push('restart.state.serialize');
    }

    return { state, authority, trace, transport, projectSink, retry, restart };
}

export function executeCell(candidate: CandidateId, cell: string, injectLeak = false): ExecutedCell {
    const adapter = createAdapter(candidate);
    const reasons: string[] = [];
    const sinks: Record<string, unknown> = {};
    let dispatchCount = 0;
    let transport: ExecutedCell['transport'];
    let stableErrorCode: string | undefined;

    const runTransport = (scheme: Scheme, body: unknown) => {
        transport = adapter.transport(scheme, body);
        dispatchCount += 1;
    };

    try {
        if (cell === 'CC-01') sinks.negative = 'no-fixture';
        if (cell === 'CC-02') sinks.control = 'control-executed';
        if (cell === 'CC-03') runTransport('bearer', { model: 'fixture-openai', messages: ['ping'] });
        if (cell === 'CC-04') runTransport('xApiKey', { model: 'fixture-anthropic', messages: ['ping'] });
        if (cell === 'CC-05') runTransport('bearer', { model: 'fixture-subscription', refresh: 'synthetic' });
        if (cell === 'CC-06') runTransport('bearer', { model: 'fixture-codex', account: sha256('fixture-account').slice(0, 16) });
        if (cell === 'CC-07') {
            adapter.state.revoked = true;
            runTransport('bearer', { model: 'must-not-dispatch' });
            reasons.push('DISPATCH_AFTER_REVOKE');
        }
        if (cell === 'CC-08') {
            adapter.state.available = false;
            runTransport('bearer', { model: 'must-not-dispatch' });
            reasons.push('DISPATCH_AFTER_RESOLVER_FAILURE');
        }
        if (cell === 'CC-09') {
            adapter.state.classified = false;
            sinks.persistence = adapter.projectSink(SENTINEL);
            reasons.push('WRITE_AFTER_CLASSIFICATION_LOSS');
        }
        if (cell === 'CC-10') {
            sinks.success = adapter.projectSink(SENTINEL);
            sinks.error = adapter.projectSink(new Error(SENTINEL).message);
            sinks.serialization = adapter.projectSink({ broken: SENTINEL });
        }
        if (cell === 'CC-11') adapter.retry();
        if (cell === 'CC-12') adapter.restart();
        if (cell === 'CC-13') {
            runTransport('bearer', null);
            sinks.renderedModels = ['fixture-model-a', 'fixture-model-b'];
        }
        if (cell === 'CC-14') sinks.authorityProbe = adapter.authority;
    } catch (error) {
        stableErrorCode = error instanceof Error ? error.message : 'UNKNOWN_FAILURE';
        adapter.trace.push(`error.${stableErrorCode}`);
    }

    if (injectLeak) sinks.injectedLeak = SENTINEL;

    const authoritySensitiveCell = ['CC-03', 'CC-04', 'CC-05', 'CC-06', 'CC-13', 'CC-14'].includes(cell);
    if (authoritySensitiveCell && hasRaw(adapter.authority)) reasons.push('AGENT_AUTHORITY_EXPOSED');
    if (hasRaw(sinks)) reasons.push('PROHIBITED_SINK_HIT');
    if (hasRaw(adapter.state.retry)) reasons.push('RETRY_STATE_SECRET_HIT');
    if (hasRaw(adapter.state.durable)) reasons.push('RESTART_STATE_SECRET_HIT');

    if (transport) {
        const expected = transport.scheme === 'bearer' ? EXPECTED_AUTH_DIGESTS.bearer : EXPECTED_AUTH_DIGESTS.xApiKey;
        if (transport.authDigest !== expected) reasons.push('AUTH_PLACEMENT_DIGEST_MISMATCH');
    }
    if (['CC-03', 'CC-04', 'CC-05', 'CC-06', 'CC-13'].includes(cell) && !transport) reasons.push('EXPECTED_TRANSPORT_ABSENT');
    if (['CC-07', 'CC-08', 'CC-09'].includes(cell)) {
        const expectedErrors: Record<string, string> = {
            'CC-07': 'CREDENTIAL_REFERENCE_INVALID',
            'CC-08': 'CREDENTIAL_RESOLVER_UNAVAILABLE',
            'CC-09': 'SECRET_CLASSIFICATION_LOST',
        };
        if (stableErrorCode !== expectedErrors[cell]) reasons.push('FAIL_CLOSED_ERROR_MISMATCH');
        if (dispatchCount !== 0) reasons.push('FAIL_CLOSED_DISPATCH_OCCURRED');
    }

    return {
        candidate,
        cell,
        status: reasons.length === 0 ? 'pass' : 'fail',
        reasons: [...new Set(reasons)],
        executionTrace: adapter.trace,
        dispatchCount,
        transport,
        stableErrorCode,
        agentAuthority: adapter.authority,
        prohibitedSinks: sinks,
        retryState: adapter.state.retry,
        restartState: adapter.state.durable,
    };
}
