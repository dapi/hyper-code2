export default async function (
    ctx: Context,
    opts: { agent: types.agent.Agent; text: string; delayMs?: number },
): Promise<{ sendAt: number; messageIdx: number }> {
    const text = opts.text.trim();
    if (!text) throw new Error('empty input');

    const sendAt = Date.now() + Math.max(0, opts.delayMs ?? 0);
    const userAppend = await ctx.fns.session.appendUserMessage(ctx, { id: opts.agent.id, text });
    ctx.fns.session.syncAgentState(ctx, { agent: opts.agent });
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
