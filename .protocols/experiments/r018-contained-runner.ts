import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dir, '../..');
const runId = process.env.R018_RUN_ID ?? '20260813-keychain-contained-static-mock-03';
const evidenceRoot = resolve(process.env.R018_ARTIFACT_DIR ?? join(import.meta.dir, 'runs', 'R-018', runId));
const sandboxExec = Bun.which('sandbox-exec');
if (process.platform !== 'darwin' || !sandboxExec) {
    throw new Error('R018_STOP_02: macOS sandbox-exec is required');
}
await mkdir(evidenceRoot, { recursive: true });
if ((await readdir(evidenceRoot)).length > 0) {
    throw new Error(`R018_STOP_02: evidence directory must be empty: ${evidenceRoot}`);
}

const runRoot = await realpath(await mkdtemp(join(tmpdir(), 'hyper-code2-r018-contained-')));
const disposableHome = join(runRoot, 'home');
const disposableTmp = join(runRoot, 'tmp');
const workspace = join(runRoot, 'workspace');
await Promise.all([
    mkdir(disposableHome, { recursive: true }),
    mkdir(disposableTmp, { recursive: true }),
    mkdir(workspace, { recursive: true }),
]);
const outsideRoot = await realpath(await mkdtemp(join(tmpdir(), 'hyper-code2-r018-denied-')));
const bunExecutable = Bun.which('bun') ?? process.execPath;
const operatorHome = process.env.HOME;
if (!operatorHome) throw new Error('R018_STOP_02: parent HOME is required only to define the deny rule');
const homeProbePath = join(operatorHome, '.zshrc');
if (!(await Bun.file(homeProbePath).exists())) {
    throw new Error('R018_STOP_02: non-secret operator-home probe fixture is absent');
}
const operatorKeychainPath = join(operatorHome, 'Library', 'Keychains', 'login.keychain-db');
if (!(await Bun.file(operatorKeychainPath).exists())) {
    throw new Error('R018_STOP_02: operator keychain path probe fixture is absent');
}
const policyProbePath = join(runRoot, 'sandbox-policy-probe');
const policyProbeSource = resolve(import.meta.dir, 'r018-sandbox-policy-probe.c');
const compileProbe = Bun.spawn(['/usr/bin/clang', policyProbeSource, '-o', policyProbePath], {
    cwd: workspace,
    env: { PATH: '/usr/bin:/bin' },
    stdout: 'pipe',
    stderr: 'pipe',
});
const [compileStdout, compileStderr, compileExitCode] = await Promise.all([
    new Response(compileProbe.stdout).text(),
    new Response(compileProbe.stderr).text(),
    compileProbe.exited,
]);
if (compileExitCode !== 0) {
    throw new Error(`R018_STOP_02: policy probe compile failed: ${compileStdout}${compileStderr}`);
}

function escapeProfile(value: string): string {
    return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}
const profile = `(version 1)
(deny default)
(allow process*)
(allow sysctl-read)
(allow file-read-metadata)
(allow file-read* (require-not (subpath "${escapeProfile(operatorHome)}")))
(allow file-read* (literal "${escapeProfile(bunExecutable)}") (subpath "${escapeProfile(repoRoot)}") (subpath "${escapeProfile(runRoot)}"))
(allow file-write* (subpath "${escapeProfile(runRoot)}"))`;
const profileSha256 = createHash('sha256').update(profile).digest('hex');
const sanitizedProfile = profile
    .replaceAll(bunExecutable, '[BUN_EXECUTABLE]')
    .replaceAll(repoRoot, '[REPOSITORY_ROOT]')
    .replaceAll(runRoot, '[DISPOSABLE_RUN_ROOT]')
    .replaceAll(operatorHome, '[OPERATOR_HOME]');

const containmentPath = join(runRoot, 'containment.json');
const controlsPath = join(runRoot, 'controls.json');
const capturePath = join(runRoot, 'capture.json');
const configPath = join(runRoot, 'config.json');
await Bun.write(configPath, JSON.stringify({
    containmentPath,
    controlsPath,
    capturePath,
    insideWriteProbe: join(runRoot, 'inside-write-probe.txt'),
    outsideWriteProbe: join(outsideRoot, 'outside-write-probe.txt'),
    homeProbePath,
    disposableHome,
    disposableTmp,
    repoProbePath: join(repoRoot, 'package.json'),
    sandboxProfileSha256: profileSha256,
    sandboxPolicyProbePath: policyProbePath,
    operatorKeychainPath,
}));

const childScript = resolve(import.meta.dir, 'r018-contained-child.ts');
const proc = Bun.spawn([sandboxExec, '-p', profile, bunExecutable, childScript, configPath], {
    cwd: workspace,
    env: {
        HOME: disposableHome,
        LANG: 'C.UTF-8',
        LC_ALL: 'C.UTF-8',
        NO_COLOR: '1',
        PATH: '/usr/bin:/bin',
        TMPDIR: disposableTmp,
    },
    stdout: 'pipe',
    stderr: 'pipe',
});
const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
]);

function sanitize(text: string): string {
    return text
        .replaceAll(operatorHome, '[REDACTED_OPERATOR_HOME]')
        .replaceAll(repoRoot, '[REDACTED_REPO_ROOT]')
        .replaceAll(runRoot, '[REDACTED_RUN_ROOT]')
        .replaceAll(outsideRoot, '[REDACTED_OUTSIDE_ROOT]');
}
await Bun.write(join(evidenceRoot, 'child.stdout.log'), sanitize(stdout));
await Bun.write(join(evidenceRoot, 'child.stderr.log'), sanitize(stderr));
if (exitCode !== 0) {
    throw new Error(`R018_STOP_02: contained child failed with exit ${exitCode}`);
}
for (const name of ['containment.json', 'controls.json', 'capture.json']) {
    if (!(await Bun.file(join(runRoot, name)).exists())) {
        throw new Error(`R018_STOP_02: missing child evidence ${name}`);
    }
    await Bun.write(join(evidenceRoot, name), sanitize(await readFile(join(runRoot, name), 'utf8')));
}
await Bun.write(join(evidenceRoot, 'sandbox-profile.sb'), sanitizedProfile + '\n');

async function sha256File(path: string): Promise<string> {
    return createHash('sha256').update(await readFile(path)).digest('hex');
}
const sourceFiles = [
    'r018-contained-runner.ts',
    'r018-contained-child.ts',
    'r018-sentinel-lib.ts',
    'r018-sentinel.test.ts',
    'r018-sandbox-policy-probe.c',
];
const manifest = {
    schemaVersion: 1,
    runId,
    collectedAt: '2026-08-13',
    repository: {
        commit: (await Bun.$`git rev-parse HEAD`.cwd(repoRoot).text()).trim(),
        sourceTreeDiffLines: Number((await Bun.$`git diff -- src`.cwd(repoRoot).text()).split('\n').filter(Boolean).length),
    },
    instrument: {
        runner: 'r018-contained-runner.ts@2',
        child: 'r018-contained-child.ts@2',
        bunVersion: Bun.version,
        platform: `${process.platform}-${process.arch}`,
        sourceSha256: Object.fromEntries(await Promise.all(sourceFiles.map(async name => [
            name,
            await sha256File(join(import.meta.dir, name)),
        ]))),
    },
    executionBoundary: {
        childPid: proc.pid,
        parentPid: process.pid,
        separateProcess: proc.pid !== process.pid,
        osSandboxEnforced: true,
        sandboxProfileSha256: profileSha256,
        broadMachLookupAllowed: false,
        sandboxPolicyProbeCompiledOutsideChild: true,
        providerAuthPassedToChild: false,
        providerCalls: 0,
        disposableHomeAndTmp: true,
        stableCarrierSanitizedByParent: true,
    },
    order: ['containment.json', 'controls.json', 'capture.json'],
    stop: {
        fired: 'STOP-03',
        afterCell: 'CELL-01',
        remainingCellsExecuted: false,
    },
    priorCarriers: [
        '20260813-static-mock-01 retained unchanged',
        '20260813-os-contained-static-mock-02 retained unchanged',
    ],
};
await Bun.write(join(evidenceRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));

const checksumNames = (await readdir(evidenceRoot)).filter(name => name !== 'checksums.sha256').sort();
const lines: string[] = [];
for (const name of checksumNames) lines.push(`${await sha256File(join(evidenceRoot, name))}  ${name}`);
await Bun.write(join(evidenceRoot, 'checksums.sha256'), `${lines.join('\n')}\n`);
console.log(JSON.stringify({ evidenceRoot, manifest }, null, 2));
