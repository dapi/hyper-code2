import { describe, expect, test } from 'bun:test';
import route from './$route_GET';

describe('GET /self', () => {
    test('returns the descriptor from the read-only function surface for loopback', async () => {
        const descriptor: any = { schemaVersion: 1, capabilities: [] };
        const ctx = {
            state: { server: { server: { requestIP: () => ({ address: '127.0.0.1' }) } } },
            fns: { self: { describe: (async () => descriptor) as any } },
        } as unknown as Context;
        const result = await route(ctx, null, new Request('http://localhost/self'));
        expect(result).toBeInstanceOf(Response);
        expect((result as Response).headers.get('cache-control')).toBe('no-store');
        expect(await (result as Response).json()).toEqual(descriptor);
    });

    test('denies non-loopback callers without invoking the descriptor', async () => {
        let called = false;
        const ctx = {
            state: { server: { server: { requestIP: () => ({ address: '192.0.2.10' }) } } },
            fns: { self: { describe: (async () => { called = true; }) as any } },
        } as unknown as Context;
        const result = await route(ctx, null, new Request('http://localhost/self'));
        expect(result).toBeInstanceOf(Response);
        expect((result as Response).status).toBe(403);
        expect(called).toBe(false);
    });
});
