import { isIPv4 } from 'node:net';

export default async function (ctx: Context, _params?: unknown, req?: Request) {
    const address = req ? ctx.state.server?.server?.requestIP(req)?.address : undefined;
    if (!isLoopback(address)) return new Response('SelfDescriptor is available from loopback only', { status: 403 });
    const descriptor = await ctx.fns.self.describe(ctx);
    return Response.json(descriptor, {
        headers: { 'cache-control': 'no-store' },
    });
}

function isLoopback(address?: string) {
    if (!address) return false;
    if (address === '::1') return true;

    const mapped = /^::ffff:(.+)$/i.exec(address);
    const ipv4 = mapped?.[1] ?? address;
    return isIPv4(ipv4) && ipv4.split('.')[0] === '127';
}
