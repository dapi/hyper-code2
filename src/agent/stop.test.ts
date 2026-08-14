import { describe, test, expect } from "bun:test";
import stop from './stop';

describe('agent.stop', () => {
  test('aborts run and clears next_run_at when clearQueue=true', () => {
    const calls: any[] = [];
    const agent: any = {
      id: 'a1',
      abortController: { abort(reason: any) { calls.push(['abort', reason]); } },
      isStreaming: true,
    };
    const ctx: any = {
      fns: {
        db: { exec: (_c: any, opts: { sql: string; params?: any[] }) => { calls.push(['db.exec', opts.sql.replace(/\s+/g, ' ').trim(), opts.params]); return { changes: 1, lastInsertRowid: 0 }; } },
        session: {
          appendErrorEvent: (_c: any, opts: { id: string; error: string }) => calls.push(['appendErrorEvent', opts.id, opts.error]),
          syncAgentState: () => {},
        },
      },
    };
    const res = stop(ctx, { agent, clearQueue: true });
    expect(res.ok).toBe(true);
    expect(calls[0]).toEqual(['abort', 'stopped_by_user']);
    expect(calls[1][0]).toBe('db.exec');
    expect(calls[1][1]).toMatch(/UPDATE agents .*run_state = CASE WHEN run_state = 'running' AND \? THEN 'running' ELSE 'idle' END.*next_run_at = NULL/);
    expect(calls[1][2].slice(0, 2)).toEqual([1, 1]);
    expect(agent.abortController).not.toBeNull();
    expect(agent.isStreaming).toBe(true);
    expect(calls[2]).toEqual(['appendErrorEvent', 'a1', 'stopped by user; queue cleared']);
  });

  test('without clearQueue keeps next_run_at', () => {
    const calls: any[] = [];
    const agent: any = {
      id: 'a1',
      abortController: { abort() {} },
      isStreaming: true,
    };
    const ctx: any = {
      fns: {
        db: { exec: (_c: any, opts: { sql: string; params?: any[] }) => { calls.push(opts.sql.replace(/\s+/g, ' ').trim()); return { changes: 1, lastInsertRowid: 0 }; } },
        session: { appendErrorEvent: () => {}, syncAgentState: () => {} },
      },
    };
    stop(ctx, { agent, clearQueue: false });
    expect(calls[0]).toMatch(/next_run_at = next_run_at/);
  });

  test('returns a rehydrated stale running row to idle', async () => {
    const { mkTestCtx } = await import('../_testCtx.entry');
    const ctx = await mkTestCtx();
    const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
    const now = Date.now();
    ctx.fns.db.exec(ctx, {
      sql: `UPDATE agents
              SET run_state = 'running', run_started_at = ?, next_run_at = ?
            WHERE id = ?`,
      params: [now - 1_000, now - 500, agent.id],
    });

    // session.load() recreates runtime-only fields, including a null controller.
    const rehydrated = ctx.fns.session.load(ctx, { id: agent.id });
    expect(rehydrated.abortController).toBeNull();

    stop(ctx, { agent: rehydrated, clearQueue: true });

    const row = ctx.fns.db.select(ctx, {
      sql: 'SELECT run_state, run_started_at, next_run_at FROM agents WHERE id = ?',
      params: [agent.id],
    })[0];
    expect(row).toEqual({ run_state: 'idle', run_started_at: null, next_run_at: null });
  });
});
