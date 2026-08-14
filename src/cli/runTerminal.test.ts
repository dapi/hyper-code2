import { afterEach, describe, expect, test } from 'bun:test';
import { mkTestCtx } from '../_testCtx.entry';
import runTerminal from './runTerminal.entry';

const cleanups: Array<() => Promise<void> | void> = [];
afterEach(async () => {
    for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

async function* lines(values: string[]) {
    for (const value of values) yield value;
}

async function startWorker(ctx: any) {
    const promise = ctx.fns.agent.workerLoop(ctx);
    cleanups.push(async () => {
        ctx.state.workerLoopRunning = false;
        ctx.fns.agent.wakeWorker(ctx);
        await promise;
        ctx.state.db.close();
    });
}

describe('runTerminal', () => {
    test('runs two turns through durable submit, worker, and assistant events', async () => {
        const ctx = await mkTestCtx();
        let turn = 0;
        ctx.fns.llm.stream = async () => ({
            text: `reply:${++turn === 1 ? 'one' : 'two'}`,
            toolCalls: [], thinking: '', usage: {},
        });
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        await startWorker(ctx);

        const output: string[] = [];
        await runTerminal({
            ctx, agent, workspace: '/work', input: lines(['one', 'two', '/exit', 'ignored']),
            write: (text) => output.push(text),
        });

        const messages = ctx.fns.session.getMessages(ctx, { id: agent.id });
        expect(messages.map((message: any) => message.role)).toEqual(['user', 'assistant', 'user', 'assistant']);
        expect(messages.map((message: any) => message.content)).toEqual(['one', 'reply:one', 'two', 'reply:two']);
        expect(output.join('')).toContain('reply:one');
        expect(output.join('')).toContain('reply:two');
        expect(output.join('')).not.toContain('ignored');
        expect(ctx.state.server).toBeUndefined();
    });

    test('renders progress, failures, and an explicit HTML-only fallback', async () => {
        const ctx = await mkTestCtx();
        cleanups.push(() => ctx.state.db.close());
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        ctx.fns.agent.submit = async (c: any) => {
            await c.fns.session.appendThinkingEvent(c, { id: agent.id, text: 'considering' });
            await c.fns.session.appendToolCallEvent(c, {
                id: agent.id,
                payload: { name: 'files.read', args: {}, result: 'content', argsHtml: '', resultHtml: '', isError: false },
            });
            await c.fns.session.appendAssistantEvent(c, { id: agent.id, payload: { text: '', html: '<p>browser</p>' } });
            await c.fns.session.appendErrorEvent(c, { id: agent.id, error: 'boom' });
            return { sendAt: Date.now(), messageIdx: 0 };
        };
        const output: string[] = [];
        await runTerminal({ ctx, agent, workspace: '/work', input: lines(['go']), write: (text) => output.push(text) });
        const text = output.join('');
        expect(text).toContain('[thinking] considering');
        expect(text).toContain('[tool files.read: done]');
        expect(text).toContain('[HTML response available in browser mode only]');
        expect(text).toContain('[error] boom');
    });

    test('fails explicitly instead of polling forever after the worker crashes', async () => {
        const ctx = await mkTestCtx();
        cleanups.push(() => ctx.state.db.close());
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        ctx.fns.agent.submit = async (c: any) => {
            c.state.workerLoopError = new Error('claim failed');
            c.fns.db.exec(c, {
                sql: "UPDATE agents SET run_state = 'running', next_run_at = ? WHERE id = ?",
                params: [Date.now(), agent.id],
            });
            return { sendAt: Date.now(), messageIdx: 0 };
        };

        await expect(runTerminal({
            ctx, agent, workspace: '/work', input: lines(['go']), write: () => {},
        })).rejects.toThrow('agent worker crashed: claim failed');
    });

    test('first interrupt stops an active turn and repeated interrupt exits', async () => {
        const ctx = await mkTestCtx();
        cleanups.push(() => ctx.state.db.close());
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        const blocked = new Promise<void>(() => {});
        ctx.fns.agent.submit = async () => {
            // A live run installs this before it enters the LLM call.
            agent.abortController = new AbortController();
            ctx.fns.db.exec(ctx, {
                sql: "UPDATE agents SET run_state = 'running', next_run_at = ? WHERE id = ?",
                params: [Date.now(), agent.id],
            });
            await blocked;
            return { sendAt: Date.now(), messageIdx: 0 };
        };
        let interrupt!: () => void;
        const output: string[] = [];
        const running = runTerminal({
            ctx, agent, workspace: '/work', input: lines(['wait']), write: (text) => output.push(text),
            registerInterrupt: (handler) => { interrupt = handler; return () => {}; },
        });
        await new Promise((resolve) => setTimeout(resolve, 0));
        interrupt();
        interrupt();
        await running;
        expect(output.join('')).toContain('[stopped; press Ctrl+C again to exit]');
        const row = ctx.fns.db.select(ctx, { sql: 'SELECT run_state, next_run_at FROM agents WHERE id = ?', params: [agent.id] })[0];
        // The adapter may return after the second interrupt, but the claimed
        // run remains fenced as running until its own promise unwinds.
        expect(row.run_state).toBe('running');
        expect(row.next_run_at).toBeNull();
    });

    test('first interrupt prevents an event-rendering submission from scheduling', async () => {
        const ctx = await mkTestCtx();
        cleanups.push(() => ctx.state.db.close());
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        let releaseRender!: () => void;
        const rendering = new Promise<void>((resolve) => { releaseRender = resolve; });
        let renderStarted!: () => void;
        const started = new Promise<void>((resolve) => { renderStarted = resolve; });
        ctx.fns.agent.renderEventHtml = async () => {
            renderStarted();
            await rendering;
            return '<p>user</p>';
        };
        let interrupt!: () => void;
        const running = runTerminal({
            ctx,
            agent,
            workspace: '/work',
            input: lines(['wait']),
            write: () => {},
            registerInterrupt: (handler) => { interrupt = handler; return () => {}; },
        });
        await started;
        interrupt();
        releaseRender();
        await running;

        const row = ctx.fns.db.select(ctx, {
            sql: 'SELECT run_state, next_run_at FROM agents WHERE id = ?', params: [agent.id],
        })[0];
        expect(row).toEqual({ run_state: 'idle', next_run_at: null });
    });

    test('one-shot non-TTY run handles process SIGINT through the stop lifecycle', async () => {
        const ctx = await mkTestCtx();
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        await startWorker(ctx);

        let releaseRun!: (error: Error) => void;
        const started = new Promise<void>((resolve) => {
            ctx.fns.agent.run = async (_ctx: any, opts: any) => {
                opts.agent.abortController = { abort: () => releaseRun(new Error('aborted by user')) };
                resolve();
                await new Promise<void>((_resolve, reject) => { releaseRun = reject; });
            };
        });
        const output: string[] = [];
        const running = runTerminal({ ctx, agent, workspace: '/work', initialPrompt: 'wait', write: (text) => output.push(text) });
        await started;
        process.emit('SIGINT');
        await running;

        const row = ctx.fns.db.select(ctx, {
            sql: 'SELECT run_state, next_run_at FROM agents WHERE id = ?', params: [agent.id],
        })[0];
        expect(output.join('')).toContain('[stopped; press Ctrl+C again to exit]');
        expect(row).toEqual({ run_state: 'idle', next_run_at: null });
    });

    test('exits an active terminal when the shared shutdown signal arrives', async () => {
        const ctx = await mkTestCtx();
        cleanups.push(() => ctx.state.db.close());
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        let submitted!: () => void;
        const started = new Promise<void>((resolve) => { submitted = resolve; });
        ctx.fns.agent.submit = async () => {
            submitted();
            await new Promise<void>(() => {});
            return { sendAt: Date.now(), messageIdx: 0 };
        };
        const exitController = new AbortController();
        const running = runTerminal({
            ctx,
            agent,
            workspace: '/work',
            input: lines(['wait']),
            write: () => {},
            exitSignal: exitController.signal,
        });
        await started;

        exitController.abort('SIGTERM');
        await running;
    });

    test('does not submit the next prompt until a stopped run has quiesced', async () => {
        const ctx = await mkTestCtx();
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        await startWorker(ctx);

        let runs = 0;
        let releaseFirst!: () => void;
        const firstRun = new Promise<void>((resolve) => { releaseFirst = resolve; });
        let firstStarted!: () => void;
        const started = new Promise<void>((resolve) => { firstStarted = resolve; });
        ctx.fns.agent.run = async () => {
            // The real agent.run() creates this synchronously before streaming.
            agent.abortController = new AbortController();
            runs++;
            if (runs === 1) {
                firstStarted();
                await firstRun;
            }
        };

        let interrupted!: () => void;
        const running = runTerminal({
            ctx,
            agent,
            workspace: '/work',
            input: lines(['one', 'two', '/exit']),
            write: () => {},
            registerInterrupt: (handler) => { interrupted = handler; return () => {}; },
        });
        await started;
        interrupted();

        // The input generator has a second line ready, but the terminal must
        // not consume it while the stopped first run still owns `running`.
        await Bun.sleep(30);
        expect(runs).toBe(1);

        releaseFirst();
        await running;
        expect(runs).toBe(2);
    });
});
