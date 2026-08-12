import { mkTestCtx } from '../../src/_testCtx.entry';
import executeMarker from '../../src/agent/executeMarker';
import buildLlmRequest from '../../src/agent/buildLlmRequest';
import { detectSentinel, SENTINEL, sentinelForms, sha256 } from './r018-sentinel-lib';

const originalFetch = globalThis.fetch;
globalThis.fetch = (() => { throw new Error('R018_NETWORK_DENIED'); }) as typeof fetch;

try {
    const forms = sentinelForms();
    const controls = {
        negative: detectSentinel('bounded synthetic capture without fixture value'),
        positive: forms.map(form => ({
            id: form.id,
            values: form.values.map(value => ({ digest: sha256(value), detected: detectSentinel(value).some(hit => hit.formId === form.id) })),
        })),
    };

    const ctx: any = await mkTestCtx();
    ctx.env = { R018_SYNTHETIC_API_KEY: SENTINEL };
    ctx.state.settingsRegistry.set('r018.syntheticApiKey', { type: 'secret', env: 'R018_SYNTHETIC_API_KEY' });
    ctx.fns.repl.eval = (innerCtx: any) => innerCtx.fns.settings.getString(innerCtx, {
        module: 'r018', scopeType: 'global', key: 'syntheticApiKey',
    });

    const agent = ctx.fns.agent.start(ctx, { model: 'mock:r018' });
    ctx.fns.session.save(ctx, { agent });
    await executeMarker(ctx, {
        agent,
        call: { kind: 'eval', content: 'synthetic fixture read through declared setting' },
        usage: {},
    });

    const messages = ctx.fns.session.getMessages(ctx, { id: agent.id });
    const events = ctx.fns.session.getEvents(ctx, { id: agent.id });
    const request = await buildLlmRequest(ctx, { agent });
    const sinks = {
        syntheticResultMessage: detectSentinel(String(messages[1]?.content ?? '')),
        persistedEvent: detectSentinel(JSON.stringify(events)),
        renderedEventHtml: detectSentinel(String(events[0]?.html ?? '')),
        preProviderRequest: detectSentinel(JSON.stringify(request.messages)),
    };
    const prohibitedHit = Object.values(sinks).some(hits => hits.length > 0);

    console.log(JSON.stringify({
        schemaVersion: 1,
        runner: 'r018-collect.ts@1',
        mode: 'static-mock-synthetic',
        providerCalls: 0,
        networkPolicy: 'global fetch replaced with fail-closed stub',
        fixture: { kind: 'deterministic non-secret', digest: sha256(SENTINEL) },
        forms: forms.map(form => ({ id: form.id, label: form.label, digests: form.values.map(sha256) })),
        controls,
        cell: {
            id: 'CELL-01', source: 'declared setting env fixture', action: 'eval mock result', outcome: 'success',
            sinks, stopRule: prohibitedHit ? 'STOP-03' : null,
        },
        unexecutedAfterStop: prohibitedHit ? ['error', 'serialization-failure', 'retry-cancellation', 'additional-source-cells'] : [],
    }, null, 2));
} finally {
    globalThis.fetch = originalFetch;
}
