import { readFile, writeFile } from 'node:fs/promises';

import { mkTestCtx } from '../../src/_testCtx.entry';
import executeMarker from '../../src/agent/executeMarker';
import buildLlmRequest from '../../src/agent/buildLlmRequest';
import { detectSentinel, SENTINEL, sentinelForms, sha256 } from './r018-sentinel-lib';

type Config = {
    containmentPath: string;
    controlsPath: string;
    capturePath: string;
    insideWriteProbe: string;
    outsideWriteProbe: string;
    homeProbePath: string;
    disposableHome: string;
    disposableTmp: string;
    repoProbePath: string;
    sandboxProfileSha256: string;
    sandboxPolicyProbePath: string;
    operatorKeychainPath: string;
};

const configPath = process.argv[2];
if (!configPath) throw new Error('usage: bun r018-contained-child.ts <config.json>');
const config = await Bun.file(configPath).json() as Config;

const allowedEnvironment = ['HOME', 'LANG', 'LC_ALL', 'NO_COLOR', 'PATH', 'TMPDIR'];
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

const repoReadAllowed = await Bun.file(config.repoProbePath).exists();
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
    '-s', 'com.hyper-code2.r018.nonexistent',
    '-a', 'r018-contained-probe',
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
    runner: 'r018-contained-child.ts@2',
    sequence: 1,
    phase: 'pre-injection-containment',
    sandbox: {
        implementation: 'macOS sandbox-exec deny-default profile',
        profileSha256: config.sandboxProfileSha256,
        networkPolicy: 'no network operations allowed',
        writePolicy: 'writes allowed only below the disposable run root',
        homeReadPolicy: 'operator home denied except the repository path required to load the test target',
        machLookupPolicy: 'deny-default; no mach-lookup allow rule',
    },
    environment: {
        expectedKeys: allowedEnvironment,
        actualKeys: actualEnvironment,
        exactAllowlist: JSON.stringify(actualEnvironment) === JSON.stringify(allowedEnvironment),
        credentialLikeKeys: credentialLikeEnvironment,
        providerAuthPresent: credentialLikeEnvironment.length > 0,
        disposableHome: process.env.HOME === config.disposableHome,
        disposableTmp: process.env.TMPDIR === config.disposableTmp,
    },
    probes: {
        repoReadAllowed,
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
        nonexistentKeychainServiceLookupFailedWithSecuritydMachLookupDenied:
            securityExitCode !== 0 &&
            securityStdout === '' &&
            securityStderr.length > 0 &&
            policyProbeExitCode === 0,
    },
};
const containmentPassed =
    containment.environment.exactAllowlist &&
    !containment.environment.providerAuthPresent &&
    containment.environment.disposableHome &&
    containment.environment.disposableTmp &&
    Object.values(containment.probes).every(Boolean);
await Bun.write(config.containmentPath, JSON.stringify({ ...containment, passed: containmentPassed }, null, 2));
if (!containmentPassed) throw new Error('R018_STOP_02_CONTAINMENT_FAILED');

const forms = sentinelForms();
const controls = {
    schemaVersion: 1,
    sequence: 2,
    phase: 'pre-injection-detector-controls',
    negative: detectSentinel('bounded synthetic capture without fixture value'),
    positive: forms.map(form => ({
        id: form.id,
        values: form.values.map(value => ({
            digest: sha256(value),
            detected: detectSentinel(value).some(hit => hit.formId === form.id),
        })),
    })),
};
await Bun.write(config.controlsPath, JSON.stringify(controls, null, 2));

const originalFetch = globalThis.fetch;
globalThis.fetch = (() => { throw new Error('R018_NETWORK_DENIED'); }) as typeof fetch;
try {
    const ctx: any = await mkTestCtx();
    ctx.env = { R018_SYNTHETIC_API_KEY: SENTINEL };
    ctx.state.settingsRegistry.set('r018.syntheticApiKey', { type: 'secret', env: 'R018_SYNTHETIC_API_KEY' });
    ctx.fns.repl.eval = (innerCtx: any) => innerCtx.fns.settings.getString(innerCtx, {
        module: 'r018', scopeType: 'global', key: 'syntheticApiKey',
    });

    const agent = ctx.fns.agent.start(ctx, { model: 'mock:r018-contained' });
    ctx.fns.session.save(ctx, { agent });
    await executeMarker(ctx, {
        agent,
        call: { kind: 'eval', content: 'synthetic fixture read through declared setting' },
        usage: {},
    });

    const messages = ctx.fns.session.getMessages(ctx, { id: agent.id });
    const events = ctx.fns.session.getEvents(ctx, { id: agent.id });
    const request = await buildLlmRequest(ctx, { agent });
    const sinks = {
        syntheticResultMessage: detectSentinel(String(messages[1]?.content ?? '')),
        persistedEvent: detectSentinel(JSON.stringify(events)),
        renderedEventHtml: detectSentinel(String(events[0]?.html ?? '')),
        preProviderRequest: detectSentinel(JSON.stringify(request.messages)),
    };
    const prohibitedHit = Object.values(sinks).some(hits => hits.length > 0);

    await Bun.write(config.capturePath, JSON.stringify({
        schemaVersion: 1,
        runner: 'r018-contained-child.ts@2',
        sequence: 3,
        phase: 'synthetic-injection',
        providerCalls: 0,
        fixture: { kind: 'deterministic non-secret', digest: sha256(SENTINEL) },
        forms: forms.map(form => ({ id: form.id, label: form.label, digests: form.values.map(sha256) })),
        cell: {
            id: 'CELL-01',
            source: 'declared setting env fixture',
            action: 'eval mock result',
            outcome: 'success',
            sinks,
            stopRule: prohibitedHit ? 'STOP-03' : null,
        },
        unexecutedAfterStop: prohibitedHit
            ? ['error', 'serialization-failure', 'retry-cancellation', 'additional-source-cells']
            : [],
    }, null, 2));
} finally {
    globalThis.fetch = originalFetch;
}
