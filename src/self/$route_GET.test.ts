import { describe, expect, test } from 'bun:test';
import route from './$route_GET';

describe('GET /self', () => {
    test('returns the descriptor for every validated loopback form', async () => {
        const allowed = [
            '127.0.0.1',
            '127.0.0.2',
            '127.255.255.255',
            '::1',
            '::ffff:127.0.0.1',
            '::FFFF:127.42.0.9',
            '::ffff:7f00:1',
            '::ffff:7fff:ffff',
            '0:0:0:0:0:ffff:7f2a:9',
            '0000:0000:0000:0000:0000:FFFF:7F00:0001',
        ];
        for (const address of allowed) {
            const descriptor: any = { schemaVersion: 1, capabilities: [], address };
            const ctx = {
                state: { server: { server: { requestIP: () => ({ address }) } } },
                fns: { self: { describe: (async () => descriptor) as any } },
            } as unknown as Context;
            const result = await route(ctx, null, new Request('http://localhost/self'));
            expect(result).toBeInstanceOf(Response);
            expect((result as Response).status).toBe(200);
            expect((result as Response).headers.get('cache-control')).toBe('no-store');
            expect(await (result as Response).json()).toEqual(descriptor);
        }
    });

    test('denies malformed and non-loopback callers without invoking the descriptor', async () => {
        const denied = [
            '126.255.255.255',
            '128.0.0.0',
            '192.0.2.10',
            '::ffff:126.255.255.255',
            '::ffff:128.0.0.0',
            '::ffff:7eff:ffff',
            '::ffff:8000:0',
            '0:0:0:0:ffff:0:7f00:1',
            '::ffff:127.evil',
            '::ffff:127.0.0.1.extra',
            '127.0.0.256',
            undefined,
        ];
        let called = false;
        for (const address of denied) {
            const ctx = {
                state: { server: { server: { requestIP: () => address ? { address } : undefined } } },
                fns: { self: { describe: (async () => { called = true; }) as any } },
            } as unknown as Context;
            const result = await route(ctx, null, new Request('http://localhost/self'));
            expect(result).toBeInstanceOf(Response);
            expect((result as Response).status).toBe(403);
        }
        expect(called).toBe(false);
    });
});
