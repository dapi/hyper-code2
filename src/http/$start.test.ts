import { afterEach, describe, expect, test } from 'bun:test';
import start from './$start';

describe('http.start', () => {
    const originalServe = Bun.serve;
    const originalFile = Bun.file;
    const originalWrite = Bun.write;

    afterEach(() => {
        (Bun as any).serve = originalServe;
        (Bun as any).file = originalFile;
        (Bun as any).write = originalWrite;
    });

    test('preserves the existing IPv4 listener topology', async () => {
        let options: any;
        (Bun as any).serve = (value: any) => {
            options = value;
            return { stop() {} };
        };
        (Bun as any).file = () => ({ writer: () => ({ write() {}, flush() {} }) });
        (Bun as any).write = async () => 1;

        const ctx = { env: { PORT: '0' }, state: {} } as unknown as Context;
        await start(ctx);

        expect(options.hostname).toBe('0.0.0.0');
        expect((ctx.state as any).server.port).toBe(3000);
    });
});
