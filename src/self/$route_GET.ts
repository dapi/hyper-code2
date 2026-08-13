export default async function (ctx: Context, _params?: unknown, req?: Request) {
    const address = req ? ctx.state.server?.server?.requestIP(req)?.address : undefined;
    if (!isLoopback(address)) return new Response('SelfDescriptor is available from loopback only', { status: 403 });
    const descriptor = await ctx.fns.self.describe(ctx);
    return Response.json(descriptor, {
        headers: { 'cache-control': 'no-store' },
    });
}

function isLoopback(address?: string) {
    return address === '127.0.0.1'
        || address === '::1'
        || address?.startsWith('::ffff:127.') === true;
}
