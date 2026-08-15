import { afterEach, describe, expect, test } from 'bun:test';
import { chmod, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import main, { FORCED_SHUTDOWN_EXIT_CODE } from './hcode';

const repoRoot = resolve(import.meta.dir, '..');
const fixtureRoot = join(repoRoot, '.test-tmp', 'hcode-launcher');

afterEach(async () => {
    await rm(fixtureRoot, { recursive: true, force: true });
});

async function writeFakeBun(source: string, name = 'bun') {
    const binDir = join(fixtureRoot, 'bin');
    await mkdir(binDir, { recursive: true });
    const fakeBun = join(binDir, name);
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

async function waitForPath(path: string, timeoutMs: number) {
    const deadline = Date.now() + timeoutMs;
    while (!existsSync(path)) {
        if (Date.now() >= deadline)
            throw new Error(`timed out waiting for ${path}`);
        await Bun.sleep(10);
    }
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

    test('supports a configured Bun executable path containing spaces', async () => {
        const workspace = join(fixtureRoot, 'workspace');
        await mkdir(workspace, { recursive: true });
        const fakeBun = await writeFakeBun(
            `#!/bin/sh
if [ "$1" = "--version" ]; then printf '1.3.14\\n'; exit 0; fi
exec '${process.execPath}' "$@"
`,
            'bun with spaces',
        );

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

        const result = await runLauncher(
            fakeBun,
            workspace,
            'hcode',
            `${binDir}:${process.env.PATH}`,
        );

        expect(result.exitCode).toBe(0);
        expect(result.stdout).toContain('Usage:');
        expect(result.stderr).toBe('');
    });

    test('prints the terminal trust warning before runtime bootstrap fails', async () => {
        const workspace = join(fixtureRoot, 'workspace');
        await mkdir(workspace, { recursive: true });
        // A file at this path makes runtime state initialization fail after
        // workspace resolution, without allowing the runtime to start.
        await writeFile(join(workspace, '.hyper'), 'not a directory');
        const proc = Bun.spawn({
            cmd: [join(repoRoot, 'hcode'), '-C', workspace, '-m', 'mock:test'],
            cwd: workspace,
            env: { ...process.env, BUN_BIN: process.execPath },
            stdout: 'pipe',
            stderr: 'pipe',
        });
        const [stdout, stderr, exitCode] = await Promise.all([
            new Response(proc.stdout).text(),
            new Response(proc.stderr).text(),
            proc.exited,
        ]);

        expect(exitCode).toBe(1);
        expect(stdout).toBe('TRUSTED MODE — unrestricted agent execution\n');
        expect(stderr).toContain('hcode: ENOTDIR');
    });

    test('routes terminal SIGINT through runtime shutdown', async () => {
        const workspace = join(fixtureRoot, 'workspace');
        await mkdir(workspace, { recursive: true });
        const proc = Bun.spawn({
            cmd: [join(repoRoot, 'hcode'), '-C', workspace, '-m', 'mock:test'],
            cwd: workspace,
            env: { ...process.env, BUN_BIN: process.execPath },
            stdin: 'pipe',
            stdout: 'pipe',
            stderr: 'pipe',
        });
        const stdout = new Response(proc.stdout).text();
        const stderr = new Response(proc.stderr).text();

        try {
            await waitForPath(
                join(workspace, '.hyper', '_runtime', 'sessions'),
                4_000,
            );
            process.kill(proc.pid, 'SIGINT');

            expect(await proc.exited).toBe(0);
            await stdout;
            expect(await stderr).toBe('');
        } finally {
            try {
                proc.kill('SIGKILL');
            } catch {}
        }
    }, 8_000);

    test('drains prompts buffered before redirected stdin reaches EOF', async () => {
        const workspace = join(fixtureRoot, 'workspace');
        await mkdir(workspace, { recursive: true });
        const proc = Bun.spawn({
            cmd: [join(repoRoot, 'hcode'), '-C', workspace, '-m', 'mock:test'],
            cwd: workspace,
            env: { ...process.env, BUN_BIN: process.execPath },
            stdin: 'pipe',
            stdout: 'pipe',
            stderr: 'pipe',
        });
        proc.stdin.write('one\ntwo\n');
        proc.stdin.end();
        const [stdout, stderr, exitCode] = await Promise.all([
            new Response(proc.stdout).text(),
            new Response(proc.stderr).text(),
            proc.exited,
        ]);

        expect(exitCode).toBe(0);
        expect(stderr).toBe('');
        expect(stdout.match(/ok\n/g)).toHaveLength(2);
    });

    test('returns the forced-shutdown code when terminal execution fails', async () => {
        const workspace = join(fixtureRoot, 'workspace');
        await mkdir(workspace, { recursive: true });
        const agent = { model: 'mock:test' };
        const runtime = {
            ctx: {
                state: {},
                fns: {
                    workspace: { instructions: async () => ({ text: '' }) },
                    project: { roots: async () => [] },
                    agent: { start: () => agent },
                },
            },
            shutdown: async () => ({ forced: true }),
        };

        const exitCode = await main(['-C', workspace, '-m', 'mock:test'], {
            startRuntime: async () => runtime as any,
            runTerminal: async () => {
                throw new Error('terminal polling exploded');
            },
        });

        expect(exitCode).toBe(FORCED_SHUTDOWN_EXIT_CODE);
    });

    test('selects TUI only for an interactive stdin/stdout pair', async () => {
        const workspace = join(fixtureRoot, 'workspace');
        await mkdir(workspace, { recursive: true });
        const agent = { model: 'mock:test' };
        const runtime = {
            ctx: {
                state: {},
                fns: {
                    workspace: { instructions: async () => ({ text: '' }) },
                    project: { roots: async () => [] },
                    settings: { modelDefault: () => 'mock:test' },
                    agent: { start: () => agent },
                },
            },
            shutdown: async () => ({ forced: false }),
        };
        let tuiCalls = 0;
        let lineCalls = 0;

        const exitCode = await main(['-C', workspace, '-m', 'mock:test'], {
            startRuntime: async () => runtime as any,
            isInteractiveTty: () => true,
            runTui: async (opts) => {
                tuiCalls++;
                expect(opts.workspace).toBe(workspace);
            },
            runTerminal: async () => {
                lineCalls++;
            },
        });

        expect(exitCode).toBe(0);
        expect(tuiCalls).toBe(1);
        expect(lineCalls).toBe(0);
    });

    test('keeps redirected execution on line mode without loading TUI', async () => {
        const workspace = join(fixtureRoot, 'workspace');
        await mkdir(workspace, { recursive: true });
        const agent = { model: 'mock:test' };
        const runtime = {
            ctx: {
                state: {},
                fns: {
                    workspace: { instructions: async () => ({ text: '' }) },
                    project: { roots: async () => [] },
                    settings: { modelDefault: () => 'mock:test' },
                    agent: { start: () => agent },
                },
            },
            shutdown: async () => ({ forced: false }),
        };
        let tuiCalls = 0;
        let lineCalls = 0;

        const exitCode = await main(['-C', workspace, '-m', 'mock:test'], {
            startRuntime: async () => runtime as any,
            isInteractiveTty: () => false,
            runTui: async () => {
                tuiCalls++;
            },
            runTerminal: async () => {
                lineCalls++;
            },
        });

        expect(exitCode).toBe(0);
        expect(tuiCalls).toBe(0);
        expect(lineCalls).toBe(1);
    });

    test('routes process SIGINT through TUI cleanup and runtime shutdown', async () => {
        const workspace = join(fixtureRoot, 'workspace');
        await mkdir(workspace, { recursive: true });
        const agent = { model: 'mock:test' };
        let shutdowns = 0;
        const runtime = {
            ctx: {
                state: {},
                fns: {
                    workspace: { instructions: async () => ({ text: '' }) },
                    project: { roots: async () => [] },
                    agent: { start: () => agent },
                },
            },
            shutdown: async () => {
                shutdowns++;
                return { forced: false };
            },
        };
        let tuiStarted!: () => void;
        const started = new Promise<void>((resolve) => {
            tuiStarted = resolve;
        });
        const running = main(['-C', workspace, '-m', 'mock:test'], {
            startRuntime: async () => runtime as any,
            isInteractiveTty: () => true,
            runTui: async ({ exitSignal }) => {
                tuiStarted();
                if (exitSignal?.aborted) return;
                await new Promise<void>((resolve) =>
                    exitSignal?.addEventListener('abort', () => resolve(), {
                        once: true,
                    }),
                );
            },
        });
        await started;
        process.emit('SIGINT');

        expect(await running).toBe(0);
        expect(shutdowns).toBe(1);
    });

    test('configures the shared runtime-path prompt block for serve-mode agents', async () => {
        const workspace = join(fixtureRoot, 'workspace');
        await mkdir(workspace, { recursive: true });
        let runtimeStarted!: () => void;
        const started = new Promise<void>((resolve) => {
            runtimeStarted = resolve;
        });
        const runtime = {
            ctx: {
                state: {},
                fns: {
                    project: {
                        roots: async () => [
                            { name: 'src', dir: '/opt/hcode/src' },
                            { name: '.hyper', dir: '/opt/hcode/.hyper' },
                        ],
                    },
                },
            },
            shutdown: async () => ({ forced: false }),
        };

        const running = main(['serve', '-C', workspace], {
            startRuntime: async (opts) => {
                await opts.configurePromptContext?.(runtime.ctx as any);
                runtimeStarted();
                return runtime as any;
            },
        });
        await started;
        process.emit('SIGTERM');

        expect(await running).toBe(0);
        expect((runtime.ctx.state as any).runtimePathInstructions).toContain(
            'Selected workspace and process cwd: ' + workspace,
        );
        expect((runtime.ctx.state as any).runtimePathInstructions).toContain(
            'src: /opt/hcode/src',
        );
    });
});
