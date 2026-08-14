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
        expect((await shutdown).forced).toBe(true);
        expect(events).toEqual(['db-close']);
        expect(process.cwd()).toBe(originalCwd);
    });

    test('returns claimed durable work to idle before forced shutdown closes SQLite', async () => {
        await mkdir(workspace, { recursive: true });
        const dbPath = join(workspace, `.forced-shutdown-${crypto.randomUUID()}.sqlite`);
        const runtime = await startRuntime({ workspace, dbPath, http: false, shutdownTimeoutMs: 10 });
        const ctx = runtime.ctx;

        // Keep the normal worker from claiming while this test prepares the
        // durable row, then model the claim whose adapter never settles.
        ctx.state.workerLoopRunning = false;
        ctx.fns.agent.wakeWorker(ctx);
        await ctx.state.workerLoopPromise;

        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test', systemPrompt: '' });
        const nextRunAt = Date.now() + 60_000;
        ctx.fns.session.appendMessage(ctx, { id: agent.id, message: { role: 'user', content: 'retry me' } });
        ctx.fns.db.exec(ctx, {
            sql: "UPDATE agents SET run_state = 'running', run_started_at = ?, next_run_at = ? WHERE id = ?",
            params: [Date.now(), nextRunAt, agent.id],
        });
        ctx.state.workerLoopPromise = new Promise<void>(() => {});

        expect((await runtime.shutdown()).forced).toBe(true);

        const restarted = await startRuntime({ workspace, dbPath, http: false });
        try {
            const row = restarted.ctx.fns.db.select(restarted.ctx, {
                sql: 'SELECT run_state, run_started_at, next_run_at FROM agents WHERE id = ?',
                params: [agent.id],
            })[0];
            expect(row).toEqual({ run_state: 'idle', run_started_at: null, next_run_at: nextRunAt });
        } finally {
            await restarted.shutdown();
        }
    });

    test('includes async delegated runs in the bounded shutdown decision', async () => {
        await mkdir(workspace, { recursive: true });
        const runtime = await startRuntime({ workspace, dbPath: ':memory:', http: false, shutdownTimeoutMs: 10 });
        const ctx = runtime.ctx;
        const parent = ctx.fns.agent.start(ctx, { model: 'mock:test', systemPrompt: '' });
        let streamStarted!: () => void;
        const started = new Promise<void>((resolve) => { streamStarted = resolve; });
        ctx.fns.llm.stream = async () => {
            streamStarted();
            return new Promise<any>(() => {});
        };

        await ctx.fns.agent.delegateTask(ctx, { parent, task: 'wait forever', mode: 'async' });
        await started;
        ctx.state.workerLoopPromise = Promise.resolve();
        const events: string[] = [];
        ctx.state.db = { close: () => { events.push('db-close'); } } as any;

        expect((ctx.state as any).activeAgentRunPromises.size).toBe(1);

        const result = await runtime.shutdown();
        expect(result.forced).toBe(true);
        expect(events).toEqual(['db-close']);
    });

    test('keeps shutdown run tracking after agent.run is hot-reloaded', async () => {
        await mkdir(workspace, { recursive: true });
        const runtime = await startRuntime({ workspace, dbPath: ':memory:', http: false, shutdownTimeoutMs: 10 });
        const ctx = runtime.ctx;
        const reloadRoot = join(workspace, '.test-tmp', `reloaded-agent-${crypto.randomUUID()}`);
        const startedKey = `__reloadedAgentRunStarted_${crypto.randomUUID().replaceAll('-', '')}`;
        let started!: () => void;
        const startedPromise = new Promise<void>((resolve) => { started = resolve; });
        (globalThis as any)[startedKey] = started;
        await mkdir(join(reloadRoot, 'agent'), { recursive: true });
        await Bun.write(join(reloadRoot, 'agent', 'run.ts'), [
            'export default async function (_ctx: any, opts: any) {',
            '    opts.agent.abortController = new AbortController();',
            `    globalThis[${JSON.stringify(startedKey)}]();`,
            '    await new Promise<void>(() => {});',
            '}',
            '',
        ].join('\n'));
        ctx.fns.project.roots = async () => [{ name: 'src', dir: reloadRoot }];

        try {
            const wrapper = ctx.fns.agent.run;
            await ctx.fns.repl.load(ctx, { name: 'agent.run' });
            expect(ctx.fns.agent.run).toBe(wrapper);
            await ctx.fns.repl.load(ctx, { name: 'agent' });
            expect(ctx.fns.agent.run).toBe(wrapper);

            const agent = ctx.fns.agent.start(ctx, { model: 'mock:test', systemPrompt: '' });
            void ctx.fns.agent.run(ctx, { agent, userText: 'wait forever' });
            await startedPromise;
            ctx.state.workerLoopPromise = Promise.resolve();
            const events: string[] = [];
            ctx.state.db = { close: () => { events.push('db-close'); } } as any;

            expect((ctx.state as any).activeAgentRunPromises.size).toBe(1);
            expect((await runtime.shutdown()).forced).toBe(true);
            expect(events).toEqual(['db-close']);
        } finally {
            delete (globalThis as any)[startedKey];
            await rm(reloadRoot, { recursive: true, force: true });
        }
    });

    test('does not start queued UI runs after shutdown begins', async () => {
        await mkdir(workspace, { recursive: true });
        const runtime = await startRuntime({ workspace, dbPath: ':memory:', http: false });
        const ctx = runtime.ctx;
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test', systemPrompt: '' });
        let streamCalled = false;
        ctx.fns.llm.stream = async () => {
            streamCalled = true;
            return { text: 'unexpected' } as any;
        };
        ctx.state.workerLoopPromise = Promise.resolve();

        const send = ctx.fns.ui.sendToAgent(ctx, { agentId: agent.id, text: 'queued' });
        const shutdown = runtime.shutdown();
        await send;
        await shutdown;
        await Bun.sleep(0);

        expect(streamCalled).toBe(false);
        expect(agent.isStreaming).toBe(false);
    });

    test('keeps a due durable prompt scheduled while HTTP shutdown is in progress', async () => {
        await mkdir(workspace, { recursive: true });
        const runtime = await startRuntime({ workspace, dbPath: ':memory:', http: false });
        const ctx = runtime.ctx;
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test', systemPrompt: '' });
        ctx.fns.session.appendMessage(ctx, { id: agent.id, message: { role: 'user', content: 'durable prompt' } });

        let releaseServerStop!: () => void;
        ctx.state.server = {
            server: {
                stop: () => new Promise<void>((resolve) => { releaseServerStop = resolve; }),
            },
        };

        const shutdown = runtime.shutdown();
        await Promise.resolve();
        // This simulates a due row racing with a graceful HTTP stop. The worker
        // must not acknowledge it merely because runtime shutdown began.
        ctx.fns.db.exec(ctx, {
            sql: 'UPDATE agents SET next_run_at = ? WHERE id = ?',
            params: [Date.now(), agent.id],
        });
        ctx.fns.agent.wakeWorker(ctx);
        await Bun.sleep(25);

        const duringShutdown = ctx.fns.db.select(ctx, {
            sql: 'SELECT run_state, next_run_at, last_processed_msg_idx FROM agents WHERE id = ?',
            params: [agent.id],
        })[0];
        expect(duringShutdown).toEqual({
            run_state: 'idle',
            next_run_at: expect.any(Number),
            last_processed_msg_idx: -1,
        });

        releaseServerStop();
        await shutdown;
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
