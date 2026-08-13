type Request = {
    phase: 'enqueue' | 'use';
    candidate: 'CAN-06' | 'COM-03';
    principal: string | null;
    scope: string | null;
    generation: number | null;
    expectedGeneration: number;
    credentialDigest: string | null;
    brokerAvailable: boolean;
};

export function decideBroker(request: Request) {
    if (!request.brokerAvailable) return { allow: false, reason: 'broker-unavailable' };
    if (!request.principal || !request.credentialDigest) return { allow: false, reason: 'broker-context-missing' };
    if (request.scope !== 'privileged') return { allow: false, reason: 'broker-scope-deny' };
    if (request.phase === 'use' && request.generation !== request.expectedGeneration) {
        return { allow: false, reason: 'broker-generation-stale' };
    }
    return { allow: true, reason: `broker-${request.phase}-allow`, rootCalls: request.phase === 'use' ? 1 : 0 };
}

if (import.meta.main) {
    const input = await new Response(Bun.stdin.stream()).text();
    const request = JSON.parse(input) as Request;
    let outsideWriteDenied = false;
    try { await Bun.write('/tmp/r032-v6_1-outside-probe', 'must-not-write'); } catch { outsideWriteDenied = true; }
    process.stdout.write(JSON.stringify({ ...decideBroker(request), containment: {
        home: process.env.HOME, tmpdir: process.env.TMPDIR, cwd: process.cwd(), outsideWriteDenied,
    } }) + '\n');
}
