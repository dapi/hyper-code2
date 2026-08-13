import { CallableRootSpy, invokeChildOnlyRoot } from './semantic-contract';

async function denied(name: string, action: () => unknown | Promise<unknown>) {
    try { await action(); return { name, denied: false }; }
    catch (error: any) { return { name, denied: true, errorClass: error?.constructor?.name ?? 'Error', messageDigestInput: String(error?.message ?? error).slice(0, 120) }; }
}

if (import.meta.main) {
    const request = JSON.parse(await new Response(Bun.stdin.stream()).text());
    const root = new CallableRootSpy();
    const rootReceipt = invokeChildOnlyRoot(request.id, request.allow, root);
    const probes = [
        await denied('connect', () => Bun.connect({ hostname: '127.0.0.1', port: 9, socket: { data() {} } } as any)),
        await denied('listen', () => Bun.serve({ port: 0, fetch: () => new Response('x') })),
        await denied('outside-write', () => Bun.write('/tmp/r032-v62-outside', 'x')),
        await denied('home-parent-read', () => Bun.file(request.parentHomeProbe).text()),
        await denied('mach-exec', async () => { const p = Bun.spawn(['/usr/bin/id'], { stdout: 'pipe', stderr: 'pipe' }); await p.exited; }),
    ];
    process.stdout.write(JSON.stringify({ rootReceipt, rootCalls: root.calls, probes,
        environment: Object.fromEntries(Object.entries(process.env).sort()), cwd: process.cwd() }) + '\n');
}
