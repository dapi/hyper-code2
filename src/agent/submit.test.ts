import { afterEach, describe, expect, test } from 'bun:test';
import { mkTestCtx } from '../_testCtx.entry';

const databases: any[] = [];
afterEach(() => {
    for (const db of databases.splice(0)) db.close();
});

describe('agent.submit', () => {
    test('appends, schedules, and wakes through the durable path', async () => {
        const ctx = await mkTestCtx();
        databases.push(ctx.state.db);
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:echo' });
        let wakes = 0;
        ctx.fns.agent.wakeWorker = () => { wakes++; };

        const result = await ctx.fns.agent.submit(ctx, { agent, text: ' hello ', delayMs: 25 });
        const row = ctx.fns.db.select(ctx, {
            sql: 'SELECT next_run_at, run_state FROM agents WHERE id = ?', params: [agent.id],
        })[0];
        expect(result.messageIdx).toBe(0);
        expect(row.run_state).toBe('idle');
        expect(Number(row.next_run_at)).toBeGreaterThan(Date.now() - 10);
        expect(ctx.fns.session.getMessages(ctx, { id: agent.id })[0].content).toBe('hello');
        expect(wakes).toBe(1);
    });

    test('rejects empty input without scheduling', async () => {
        const ctx = await mkTestCtx();
        databases.push(ctx.state.db);
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:echo' });
        await expect(ctx.fns.agent.submit(ctx, { agent, text: '  ' })).rejects.toThrow('empty input');
    });
});
