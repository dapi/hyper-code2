const subscriptions = ['codex', 'kimi-coding', 'claude-code'];
const apiProviders = ['openai', 'anthropic', 'kimi', 'groq', 'openrouter'];

export default async function (ctx: Context, opts: { explicitModel?: string } = {}) {
    if (opts.explicitModel?.trim()) return { model: opts.explicitModel.trim(), detected: false, alternatives: [] as string[] };
    // An environment override is intentionally transient: it is useful in CI
    // and for one shell session, and must win over a previously detected choice.
    if (ctx.env.MODEL?.trim()) return { model: ctx.env.MODEL.trim(), detected: false, alternatives: [] as string[] };
    const saved = ctx.fns.db.select<{ value: string }>(ctx, {
        sql: "SELECT value FROM settings WHERE module = 'llm' AND scope_type = 'global' AND scope_id = '' AND key = 'defaultModel'",
    })[0]?.value;
    if (saved) return { model: JSON.parse(saved), detected: false, alternatives: [] as string[] };
    const groups = await ctx.fns.llm.listModels(ctx);
    const candidates = [
        ...subscriptions.flatMap((provider) => groups[provider] ?? []),
        ...(groups.lmstudio ?? []).map((model) => `lmstudio:${model}`),
        ...apiProviders.flatMap((provider) => hasCredential(ctx, provider) ? (groups[provider] ?? []) : []),
    ];
    if (!candidates.length) throw new Error('No configured model is available. Set MODEL or pass -m <provider:model>.');
    return { model: candidates[0]!, detected: true, alternatives: candidates.slice(1) };
}

function hasCredential(ctx: Context, provider: string): boolean {
    return Boolean(ctx.fns.settings.getString(ctx, { module: 'llm', scopeType: 'global', key: `${provider}ApiKey` }));
}
