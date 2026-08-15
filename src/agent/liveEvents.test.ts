import { describe, expect, test } from 'bun:test';
import { mkTestCtx } from '../_testCtx.entry';

describe('agent live events', () => {
    test('subscribes, publishes, and detaches idempotently', async () => {
        const ctx = await mkTestCtx();
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        const seen: types.agent.LiveEvent[] = [];
        const dispose = ctx.fns.agent.subscribeLive(ctx, {
            agent,
            subscriber: {
                onEvent: (event: types.agent.LiveEvent) => seen.push(event),
            },
        });
        const event: types.agent.LiveEvent = {
            version: 1,
            type: 'run_started',
            agentId: agent.id,
            runId: 'run',
            seq: 0,
        };

        ctx.fns.agent.publishLive(ctx, { agent, event });
        dispose();
        dispose();
        ctx.fns.agent.publishLive(ctx, { agent, event: { ...event, seq: 1 } });

        expect(seen).toEqual([event]);
        expect(agent.subscribers.size).toBe(0);
        ctx.state.db.close();
    });

    test('isolates a throwing subscriber and reports its adapter error once', async () => {
        const ctx = await mkTestCtx();
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        const failures: unknown[] = [];
        let healthyCalls = 0;
        ctx.fns.agent.subscribeLive(ctx, {
            agent,
            subscriber: {
                onEvent: () => {
                    throw new Error('render failed');
                },
                onError: (error: unknown) => failures.push(error),
            },
        });
        ctx.fns.agent.subscribeLive(ctx, {
            agent,
            subscriber: {
                onEvent: () => {
                    healthyCalls++;
                },
            },
        });
        const event: types.agent.LiveEvent = {
            version: 1,
            type: 'run_started',
            agentId: agent.id,
            runId: 'run',
            seq: 0,
        };

        ctx.fns.agent.publishLive(ctx, { agent, event });
        ctx.fns.agent.publishLive(ctx, { agent, event: { ...event, seq: 1 } });

        expect(failures).toHaveLength(1);
        expect(String(failures[0])).toContain('render failed');
        expect(healthyCalls).toBe(2);
        ctx.state.db.close();
    });

    test('publishes ordered model-call deltas before the exact durable final', async () => {
        const ctx = await mkTestCtx();
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        const seen: types.agent.LiveEvent[] = [];
        ctx.fns.agent.subscribeLive(ctx, {
            agent,
            subscriber: {
                onEvent: (event: types.agent.LiveEvent) => seen.push(event),
            },
        });
        ctx.fns.llm.stream = async (_ctx: Context, opts: any) => {
            opts.onEvent({ type: 'thinking_delta', delta: 'thin' });
            opts.onEvent({ type: 'thinking_delta', delta: 'king' });
            opts.onEvent({ type: 'text_delta', delta: 'ans' });
            opts.onEvent({ type: 'text_delta', delta: 'wer' });
            return { text: 'answer', thinking: 'thinking', usage: {} };
        };

        await ctx.fns.agent.run(ctx, { agent, userText: 'question' });

        expect(seen.map((event) => event.type)).toEqual([
            'run_started',
            'model_call_started',
            'thinking_delta',
            'thinking_delta',
            'text_delta',
            'text_delta',
            'model_call_finished',
            'run_finished',
        ]);
        expect(seen.map((event) => event.seq)).toEqual([
            0, 1, 2, 3, 4, 5, 6, 7,
        ]);
        expect(new Set(seen.map((event) => event.runId)).size).toBe(1);
        expect(
            agent.events
                .filter((event: any) => event.type === 'thinking')
                .at(-1)?.text,
        ).toBe('thinking');
        expect(
            agent.events
                .filter((event: any) => event.type === 'assistant')
                .at(-1)?.text,
        ).toBe('answer');
        ctx.state.db.close();
    });

    test('a subscriber failure cannot fail or alter the durable run', async () => {
        const ctx = await mkTestCtx();
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        const failures: unknown[] = [];
        ctx.fns.agent.subscribeLive(ctx, {
            agent,
            subscriber: {
                onEvent: () => {
                    throw new Error('adapter exploded');
                },
                onError: (error: unknown) => failures.push(error),
            },
        });
        ctx.fns.llm.stream = async () => ({
            text: 'durable answer',
            thinking: '',
            usage: {},
        });

        await expect(
            ctx.fns.agent.run(ctx, { agent, userText: 'question' }),
        ).resolves.toEqual({
            text: 'durable answer',
            usage: {},
        });
        expect(failures).toHaveLength(1);
        expect(
            agent.events
                .filter((event: any) => event.type === 'assistant')
                .at(-1)?.text,
        ).toBe('durable answer');
        ctx.state.db.close();
    });
});
