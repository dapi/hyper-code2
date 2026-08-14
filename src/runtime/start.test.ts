import { afterAll, describe, expect, test } from 'bun:test';
import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import startRuntime from './start.entry';

const originalCwd = process.cwd();
const workspace = join(originalCwd, '.test-tmp', `runtime-${process.pid}-${Date.now()}`);
afterAll(async () => {
    process.chdir(originalCwd);
    await rm(workspace, { recursive: true, force: true });
});

describe('startRuntime', () => {
    test('starts headless and restores cwd during idempotent shutdown', async () => {
        await mkdir(workspace, { recursive: true });
        const runtime = await startRuntime({ workspace, dbPath: ':memory:', http: false });
        expect(process.cwd()).toBe(workspace);
        expect(runtime.ctx.state.server).toBeUndefined();
        expect(runtime.ctx.state.workerLoopRunning).toBe(true);
        const first = runtime.shutdown();
        const second = runtime.shutdown();
        expect(second).toBe(first);
        await Promise.all([first, second]);
        expect(process.cwd()).toBe(originalCwd);
    });

    test('closes shared resources after the shutdown grace period when a worker is uncooperative', async () => {
        await mkdir(workspace, { recursive: true });
        const runtime = await startRuntime({ workspace, dbPath: ':memory:', http: false, shutdownTimeoutMs: 10 });
        let releaseWorker!: () => void;
        runtime.ctx.state.workerLoopPromise = new Promise<void>((resolve) => { releaseWorker = resolve; });
        const events: string[] = [];
        runtime.ctx.state.db = { close: () => { events.push('db-close'); } };

        const shutdown = runtime.shutdown();
        await Bun.sleep(30);
        expect(events).toEqual(['db-close']);
        expect(process.cwd()).toBe(originalCwd);
        releaseWorker();
        await shutdown;
        expect(events).toEqual(['db-close']);
        expect(process.cwd()).toBe(originalCwd);
    });

    test('awaits HTTP shutdown before closing shared resources', async () => {
        await mkdir(workspace, { recursive: true });
        const runtime = await startRuntime({ workspace, dbPath: ':memory:', http: false });
        const events: string[] = [];
        let serverStopArgs: unknown[] | undefined;
        let releaseServerStop!: () => void;

        runtime.ctx.state.server = {
            server: {
                stop: (...args: unknown[]) => new Promise<void>((resolve) => {
                    events.push('server-stop');
                    serverStopArgs = args;
                    releaseServerStop = resolve;
                }),
            },
        };
        runtime.ctx.state.workerLoopPromise = Promise.resolve();
        runtime.ctx.state.http = { logFile: { end: async () => { events.push('log-end'); } } };
        runtime.ctx.state.db = { close: () => { events.push('db-close'); } };

        const shutdown = runtime.shutdown();
        await Promise.resolve();
        expect(events).toEqual(['server-stop']);
        expect(serverStopArgs).toEqual([]);

        releaseServerStop();
        await shutdown;
        expect(events).toEqual(['server-stop', 'log-end', 'db-close']);
    });

    test('forces HTTP connections closed when graceful shutdown exceeds its grace period', async () => {
        await mkdir(workspace, { recursive: true });
        const runtime = await startRuntime({ workspace, dbPath: ':memory:', http: false, shutdownTimeoutMs: 10 });
        const events: string[] = [];
        runtime.ctx.state.server = {
            server: {
                stop: (force?: boolean) => {
                    events.push(force ? 'server-force-stop' : 'server-stop');
                    return force ? Promise.resolve() : new Promise<void>(() => {});
                },
            },
        };
        runtime.ctx.state.workerLoopPromise = Promise.resolve();
        runtime.ctx.state.http = { logFile: { end: async () => { events.push('log-end'); } } };
        runtime.ctx.state.db = { close: () => { events.push('db-close'); } };

        await runtime.shutdown();
        expect(events).toEqual(['server-stop', 'server-force-stop', 'log-end', 'db-close']);
    });

    test('exposes the explicit database path to agent runtime context', async () => {
        await mkdir(workspace, { recursive: true });
        const dbPath = join(workspace, '.hyper', '_runtime', 'explicit-sessions');
        const runtime = await startRuntime({
            workspace,
            dbPath,
            http: false,
            env: { DB_PATH: '/tmp/inherited-sessions' },
        });

        expect(runtime.ctx.env.DB_PATH).toBe(dbPath);
        const prompt = await runtime.ctx.fns.agent.fullSystemPrompt(runtime.ctx, {
            agent: { id: 'test-agent', systemPrompt: '' } as any,
        });
        expect(prompt).toContain(`- db path: ${dbPath}`);
        await runtime.shutdown();
    });
});
