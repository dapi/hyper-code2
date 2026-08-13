import { readFile, writeFile } from 'node:fs/promises';

type Config = {
    containmentPath: string;
    planPath: string;
    insideWriteProbe: string;
    outsideWriteProbe: string;
    homeProbePath: string;
    operatorKeychainPath: string;
    disposableHome: string;
    disposableTmp: string;
    sandboxProfileSha256: string;
    sandboxPolicyProbePath: string;
};

const configPath = process.argv[2];
if (!configPath) throw new Error('usage: bun r033-contained-child.ts <config.json>');
const config = await Bun.file(configPath).json() as Config;

const expectedEnvironment = ['HOME', 'LANG', 'LC_ALL', 'NO_COLOR', 'PATH', 'TMPDIR'];
const actualEnvironment = Object.keys(process.env).sort();
const credentialLikeEnvironment = actualEnvironment.filter(key =>
    /(?:AUTH|BEARER|CREDENTIAL|SECRET|TOKEN|API_?KEY|OPENAI|ANTHROPIC|CODEX|CLAUDE)/i.test(key)
);

async function denied(operation: () => Promise<unknown>): Promise<boolean> {
    try {
        await operation();
        return false;
    } catch {
        return true;
    }
}

const homeReadDenied = await denied(async () => { await readFile(config.homeProbePath); });
const outsideWriteDenied = await denied(async () => { await writeFile(config.outsideWriteProbe, 'must-not-exist'); });
const networkListenDenied = await denied(async () => {
    const server = Bun.listen({
        hostname: '127.0.0.1',
        port: 0,
        socket: { data() {} },
    });
    server.stop(true);
});
const keychainFileReadDenied = await denied(async () => { await readFile(config.operatorKeychainPath); });

const policyProbe = Bun.spawn([config.sandboxPolicyProbePath], {
    env: process.env,
    stdout: 'pipe',
    stderr: 'pipe',
});
const [policyProbeStdout, policyProbeStderr, policyProbeExitCode] = await Promise.all([
    new Response(policyProbe.stdout).text(),
    new Response(policyProbe.stderr).text(),
    policyProbe.exited,
]);
const policyProbeResult = policyProbeStdout.trim()
    ? JSON.parse(policyProbeStdout.trim()) as Record<string, boolean>
    : {};

const securityProbe = Bun.spawn([
    '/usr/bin/security',
    'find-generic-password',
    '-s', 'com.hyper-code2.r033.nonexistent',
    '-a', 'r033-contained-probe',
    config.operatorKeychainPath,
], {
    env: process.env,
    stdout: 'pipe',
    stderr: 'pipe',
});
const [securityStdout, securityStderr, securityExitCode] = await Promise.all([
    new Response(securityProbe.stdout).text(),
    new Response(securityProbe.stderr).text(),
    securityProbe.exited,
]);

await writeFile(config.insideWriteProbe, 'inside-write-ok\n');

const containment = {
    schemaVersion: 1,
    runner: 'r033-contained-child.ts@1',
    sequence: 1,
    phase: 'pre-injection-containment',
    sandbox: {
        implementation: 'macOS sandbox-exec deny-default profile',
        profileSha256: config.sandboxProfileSha256,
        networkPolicy: 'deny all network operations',
        writePolicy: 'allow writes only below disposable run root',
        homeReadPolicy: 'deny operator home except repository instrument path',
        machLookupPolicy: 'deny default; no mach-lookup allow rule',
    },
    environment: {
        expectedKeys: expectedEnvironment,
        actualKeys: actualEnvironment,
        exactAllowlist: JSON.stringify(actualEnvironment) === JSON.stringify(expectedEnvironment),
        credentialLikeKeys: credentialLikeEnvironment,
        providerAuthPresent: credentialLikeEnvironment.length > 0,
        disposableHome: process.env.HOME === config.disposableHome,
        disposableTmp: process.env.TMPDIR === config.disposableTmp,
    },
    probes: {
        operatorHomeFileReadDenied: homeReadDenied,
        outsideRootWriteDenied: outsideWriteDenied,
        insideRootWriteAllowed: await Bun.file(config.insideWriteProbe).exists(),
        networkListenDenied,
        operatorKeychainFileReadDenied: keychainFileReadDenied,
        keychainMachServicesDeniedBySandboxCheck:
            policyProbeExitCode === 0 &&
            policyProbeStderr === '' &&
            policyProbeResult['com.apple.securitydDenied'] === true &&
            policyProbeResult['com.apple.securityd.xpcDenied'] === true,
        nonexistentKeychainLookupFailed:
            securityExitCode !== 0 && securityStdout === '' && securityStderr.length > 0,
    },
};
const containmentPassed =
    containment.environment.exactAllowlist &&
    !containment.environment.providerAuthPresent &&
    containment.environment.disposableHome &&
    containment.environment.disposableTmp &&
    Object.values(containment.probes).every(Boolean);
await Bun.write(config.containmentPath, JSON.stringify({ ...containment, passed: containmentPassed }, null, 2));
if (!containmentPassed) throw new Error('R033_STOP_01_CONTAINMENT_FAILED');

const candidates = ['CAND-01', 'CAND-02', 'CAND-03', 'CAND-04', 'CAND-05'] as const;
const cells = Array.from({ length: 14 }, (_, index) => `CC-${String(index + 1).padStart(2, '0')}`);
const cases = cells.flatMap((cell, cellIndex) =>
    candidates.map((_, candidateOffset) => candidates[(candidateOffset + cellIndex) % candidates.length])
        .map(candidate => ({
            candidate,
            cell,
            agentInput: {
                credential: 'opaque-reference-only',
                provider: cell === 'CC-04' || cell === 'CC-05' ? 'anthropic-shape' : 'bearer-shape',
            },
        }))
);
await Bun.write(config.planPath, JSON.stringify({
    schemaVersion: 1,
    runner: 'r033-contained-child.ts@1',
    sequence: 2,
    candidateCount: candidates.length,
    cellCount: cells.length,
    caseCount: cases.length,
    rotatingCandidateOrder: true,
    providerAuthPassedToChild: false,
    cases,
}, null, 2));
