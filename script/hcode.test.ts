import { afterEach, describe, expect, test } from 'bun:test';
import { chmod, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dir, '..');
const fixtureRoot = join(repoRoot, '.test-tmp', 'hcode-launcher');

afterEach(async () => {
    await rm(fixtureRoot, { recursive: true, force: true });
});

async function writeFakeBun(source: string) {
    const binDir = join(fixtureRoot, 'bin');
    await mkdir(binDir, { recursive: true });
    const fakeBun = join(binDir, 'bun');
    await writeFile(fakeBun, source, { mode: 0o755 });
    await chmod(fakeBun, 0o755);
    return fakeBun;
}

async function runLauncher(
    bunBin: string,
    cwd: string,
    launcher = join(repoRoot, 'hcode'),
    path = process.env.PATH,
) {
    const proc = Bun.spawn({
        cmd: [launcher, '--help'],
        cwd,
        env: { ...process.env, BUN_BIN: bunBin, PATH: path },
        stdout: 'pipe',
        stderr: 'pipe',
    });
    const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
    ]);
    return { stdout, stderr, exitCode };
}

describe('hcode launcher', () => {
    test('rejects an unsupported Bun before entering the CLI or creating workspace state', async () => {
        const workspace = join(fixtureRoot, 'workspace');
        await mkdir(workspace, { recursive: true });
        const fakeBun = await writeFakeBun(`#!/bin/sh
if [ "$1" = "--version" ]; then printf '1.2.21\\n'; exit 0; fi
printf 'CLI runtime was entered\\n' >&2
exit 99
`);

        const result = await runLauncher(fakeBun, workspace);

        expect(result.exitCode).toBe(1);
        expect(result.stderr).toContain('Bun >= 1.3.13 is required');
        expect(result.stderr).not.toContain('CLI runtime was entered');
        expect(existsSync(join(workspace, '.hyper'))).toBe(false);
    });

    test('hands control to a supported Bun', async () => {
        const workspace = join(fixtureRoot, 'workspace');
        await mkdir(workspace, { recursive: true });
        const fakeBun = await writeFakeBun(`#!/bin/sh
if [ "$1" = "--version" ]; then printf '1.3.14\\n'; exit 0; fi
exec '${process.execPath}' "$@"
`);

        const result = await runLauncher(fakeBun, workspace);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Usage:');
        expect(result.stderr).toBe('');
    });

    test('finds its entrypoint when invoked through a package-manager symlink', async () => {
        const workspace = join(fixtureRoot, 'workspace');
        const binDir = join(fixtureRoot, 'node_modules', '.bin');
        const launcher = join(binDir, 'hcode');
        await mkdir(workspace, { recursive: true });
        await mkdir(binDir, { recursive: true });
        await symlink(relative(binDir, join(repoRoot, 'hcode')), launcher);
        const fakeBun = await writeFakeBun(`#!/bin/sh
if [ "$1" = "--version" ]; then printf '1.3.14\\n'; exit 0; fi
exec '${process.execPath}' "$@"
`);

        const result = await runLauncher(fakeBun, workspace, 'hcode', `${binDir}:${process.env.PATH}`);

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Usage:');
        expect(result.stderr).toBe('');
    });
});
