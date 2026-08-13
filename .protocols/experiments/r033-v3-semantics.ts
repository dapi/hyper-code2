import { createHash } from 'node:crypto';

import { SENTINEL, CANDIDATES, CELLS, type CandidateId, EXPECTED_AUTH_DIGESTS } from './r033-executable-adapters';

export { SENTINEL, CANDIDATES, CELLS, type CandidateId };
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const raw = (value: unknown) => JSON.stringify(value)?.includes(SENTINEL) ?? false;

export const EXPECTED_REQUEST_DIGESTS: Record<string, string> = Object.freeze({
    'CC-03': 'f6ed811a80390734fae2c175a9139c4db31668f7521372ab8378117210dbec65',
    'CC-04': 'cb14412538d74ccadd0d42b4a34a3f91c06a4de1735aed682a082c524c404577',
    'CC-05': '125c367992bfeb75f2ad3710fe3d51dc4f3789fd0e0f070cdd14c7499aa97871',
    'CC-06': '06ac7692f923b6e5b2431114c305f84f29279e82eb8fd7303fde9d372b0c634a',
});

type State = {
    revoked: boolean;
    available: boolean;
    classified: boolean;
    uses: number;
    maxUses: number;
    cancelled: boolean;
    trace: string[];
    retry: unknown[];
    durable: Record<string, unknown>;
};

type Strategy = {
    id: CandidateId;
    authority: Record<string, unknown>;
    state: State;
    resolve(ref: string): string;
    sink(layer: string, value: unknown): unknown;
};

function strategy(id: CandidateId): Strategy {
    const state: State = { revoked: false, available: true, classified: true, uses: 0, maxUses: 2, cancelled: false, trace: [], retry: [], durable: {} };
    const exposed = id === 'CAND-04';
    const reference = 'credref:provider/account/fixture';
    const authority: Record<string, unknown> = exposed ? {
        ctxEnv: SENTINEL, settingsGet: SENTINEL, settingsGetString: SENTINEL,
        settingsList: [{ key: 'fixture', value: SENTINEL }], dbSelect: [{ fixture: SENTINEL }],
        fileRead: SENTINEL, keychainCommand: SENTINEL,
    } : id === 'CAND-01' || id === 'CAND-05' ? {
        ctxEnv: undefined, settingsGet: reference, settingsGetString: undefined,
        settingsList: [{ key: 'fixture', value: reference }], dbSelect: [{ credentialRef: reference }],
        fileRead: undefined, keychainCommand: undefined,
    } : id === 'CAND-03' ? {
        ctxEnv: undefined, settingsGet: undefined, settingsGetString: undefined,
        settingsList: [{ key: 'fixture', value: '[SCHEMA-OMITTED]' }], dbSelect: [{ credential: '[SCHEMA-OMITTED]' }],
        fileRead: undefined, keychainCommand: undefined,
    } : {
        ctxEnv: undefined, settingsGet: undefined, settingsGetString: undefined,
        settingsList: [], dbSelect: [], fileRead: undefined, keychainCommand: undefined,
    };

    return {
        id, authority, state,
        resolve(ref: string) {
            state.trace.push(`${id}.resolve`);
            if (id !== 'CAND-04') {
                if (ref !== reference) throw new Error('CREDENTIAL_REFERENCE_INVALID');
                if (state.revoked) throw new Error('CREDENTIAL_REFERENCE_INVALID');
                if (!state.available) throw new Error('CREDENTIAL_RESOLVER_UNAVAILABLE');
                if (!state.classified) throw new Error('SECRET_CLASSIFICATION_LOST');
                if (state.cancelled) throw new Error('OPERATION_CANCELLED');
                if (state.uses >= state.maxUses) throw new Error('CREDENTIAL_USE_LIMIT');
            }
            state.uses += 1;
            state.trace.push(id === 'CAND-01' ? 'broker.bound-reference' : id === 'CAND-02' ? 'privileged-source.excluded' : id === 'CAND-03' ? 'schema.privileged-field' : id === 'CAND-04' ? 'ambient.provenance-tagged' : 'composition.bound-reference-source-exclusion-schema');
            return SENTINEL;
        },
        sink(layer: string, value: unknown) {
            state.trace.push(`${id}.sink.${layer}`);
            if (!state.classified) throw new Error('SECRET_CLASSIFICATION_LOST');
            if (id === 'CAND-03') return { layer, value: '[SCHEMA-OMITTED]' };
            if (id === 'CAND-04' || id === 'CAND-05') return { layer, value: '[PROVENANCE-REDACTED]' };
            return { layer, value: raw(value) ? '[BOUNDARY-OMITTED]' : value };
        },
    };
}

function requestFixture(cell: string) {
    if (cell === 'CC-03') return { scheme: 'bearer', request: { url: 'https://mock.invalid/v1/chat/completions', method: 'POST', headers: { 'content-type': 'application/json', 'x-fixture': 'openai' }, body: { model: 'fixture-openai', messages: [{ role: 'user', content: 'ping' }] } } };
    if (cell === 'CC-04') return { scheme: 'xApiKey', request: { url: 'https://mock.invalid/v1/messages', method: 'POST', headers: { 'content-type': 'application/json', 'anthropic-version': '2023-06-01' }, body: { model: 'fixture-anthropic', messages: [{ role: 'user', content: 'ping' }] } } };
    if (cell === 'CC-05') return { scheme: 'bearer', request: { url: 'https://mock.invalid/v1/messages', method: 'POST', headers: { 'content-type': 'application/json', 'anthropic-version': '2023-06-01', 'x-refresh': 'synthetic' }, body: { model: 'fixture-subscription', messages: [] } } };
    const identity = sha256('fixture-account-token').slice(0, 16);
    return { scheme: 'bearer', request: { url: 'https://mock.invalid/v1/responses', method: 'POST', headers: { 'content-type': 'application/json', 'x-account-id': identity }, body: { model: 'fixture-codex', input: 'ping' } } };
}

function transport(s: Strategy, cell: string, fixture = requestFixture(cell)) {
    const token = s.resolve('credref:provider/account/fixture');
    const auth = fixture.scheme === 'xApiKey' ? token : `Bearer ${token}`;
    s.state.trace.push(`transport.capture.${cell}`);
    return {
        requestDigest: sha256(JSON.stringify(fixture.request)),
        expectedRequestDigest: EXPECTED_REQUEST_DIGESTS[cell],
        requestMatched: sha256(JSON.stringify(fixture.request)) === EXPECTED_REQUEST_DIGESTS[cell],
        authDigest: sha256(auth),
        expectedAuthDigest: fixture.scheme === 'xApiKey' ? EXPECTED_AUTH_DIGESTS.xApiKey : EXPECTED_AUTH_DIGESTS.bearer,
        authMatched: sha256(auth) === (fixture.scheme === 'xApiKey' ? EXPECTED_AUTH_DIGESTS.xApiKey : EXPECTED_AUTH_DIGESTS.bearer),
        rawRetained: false,
    };
}

export function executeV3(candidate: CandidateId, cell: string) {
    const s = strategy(candidate);
    const reasons: string[] = [];
    const observed: Record<string, unknown> = {};
    let stableError: string | null = null;
    let dispatches = 0;
    try {
        if (cell === 'CC-01') observed.negative = 'no-sentinel';
        if (cell === 'CC-02') { observed.transport = transport(s, 'CC-03'); dispatches++; }
        if (['CC-03', 'CC-04', 'CC-05', 'CC-06'].includes(cell)) {
            if (cell === 'CC-05') {
                const stores = { file: { access: SENTINEL }, keychain: { access: SENTINEL }, writes: [] as unknown[], oauth: [] as unknown[] };
                s.state.trace.push('synthetic.file.read', 'synthetic.keychain.read');
                stores.oauth.push({ requestDigest: sha256(JSON.stringify({ refresh: '[SYNTHETIC-REFRESH]' })), response: SENTINEL });
                stores.writes.push({ file: '[SYNTHETIC-ROTATED]' }, { keychain: '[SYNTHETIC-ROTATED]' });
                observed.refresh = { fileRead: true, keychainRead: true, oauthExchange: true, fileWrite: true, keychainWrite: true, privilegedRawObserved: raw(stores) };
            }
            if (cell === 'CC-06') {
                const codexStore = { read: { access: SENTINEL }, refreshRequest: { refresh: '[SYNTHETIC-REFRESH]' }, refreshResponse: { access: SENTINEL }, write: { access: '[SYNTHETIC-ROTATED]' } };
                s.state.trace.push('synthetic.codex-file.read', 'synthetic.codex-oauth.refresh', 'synthetic.codex-file.write');
                observed.codexRefresh = { fileRead: true, oauthRefresh: true, fileWrite: true, privilegedRawObserved: raw(codexStore) };
                observed.accountIdentity = sha256('fixture-account-token').slice(0, 16);
            }
            observed.transport = transport(s, cell); dispatches++;
        }
        if (cell === 'CC-07') { s.state.revoked = true; observed.transport = transport(s, 'CC-03'); dispatches++; }
        if (cell === 'CC-08') { s.state.available = false; observed.transport = transport(s, 'CC-03'); dispatches++; }
        if (cell === 'CC-09') { s.state.classified = false; observed.persistence = s.sink('persistence', SENTINEL); }
        if (cell === 'CC-10') {
            observed.success = s.sink('success', SENTINEL);
            try { throw new Error(SENTINEL); } catch (error) { observed.thrown = s.sink('throw', error instanceof Error ? error.message : error); }
            const cyclic: any = {}; cyclic.self = cyclic;
            try { JSON.stringify(cyclic); } catch (error) { observed.serialization = s.sink('serialization', error instanceof Error ? error.name : 'error'); }
        }
        if (cell === 'CC-11') {
            observed.first = transport(s, 'CC-03'); dispatches++;
            s.state.retry.push({ credentialRef: candidate === 'CAND-04' ? SENTINEL : 'credref:provider/account/fixture', attempt: 2 });
            observed.retry = transport(s, 'CC-03'); dispatches++;
            try { transport(s, 'CC-03'); dispatches++; } catch (error) { observed.boundedReuse = error instanceof Error ? error.message : error; }
            s.state.cancelled = true;
            try { transport(s, 'CC-03'); dispatches++; } catch (error) { observed.cancel = error instanceof Error ? error.message : error; }
        }
        if (cell === 'CC-12') { s.state.durable = candidate === 'CAND-04' ? { token: s.resolve('credref:provider/account/fixture') } : { credentialRef: 'credref:provider/account/fixture', revalidate: true }; observed.restartInput = s.state.durable; }
        if (cell === 'CC-13') {
            observed.discoveryTransport = transport(s, 'CC-06'); dispatches++;
            observed.models = ['fixture-model-a', 'fixture-model-b'];
            observed.agentNewForm = `<select><option>fixture-model-a</option><option>fixture-model-b</option></select>`;
            s.state.available = false;
            try { transport(s, 'CC-06'); dispatches++; } catch (error) { observed.discoveryFailure = error instanceof Error ? error.message : error; }
        }
        if (cell === 'CC-14') {
            const generatedFunctions = Object.fromEntries(Object.entries(s.authority).map(([name, value]) => [name, () => value]));
            const probes = Object.entries(generatedFunctions).map(([name, callable]) => ({ name, callable: true, returned: callable() }));
            s.state.trace.push(...probes.map(probe => `generated-probe.${probe.name}.invoke`));
            observed.generatedProbeResults = probes;
        }
    } catch (error) { stableError = error instanceof Error ? error.message : 'UNKNOWN'; s.state.trace.push(`error.${stableError}`); }

    if (['CC-03', 'CC-04', 'CC-05', 'CC-06', 'CC-13', 'CC-14'].includes(cell) && raw(s.authority)) reasons.push('AGENT_AUTHORITY_EXPOSED');
    if (raw(observed) && !['CC-05'].includes(cell)) reasons.push('PROHIBITED_SINK_HIT');
    if (raw(s.state.retry)) reasons.push('RETRY_STATE_SECRET_HIT');
    if (raw(s.state.durable)) reasons.push('RESTART_STATE_SECRET_HIT');
    if (cell === 'CC-11') {
        if (observed.boundedReuse !== 'CREDENTIAL_USE_LIMIT') reasons.push('BOUNDED_REUSE_NOT_ENFORCED');
        if (observed.cancel !== 'OPERATION_CANCELLED') reasons.push('CANCELLATION_NOT_ENFORCED');
    }
    if (cell === 'CC-13' && observed.discoveryFailure !== 'CREDENTIAL_RESOLVER_UNAVAILABLE') reasons.push('DISCOVERY_FAILURE_NOT_FAIL_CLOSED');
    if (['CC-07', 'CC-08', 'CC-09'].includes(cell)) {
        const expected: Record<string, string> = { 'CC-07': 'CREDENTIAL_REFERENCE_INVALID', 'CC-08': 'CREDENTIAL_RESOLVER_UNAVAILABLE', 'CC-09': 'SECRET_CLASSIFICATION_LOST' };
        if (stableError !== expected[cell]) reasons.push('FAIL_CLOSED_ERROR_MISMATCH');
        if (dispatches) reasons.push('FAIL_CLOSED_DISPATCH_OCCURRED');
    }
    if (['CC-02', 'CC-03', 'CC-04', 'CC-05', 'CC-06'].includes(cell)) {
        const receipt: any = observed.transport;
        if (!receipt?.requestMatched) reasons.push('REQUEST_SEMANTICS_MISMATCH');
        if (!receipt?.authMatched) reasons.push('AUTH_PLACEMENT_MISMATCH');
    }
    return { candidate, cell, status: reasons.length ? 'fail' : 'pass', reasons: [...new Set(reasons)], dispatches, stableError, trace: s.state.trace, observed, retryState: s.state.retry, restartState: s.state.durable };
}
