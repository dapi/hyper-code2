export default function (ctx: Context, opts: { agent: types.agent.Agent; clearQueue?: boolean }) {
    const { agent } = opts;
    const clearQueue = opts.clearQueue === true;
    const now = Date.now();
    // Rehydrated agents have no controller. A `running` row for one of them
    // belongs to a previous process and must be made claimable again.
    const ownsActiveRun = agent.abortController !== null;

    // Abort the in-flight LLM call if any.
    try { agent.abortController?.abort('stopped_by_user'); } catch {}

    // A claimed run owned by this process keeps `running` until runOne's
    // finally block quiesces. Publishing idle sooner would let the worker
    // claim a later prompt concurrently, then let the old finally overwrite
    // that newer run state. A persisted row without a live controller is stale
    // and can be returned to idle safely.
    ctx.fns.db.exec(ctx, {
        sql: `UPDATE agents
            SET run_state = CASE WHEN run_state = 'running' AND ? THEN 'running' ELSE 'idle' END,
                run_started_at = CASE WHEN run_state = 'running' AND ? THEN run_started_at ELSE NULL END,
                next_run_at = ${clearQueue ? 'NULL' : 'next_run_at'},
                last_error = ?,
                updated_at = ?
          WHERE id = ?`,
        params: [ownsActiveRun ? 1 : 0, ownsActiveRun ? 1 : 0, clearQueue ? 'stopped by user; queue cleared' : 'stopped by user', now, agent.id],
    });

    ctx.fns.session?.appendErrorEvent?.(ctx, { id: agent.id, error: clearQueue ? 'stopped by user; queue cleared' : 'stopped by user' });
    ctx.fns.session?.syncAgentState?.(ctx, { agent });
    return { ok: true, clearQueue };
}
