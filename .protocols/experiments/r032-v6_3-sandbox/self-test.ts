import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { arch, release, tmpdir } from 'node:os';
import { resolve } from 'node:path';

const HEAD = '18ea94437390bcf822df0165f79246fab0da436e';
const MAX_OUTPUT_BYTES = 32 * 1024;
const MAX_STDERR_BYTES = 4 * 1024;
const BUILD_DEADLINE_MS = 20_000;
const CHILD_DEADLINE_MS = 3_000;
const repo = resolve(import.meta.dir, '../../..');
const childSource = resolve(import.meta.dir, 'contained-child.js');
const manifestFile = resolve(import.meta.dir, 'profile-manifest.json');
const readmeFile = resolve(import.meta.dir, 'README.md');
const operatorHome = process.env.HOME;
assert(operatorHome, 'R032_V63_OPERATOR_HOME_REQUIRED');

// The source/status gate precedes all disposable state and child execution.
assert.equal(await resolveHead(repo), HEAD, 'R032_V63_HEAD_DRIFT');
const sourceBytes = await readFile(childSource);
const sourceSha256 = sha(sourceBytes);
const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
assert.equal(manifest.schemaVersion, 1, 'R032_V63_MANIFEST_SCHEMA');
assert.equal(manifest.status, 'EXACT_COMPILED_PROBE_ONLY', 'R032_V63_MANIFEST_STATUS');
assert.equal(manifest.collectionAuthorized, false, 'R032_V63_MANIFEST_AUTHORITY');
assert.equal(manifest.head, HEAD, 'R032_V63_MANIFEST_HEAD');
assert.equal(manifest.files['contained-child.js'].sha256, sourceSha256, 'R032_V63_SOURCE_DRIFT');
assert.equal(manifest.files['self-test.ts'].sha256, sha(await readFile(import.meta.path)), 'R032_V63_SELF_TEST_DRIFT');
assert.equal(manifest.files['README.md'].sha256, sha(await readFile(readmeFile)), 'R032_V63_README_DRIFT');
assert.equal(manifest.buildToolSha256, sha(await readFile(process.execPath)), 'R032_V63_BUILD_TOOL_DRIFT');
assert.deepEqual(manifest.environment, {
    bunVersion: process.versions.bun,
    platform: process.platform,
    architecture: arch(),
    darwinRelease: release(),
}, 'R032_V63_ENVIRONMENT_DRIFT');
assert.equal(manifest.profileTemplateSha256, sha(sandboxProfile({
    root: '[DISPOSABLE_ROOT]', operatorHome: '[OPERATOR_HOME]', binary: '[COMPILED_BINARY]',
})), 'R032_V63_PROFILE_TEMPLATE_DRIFT');

// sandbox-exec matches canonical /private/var paths, not macOS's /var symlink.
const root = await realpath(await mkdtemp(resolve(tmpdir(), 'r032-v63-root-')));
const buildRoot = await realpath(await mkdtemp(resolve(tmpdir(), 'r032-v63-build-')));
const deniedRoot = await realpath(await mkdtemp(resolve(tmpdir(), 'r032-v63-denied-')));
try {
    const home = resolve(root, 'home');
    const temp = resolve(root, 'tmp');
    await Promise.all([mkdir(home), mkdir(temp)]);

    // Only synthetic bytes are read behaviorally. Real HOME/keychain paths are
    // supplied solely to sandbox_check and are never opened by parent or child.
    const outsideReadProbe = resolve(deniedRoot, 'outside-read.txt');
    await writeFile(outsideReadProbe, 'synthetic-readable-fixture');
    assert.equal((await stat(outsideReadProbe)).isFile(), true, 'R032_V63_READ_PROBE_FIXTURE');
    assert.equal(await readFile(outsideReadProbe, 'utf8'), 'synthetic-readable-fixture', 'R032_V63_READ_PROBE_UNREADABLE');

    const binary = resolve(buildRoot, 'contained-child');
    const build = await runBounded(
        [process.execPath, 'build', '--compile', childSource, '--outfile', binary],
        { cwd: repo, env: process.env }, BUILD_DEADLINE_MS,
    );
    assert.equal(build.timedOut, false, 'R032_V63_BUILD_DEADLINE');
    assert.equal(build.stdout.overflow || build.stderr.overflow, false, 'R032_V63_BUILD_OUTPUT_OVERFLOW');
    assert.equal(build.exitCode, 0, `R032_V63_BUILD_EXIT_${build.exitCode}_STDERR_${sha(build.stderr.bytes)}`);
    assert.equal((await stat(binary)).isFile(), true, 'R032_V63_BINARY_MISSING');
    const binarySha256 = sha(await readFile(binary));
    assert.equal(binarySha256, manifest.compiledBinarySha256, 'R032_V63_BINARY_DRIFT');

    const profile = sandboxProfile({ root, operatorHome, binary });
    const request = {
        schemaVersion: 2,
        operatorHomePath: resolve(operatorHome, '.zshrc'),
        keychainPath: resolve(operatorHome, 'Library/Keychains/login.keychain-db'),
        outsideReadProbe,
        outsideWriteProbe: resolve(deniedRoot, 'outside-write'),
        selfExecutable: binary,
        expectedCwd: '/',
    };
    const env = { PATH: '/usr/bin:/bin', HOME: home, TMPDIR: temp, R032_V63_CHILD: '1' };
    const first = await runContained(profile, binary, '/', env, request);
    const second = await runContained(profile, binary, '/', env, request);
    assert.deepEqual(second.receipt, first.receipt, 'R032_V63_REPEAT_RECEIPT_DRIFT');
    assert.deepEqual(first.receipt, manifest.expectedReceipt, 'R032_V63_MANIFEST_RECEIPT_DRIFT');
    assert.deepEqual(Object.keys(env).sort(), ['HOME', 'PATH', 'R032_V63_CHILD', 'TMPDIR']);

    console.log(JSON.stringify({
        status: 'PASS_EXACT_COMPILED_SANDBOX_PROBE_ONLY',
        collectionAuthorized: false,
        head: HEAD,
        compileOutsideSandbox: true,
        sourceSha256,
        binarySha256,
        profileSha256: sha(profile),
        profileSubstitutionSpec: {
            root: basenameOnly(root),
            operatorHome: 'process.env.HOME (path policy only; bytes never read)',
            binary: basenameOnly(binary),
        },
        profileTemplateSha256: sha(sandboxProfile({
            root: '[DISPOSABLE_ROOT]', operatorHome: '[OPERATOR_HOME]', binary: '[COMPILED_BINARY]',
        })),
        buildStdoutSha256: sha(build.stdout.bytes),
        buildStderrSha256: sha(build.stderr.bytes),
        childStdoutSha256: sha(first.stdout.bytes),
        childStderrSha256: sha(first.stderr.bytes),
        receipt: first.receipt,
        runtimeReadClosure: manifest.runtimeReadClosure,
        disposableRoots: [basenameOnly(root), basenameOnly(buildRoot), basenameOnly(deniedRoot)],
    }));
} finally {
    await Promise.all([
        rm(root, { recursive: true, force: true }),
        rm(buildRoot, { recursive: true, force: true }),
        rm(deniedRoot, { recursive: true, force: true }),
    ]);
}

export function sandboxProfile(input: { root: string; operatorHome: string; binary: string }) {
    const e = escapeProfile;
    return `(version 1)\n(deny default)\n(allow sysctl-read)\n(allow file-read-metadata (require-not (subpath "${e(input.operatorHome)}")))\n(allow file-read-metadata (literal "${e(input.binary)}"))\n(allow file-read* (literal "/") (literal "${e(input.binary)}") (literal "/usr/lib/system/libsystem_sandbox.dylib") (subpath "/System/Volumes/Preboot/Cryptexes/OS") (literal "/dev/null") (literal "/dev/dtracehelper") (subpath "/private/var/db/timezone"))\n(allow file-write* (subpath "${e(input.root)}"))\n(allow process-exec (literal "${e(input.binary)}"))\n(deny network*)`;
}

async function runContained(profile: string, binary: string, cwd: string, env: Record<string, string>, request: object) {
    const result = await runBounded(
        ['/usr/bin/sandbox-exec', '-p', profile, binary],
        { cwd, env, stdin: JSON.stringify(request) }, CHILD_DEADLINE_MS,
    );
    assert.equal(result.timedOut, false, 'R032_V63_CHILD_DEADLINE');
    assert.equal(result.stdout.overflow, false, 'R032_V63_STDOUT_OVERFLOW');
    assert.equal(result.stderr.overflow, false, 'R032_V63_STDERR_OVERFLOW');
    assert.equal(result.exitCode, 0, `R032_V63_CHILD_EXIT_${result.exitCode}_STDERR_${sha(result.stderr.bytes)}`);
    const receipt = JSON.parse(new TextDecoder().decode(result.stdout.bytes));
    assert.deepEqual(receipt, expectedReceipt());
    return { ...result, receipt };
}

function expectedReceipt() {
    return {
        schemaVersion: 2,
        containmentPassedBeforeRoot: true,
        probes: {
            connect: { policyDenied: true, behaviorSucceeded: false },
            bind: { policyDenied: true, behaviorSucceeded: false },
            outsideWrite: { policyDenied: true, behaviorSucceeded: false },
            outsideRead: { policyDenied: true, behaviorSucceeded: false },
            nonBunExec: { policyDenied: true, behaviorSucceeded: false },
            forkOrDescendant: { policyDenied: true, behaviorSucceeded: false },
            operatorHomeReadPolicy: { policyDenied: true, behaviorAttempted: false },
            keychainReadPolicy: { policyDenied: true, behaviorAttempted: false },
            securityd: { policyDenied: true, behaviorAttempted: false },
            securitydXpc: { policyDenied: true, behaviorAttempted: false },
        },
        rootCalls: 1,
    };
}

async function runBounded(
    argv: string[],
    options: { cwd: string; env: Record<string, string | undefined>; stdin?: string },
    deadlineMs: number,
) {
    const child = Bun.spawn(argv, {
        cwd: options.cwd,
        env: options.env,
        stdin: options.stdin === undefined ? 'ignore' : 'pipe',
        stdout: 'pipe',
        stderr: 'pipe',
    });
    if (options.stdin !== undefined) {
        child.stdin.write(options.stdin);
        child.stdin.end();
    }
    let timedOut = false;
    const deadline = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, deadlineMs);
    const [stdout, stderr, exitCode] = await Promise.all([
        readBounded(child.stdout, MAX_OUTPUT_BYTES, () => child.kill('SIGKILL')),
        readBounded(child.stderr, MAX_STDERR_BYTES, () => child.kill('SIGKILL')),
        child.exited,
    ]);
    clearTimeout(deadline);
    return { stdout, stderr, exitCode, timedOut };
}

function escapeProfile(value: string) { return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"'); }
function sha(value: Uint8Array | string) { return createHash('sha256').update(value).digest('hex'); }
function basenameOnly(value: string) { return value.split('/').at(-1); }

async function readBounded(stream: ReadableStream<Uint8Array>, limit: number, overflow: () => void) {
    const reader = stream.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
        const next = await reader.read(); if (next.done) break;
        size += next.value.byteLength;
        if (size > limit) { overflow(); return { bytes: new Uint8Array(), overflow: true }; }
        chunks.push(next.value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return { bytes, overflow: false };
}

async function resolveHead(worktree: string) {
    const dotGit = resolve(worktree, '.git');
    const dotGitStat = await stat(dotGit);
    const gitDir = dotGitStat.isDirectory()
        ? dotGit
        : resolve(worktree, (await readFile(dotGit, 'utf8')).trim().slice('gitdir: '.length));
    const head = (await readFile(resolve(gitDir, 'HEAD'), 'utf8')).trim();
    if (!head.startsWith('ref: ')) return head;
    const ref = head.slice(5); const commonDirFile = resolve(gitDir, 'commondir');
    const common = await Bun.file(commonDirFile).exists()
        ? resolve(gitDir, (await readFile(commonDirFile, 'utf8')).trim())
        : gitDir;
    try { return (await readFile(resolve(gitDir, ref), 'utf8')).trim(); } catch {}
    try { return (await readFile(resolve(common, ref), 'utf8')).trim(); } catch {}
    const packed = await readFile(resolve(common, 'packed-refs'), 'utf8');
    return packed.split('\n').find((line) => line.endsWith(` ${ref}`))?.split(' ')[0];
}
