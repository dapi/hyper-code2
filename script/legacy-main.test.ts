import { afterEach, expect, test } from 'bun:test';
import { mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dir, '..');
const fixtureRoot = join(repoRoot, '.test-tmp', 'legacy-main');

afterEach(async () => {
    await rm(fixtureRoot, { recursive: true, force: true });
});

async function freePort(): Promise<number> {
    const probe = Bun.serve({ port: 0, fetch: () => new Response('ok') });
    const port = probe.port;
    await probe.stop(true);
    if (port == null) throw new Error('Bun did not expose the probe port');
    return port;
}

async function waitForOutput(stream: ReadableStream<Uint8Array>, expected: string, timeoutMs: number) {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error(`timed out waiting for ${expected}`)), timeoutMs);
    });
    let output = '';
    try {
        while (true) {
            const { done, value } = await Promise.race([reader.read(), deadline]);
            if (done) throw new Error(`process ended before writing ${expected}`);
            output += decoder.decode(value, { stream: true });
            if (output.includes(expected)) return;
        }
    } finally {
        if (timeout) clearTimeout(timeout);
        reader.releaseLock();
    }
}

test('legacy main routes SIGINT through runtime shutdown', async () => {
    const workspace = join(fixtureRoot, 'workspace');
    await mkdir(workspace, { recursive: true });
    const proc = Bun.spawn({
        cmd: [process.execPath, join(repoRoot, 'src', '$main.ts')],
        cwd: workspace,
        env: {
            ...process.env,
            PORT: String(await freePort()),
            DB_PATH: join(workspace, '.hyper', '_runtime', 'sessions'),
        },
        stdout: 'pipe',
        stderr: 'pipe',
    });
    const stderr = new Response(proc.stderr).text();

    try {
        await waitForOutput(proc.stdout, '[server] listening', 10_000);
        process.kill(proc.pid, 'SIGINT');
        expect(await proc.exited).toBe(0);
        expect(await stderr).toBe('');
    } finally {
        try { proc.kill('SIGKILL'); } catch {}
    }
}, 15_000);
