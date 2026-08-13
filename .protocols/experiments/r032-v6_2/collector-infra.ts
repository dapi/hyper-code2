import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { HEAD, assertSemanticResults, semanticFixture } from './semantic-contract';
import { auditFrozenFiles, resolveHeadWithoutSpawn } from './outer-gate';

const sha = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex');
export type DisposablePaths = { root: string; home: string; tmp: string };

export function sandboxProfile(repo: string, paths: DisposablePaths) {
    const reads = [process.execPath, '/usr/lib', '/System/Library', '/dev/null', repo].map((path) => `(subpath "${path}")`).join(' ');
    return `(version 1)(deny default)(allow sysctl-read)(allow mach-lookup (global-name "com.apple.system.logger"))(allow file-read* ${reads})(allow file-write* (subpath "${paths.root}"))(allow process-exec (literal "${process.execPath}"))(allow process-fork)(deny network*)`;
}

export async function launchContained(repo: string, paths: DisposablePaths, request: unknown, deadlineMs = 3_000) {
    await mkdir(paths.home, { recursive: false }); await mkdir(paths.tmp, { recursive: false });
    const env = { PATH: '/usr/bin:/bin', HOME: paths.home, TMPDIR: paths.tmp, R032_V62_CHILD: '1' };
    const args = ['/usr/bin/sandbox-exec', '-p', sandboxProfile(repo, paths), process.execPath, resolve(repo, '.protocols/experiments/r032-v6_2/contained-child.ts')];
    const child = Bun.spawn(args, { cwd: paths.root, env, stdin: 'pipe', stdout: 'pipe', stderr: 'pipe' });
    child.stdin.write(JSON.stringify(request)); child.stdin.end();
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, deadlineMs);
    const [stdout, stderr, exitCode] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    clearTimeout(timer);
    assert(!timedOut, 'contained child exceeded whole-run deadline');
    assert.equal(exitCode, 0, stderr);
    const parsed = JSON.parse(stdout);
    return { exitCode, timedOut, envKeys: Object.keys(env).sort(), stdoutDigest: sha(stdout), stderrDigest: sha(stderr), receipt: parsed };
}

export function buildCarrier(rows: unknown[], semantic: ReturnType<typeof semanticFixture>, containment: unknown, provenance: unknown) {
    assertSemanticResults(semantic); // same full suite, necessarily before artifact construction/write
    const rowHashes = rows.map((row, index) => ({ index, sha256: sha(JSON.stringify(row)) }));
    const artifacts = {
        'results.json': rows,
        'row-hashes.json': rowHashes,
        'controls.json': semantic.controls,
        'containment.json': containment,
        'provenance.json': provenance,
        'manifest.json': { schemaVersion: 1, head: HEAD, rowCount: rows.length, semanticAssertions: 'passed-before-build' },
    };
    const executionDigest = sha(JSON.stringify({ rows: rowHashes, containment, provenance }));
    return { artifacts, executionDigest };
}

export async function writeCarrierAfterAssertions(runDir: string, built: ReturnType<typeof buildCarrier>) {
    await mkdir(runDir, { recursive: false });
    for (const [name, value] of Object.entries(built.artifacts)) await writeFile(resolve(runDir, name), JSON.stringify(value, null, 2) + '\n');
    const names = Object.keys(built.artifacts).sort();
    const sums = await Promise.all(names.map(async (name) => `${sha(await readFile(resolve(runDir, name)))}  ${name}`));
    await writeFile(resolve(runDir, 'SHA256SUMS'), sums.join('\n') + '\n');
}

export async function noSpawnOuterGate(repo: string, frozen: Record<string, string>) {
    assert.equal(await resolveHeadWithoutSpawn(repo), HEAD);
    return auditFrozenFiles(repo, frozen);
}
