import { isIPv4, isIPv6 } from 'node:net';

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
    if (isIPv4(address)) return address.split('.')[0] === '127';

    const words = parseIPv6(address);
    if (!words) return false;

    const isIPv6Loopback = words.slice(0, 7).every(word => word === 0) && words[7] === 1;
    const isMappedIPv4Loopback = words.slice(0, 5).every(word => word === 0)
        && words[5] === 0xffff
        && words[6]! >>> 8 === 127;
    return isIPv6Loopback || isMappedIPv4Loopback;
}

function parseIPv6(address: string) {
    if (!isIPv6(address)) return undefined;

    let normalized = address;
    if (address.includes('.')) {
        const separator = address.lastIndexOf(':');
        const ipv4 = address.slice(separator + 1);
        if (!isIPv4(ipv4)) return undefined;
        const octets = ipv4.split('.').map(Number);
        const high = ((octets[0]! << 8) | octets[1]!).toString(16);
        const low = ((octets[2]! << 8) | octets[3]!).toString(16);
        normalized = `${address.slice(0, separator)}:${high}:${low}`;
    }

    const halves = normalized.split('::');
    const left = halves[0] ? halves[0].split(':') : [];
    const right = halves[1] ? halves[1].split(':') : [];
    const omitted = halves.length === 2 ? 8 - left.length - right.length : 0;
    const parts = halves.length === 2
        ? [...left, ...Array(omitted).fill('0'), ...right]
        : left;

    if (parts.length !== 8 || parts.some(part => !/^[0-9a-f]{1,4}$/i.test(part))) return undefined;
    return parts.map(part => Number.parseInt(part, 16));
}
