import { describe, expect, test } from 'bun:test';
import { mkTestCtx } from '../../src/_testCtx.entry';
import executeMarker from '../../src/agent/executeMarker';
import buildLlmRequest from '../../src/agent/buildLlmRequest';
import { detectSentinel, SENTINEL, sentinelForms } from './r018-sentinel-lib';

describe('R-018 finite detector controls', () => {
    test('no-sentinel negative control has zero hits', () => {
        expect(detectSentinel('bounded synthetic capture without fixture value')).toEqual([]);
    });

    for (const form of sentinelForms()) {
        test(`${form.id} positive control is detected`, () => {
            for (const value of form.values) {
                expect(detectSentinel(`prefix:${value}:suffix`).some(hit => hit.formId === form.id)).toBe(true);
            }
        });
    }
});

describe('R-018 current synthetic source-to-sink cell', () => {
    test('STOP-03: declared-secret fixture reaches prohibited model-visible sinks', async () => {
        const originalFetch = globalThis.fetch;
        globalThis.fetch = (() => { throw new Error('R018_NETWORK_DENIED'); }) as typeof fetch;
        try {
            const ctx: any = await mkTestCtx();
            ctx.env = { R018_SYNTHETIC_API_KEY: SENTINEL };
            ctx.state.settingsRegistry.set('r018.syntheticApiKey', {
                type: 'secret',
                env: 'R018_SYNTHETIC_API_KEY',
            });
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

            expect(messages[1]!.content).toContain(SENTINEL);
            expect(JSON.stringify(events)).toContain(SENTINEL);
            expect(JSON.stringify(request.messages)).toContain(SENTINEL);
            expect(detectSentinel(messages[1]!.content).some(hit => hit.formId === 'S0')).toBe(true);
        } finally {
            globalThis.fetch = originalFetch;
        }
    });
});
