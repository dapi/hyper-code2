export default async function (
    ctx: Context,
    opts: { agent: types.agent.Agent; text: string; delayMs?: number; signal?: AbortSignal },
): Promise<{ sendAt: number; messageIdx: number }> {
    const text = opts.text.trim();
    if (!text) throw new Error('empty input');

    const sendAt = Date.now() + Math.max(0, opts.delayMs ?? 0);
    const userAppend = await ctx.fns.session.appendUserMessage(ctx, { id: opts.agent.id, text });
    ctx.fns.session.syncAgentState(ctx, { agent: opts.agent });
    // Rendering the durable user event may await. A terminal stop can arrive
    // in that gap, after the message is inserted but before it is scheduled.
    // Keep the persisted transcript synchronized, but never resurrect the
    // cleared queue after the caller has cancelled this submission.
    if (opts.signal?.aborted) return { sendAt, messageIdx: userAppend.idx };
    ctx.fns.db.exec(ctx, {
        sql: `UPDATE agents
            SET next_run_at = MAX(COALESCE(next_run_at, 0), ?),
                updated_at  = ?
          WHERE id = ?`,
        params: [sendAt, Date.now(), opts.agent.id],
    });
    ctx.fns.agent.wakeWorker(ctx);
    return { sendAt, messageIdx: userAppend.idx };
}
