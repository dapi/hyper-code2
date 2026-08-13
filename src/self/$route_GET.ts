export default async function (ctx: Context, _params?: unknown, req?: Request) {
    const address = req ? ctx.state.server?.server?.requestIP(req)?.address : undefined;
    if (!isLoopback(address)) return new Response('SelfDescriptor is available from loopback only', { status: 403 });
    return await ctx.fns.self.describe(ctx);
}

function isLoopback(address?: string) {
    return address === '127.0.0.1'
        || address === '::1'
        || address?.startsWith('::ffff:127.') === true;
}
