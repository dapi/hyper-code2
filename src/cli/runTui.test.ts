import { afterEach, describe, expect, test } from 'bun:test';
import { CliRenderEvents } from '@opentui/core';
import { createTestRenderer } from '@opentui/core/testing';
import { mkTestCtx } from '../_testCtx.entry';
import createTuiView, { type TuiView } from './createTuiView.entry';
import runTui from './runTui.entry';

const cleanups: Array<() => Promise<void> | void> = [];
afterEach(async () => {
    for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

async function startWorker(ctx: any) {
    const promise = ctx.fns.agent.workerLoop(ctx);
    cleanups.push(async () => {
        ctx.state.workerLoopRunning = false;
        ctx.fns.agent.wakeWorker(ctx);
        await promise;
        ctx.state.db.close();
    });
}

async function eventually(check: () => boolean, timeoutMs = 2_000) {
    const deadline = Date.now() + timeoutMs;
    while (!check()) {
        if (Date.now() >= deadline) throw new Error('condition timed out');
        await Bun.sleep(10);
    }
}

describe('runTui', () => {
    test('shows delayed live deltas before exact durable reconciliation', async () => {
        const ctx = await mkTestCtx();
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        await startWorker(ctx);
        const setup = await createTestRenderer({
            width: 80,
            height: 22,
            kittyKeyboard: true,
            exitOnCtrlC: false,
        });
        let release!: () => void;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        let emitted!: () => void;
        const deltaEmitted = new Promise<void>((resolve) => {
            emitted = resolve;
        });
        const durableOffsets: number[] = [];
        const getEvents = ctx.fns.session.getEvents;
        ctx.fns.session.getEvents = (innerCtx: Context, eventOpts: any) => {
            durableOffsets.push(Number(eventOpts.fromIdx ?? 0));
            return getEvents(innerCtx, eventOpts);
        };
        ctx.fns.llm.stream = async (_c: Context, streamOpts: any) => {
            streamOpts.onEvent({ type: 'thinking_delta', delta: 'working' });
            streamOpts.onEvent({ type: 'text_delta', delta: 'partial' });
            emitted();
            await gate;
            return { text: 'final answer', thinking: 'working', usage: {} };
        };

        const running = runTui({
            ctx,
            agent,
            workspace: '/work',
            initialPrompt: 'question',
            createRenderer: async () => setup.renderer,
            waitForFirstFrame: async () => {
                await setup.renderOnce();
            },
        });
        await deltaEmitted;
        await setup.renderOnce();
        const liveFrame = setup.captureCharFrame();
        expect(liveFrame).toContain('[thinking · live] working');
        expect(liveFrame).toContain('[assistant · live] partial');
        setup.resize(96, 26);
        await setup.renderOnce();
        const resizedLiveFrame = setup.captureCharFrame();
        expect(resizedLiveFrame).toContain('[thinking · live] working');
        expect(resizedLiveFrame).toContain('[assistant · live] partial');

        release();
        await eventually(
            () =>
                ctx.fns.db.select(ctx, {
                    sql: 'SELECT run_state FROM agents WHERE id = ?',
                    params: [agent.id],
                })[0]?.run_state === 'idle',
        );
        await Bun.sleep(80);
        await setup.renderOnce();
        const finalFrame = setup.captureCharFrame();
        expect(finalFrame).toContain('final answer');
        expect(finalFrame).not.toContain('[assistant · live] partial');
        expect(finalFrame.match(/final answer/g)).toHaveLength(1);
        expect(durableOffsets.some((offset) => offset > 0)).toBe(true);
        setup.mockInput.pressCtrlC();
        await running;
    });

    test('submits one durable multiline turn and clears the composer', async () => {
        const ctx = await mkTestCtx();
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        agent.scratchpad.mockLLM = { userText: 'done' };
        await startWorker(ctx);
        const setup = await createTestRenderer({
            width: 80,
            height: 22,
            kittyKeyboard: true,
            exitOnCtrlC: false,
        });
        let resolveView!: (view: TuiView) => void;
        const viewReady = new Promise<TuiView>((resolve) => {
            resolveView = resolve;
        });
        const exitController = new AbortController();
        const running = runTui({
            ctx,
            agent,
            workspace: '/work',
            exitSignal: exitController.signal,
            createRenderer: async () => setup.renderer,
            createView: (renderer, options) => {
                const view = createTuiView(renderer, options);
                resolveView(view);
                return view;
            },
            waitForFirstFrame: async () => setup.renderOnce(),
        });
        const view = await viewReady;

        await setup.mockInput.typeText('first');
        setup.mockInput.pressEnter();
        await setup.flush();
        await setup.mockInput.typeText('second');
        setup.mockInput.pressEnter({ ctrl: true });
        await eventually(() =>
            ctx.fns.session
                .getEvents(ctx, { id: agent.id })
                .some(
                    (event: any) =>
                        event.type === 'assistant' && event.text === 'done',
                ),
        );
        await setup.renderOnce();

        const userEvents = ctx.fns.session
            .getEvents(ctx, { id: agent.id })
            .filter((event: any) => event.type === 'user');
        expect(userEvents).toHaveLength(1);
        expect(userEvents[0].text).toBe('first\nsecond');
        expect(
            ctx.fns.session
                .getEvents(ctx, { id: agent.id })
                .filter((event: any) => event.type === 'assistant'),
        ).toHaveLength(1);
        const frame = setup.captureCharFrame();
        expect(frame).toContain('│   first');
        expect(frame).toContain('│   second');
        expect(view.composer.plainText).toBe('');

        exitController.abort();
        await running;
    });

    test('preserves edits made while submission is awaiting acceptance', async () => {
        const ctx = await mkTestCtx();
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        agent.scratchpad.mockLLM = { userText: 'done' };
        await startWorker(ctx);
        const setup = await createTestRenderer({
            width: 80,
            height: 22,
            kittyKeyboard: true,
            exitOnCtrlC: false,
        });
        let release!: () => void;
        const accepted = new Promise<void>((resolve) => {
            release = resolve;
        });
        const originalSubmit = ctx.fns.agent.submit;
        ctx.fns.agent.submit = async (innerCtx: Context, submitOpts: any) => {
            await accepted;
            return originalSubmit(innerCtx, submitOpts);
        };
        let resolveView!: (view: TuiView) => void;
        const viewReady = new Promise<TuiView>((resolve) => {
            resolveView = resolve;
        });
        const exitController = new AbortController();
        const running = runTui({
            ctx,
            agent,
            workspace: '/work',
            exitSignal: exitController.signal,
            createRenderer: async () => setup.renderer,
            createView: (renderer, options) => {
                const view = createTuiView(renderer, options);
                resolveView(view);
                return view;
            },
            waitForFirstFrame: async () => setup.renderOnce(),
        });
        const view = await viewReady;

        await setup.mockInput.typeText('submitted');
        setup.mockInput.pressEnter({ ctrl: true });
        await setup.flush();
        // Replace a character in the submitted buffer while submit() is
        // pending. The replacement is the draft; the accepted text is not.
        for (let i = 0; i < 4; i++) setup.mockInput.pressArrow('left');
        setup.mockInput.pressBackspace();
        await setup.mockInput.typeText('X');
        release();
        await eventually(() => view.composer.plainText === 'X');

        exitController.abort();
        await running;
    });

    test('stops an active turn, remains usable, then exits idle', async () => {
        const ctx = await mkTestCtx();
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        await startWorker(ctx);
        const setup = await createTestRenderer({
            width: 70,
            height: 20,
            kittyKeyboard: true,
            exitOnCtrlC: false,
        });
        let started!: () => void;
        const streamStarted = new Promise<void>((resolve) => {
            started = resolve;
        });
        ctx.fns.llm.stream = async (_c: Context, streamOpts: any) => {
            started();
            await new Promise<void>((_resolve, reject) => {
                streamOpts.signal.addEventListener(
                    'abort',
                    () => {
                        const error = new Error('AbortError: stopped_by_user');
                        error.name = 'AbortError';
                        reject(error);
                    },
                    { once: true },
                );
            });
        };
        const running = runTui({
            ctx,
            agent,
            workspace: '/work',
            initialPrompt: 'wait',
            createRenderer: async () => setup.renderer,
            waitForFirstFrame: async () => {
                await setup.renderOnce();
            },
        });
        await streamStarted;
        setup.mockInput.pressCtrlC();
        await eventually(
            () =>
                ctx.fns.db.select(ctx, {
                    sql: 'SELECT run_state FROM agents WHERE id = ?',
                    params: [agent.id],
                })[0]?.run_state === 'idle',
        );
        await Bun.sleep(80);
        await setup.mockInput.typeText('still usable');
        await setup.renderOnce();
        expect(setup.captureCharFrame()).toContain('still usable');
        setup.mockInput.pressCtrlC();
        await running;
    });

    test('detaches before exactly-once renderer destruction on process exit', async () => {
        const ctx = await mkTestCtx();
        cleanups.push(() => ctx.state.db.close());
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        const setup = await createTestRenderer({
            width: 60,
            height: 18,
            exitOnCtrlC: false,
        });
        const originalDestroy = setup.renderer.destroy.bind(setup.renderer);
        let destroys = 0;
        (setup.renderer as any).destroy = () => {
            destroys++;
            originalDestroy();
        };
        const exit = new AbortController();
        const running = runTui({
            ctx,
            agent,
            workspace: '/work',
            exitSignal: exit.signal,
            createRenderer: async () => setup.renderer,
            waitForFirstFrame: async () => {
                await setup.renderOnce();
            },
        });
        await Bun.sleep(0);
        expect(agent.subscribers.size).toBe(1);
        exit.abort('SIGTERM');
        await running;
        expect(agent.subscribers.size).toBe(0);
        expect(destroys).toBe(1);
    });

    test('propagates renderer bootstrap failure', async () => {
        const ctx = await mkTestCtx();
        cleanups.push(() => ctx.state.db.close());
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        await expect(
            runTui({
                ctx,
                agent,
                workspace: '/work',
                createRenderer: async () => {
                    throw new Error('terminal setup failed');
                },
            }),
        ).rejects.toThrow('terminal setup failed');
        expect(agent.subscribers.size).toBe(0);
    });

    test('unwinds and propagates a renderer failure after setup', async () => {
        const ctx = await mkTestCtx();
        cleanups.push(() => ctx.state.db.close());
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        const setup = await createTestRenderer({ width: 60, height: 18 });
        const originalDestroy = setup.renderer.destroy.bind(setup.renderer);
        let destroys = 0;
        (setup.renderer as any).destroy = () => {
            destroys++;
            originalDestroy();
        };
        const running = runTui({
            ctx,
            agent,
            workspace: '/work',
            createRenderer: async () => setup.renderer,
            waitForFirstFrame: async () => {
                await setup.renderOnce();
            },
        });
        await Bun.sleep(0);
        setup.renderer.emit(CliRenderEvents.RENDER_ERROR, {
            error: new Error('frame render failed'),
            renderable: undefined,
        });

        await expect(running).rejects.toThrow('frame render failed');
        expect(agent.subscribers.size).toBe(0);
        expect(destroys).toBe(1);
    });

    test('renders durable operator, tool, error, and HTML-only activity', async () => {
        const ctx = await mkTestCtx();
        cleanups.push(() => ctx.state.db.close());
        const agent = ctx.fns.agent.start(ctx, { model: 'mock:test' });
        const setup = await createTestRenderer({
            width: 80,
            height: 24,
            kittyKeyboard: true,
            exitOnCtrlC: false,
        });
        ctx.fns.agent.submit = async (c: Context, submitOpts: any) => {
            await c.fns.session.appendUserMessage(c, {
                id: agent.id,
                text: submitOpts.text,
            });
            await c.fns.session.appendToolCallEvent(c, {
                id: agent.id,
                payload: {
                    name: 'files.read',
                    args: {},
                    result: 'file body',
                    argsHtml: '',
                    resultHtml: '',
                    isError: false,
                },
            });
            await c.fns.session.appendAssistantEvent(c, {
                id: agent.id,
                payload: { text: '', html: '<p>browser only</p>' },
            });
            await c.fns.session.appendErrorEvent(c, {
                id: agent.id,
                error: 'provider failed',
            });
            return { sendAt: Date.now(), messageIdx: 0 };
        };
        const running = runTui({
            ctx,
            agent,
            workspace: '/work',
            initialPrompt: 'inspect this',
            createRenderer: async () => setup.renderer,
            waitForFirstFrame: async () => {
                await setup.renderOnce();
            },
        });
        await Bun.sleep(80);
        await setup.renderOnce();
        const frame = setup.captureCharFrame();
        expect(frame).toContain('inspect this');
        expect(frame).toContain('Tool · files.read · done');
        expect(frame).toContain('file body');
        expect(frame).toContain(
            '[HTML response available in browser mode only]',
        );
        expect(frame).toContain('provider failed');
        setup.mockInput.pressCtrlC();
        await running;
    });
});
