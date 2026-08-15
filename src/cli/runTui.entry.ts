import {
    CliRenderEvents,
    createCliRenderer,
    type CliRenderer,
} from '@opentui/core';
import createTuiView, { type TuiView } from './createTuiView.entry';

export type TuiOptions = {
    ctx: Context;
    agent: types.agent.Agent;
    workspace: string;
    initialPrompt?: string;
    exitSignal?: AbortSignal;
    createRenderer?: () => Promise<CliRenderer>;
    createView?: typeof createTuiView;
    waitForFirstFrame?: (renderer: CliRenderer) => Promise<void>;
};

export default async function runTui(opts: TuiOptions): Promise<void> {
    let renderer: CliRenderer | undefined;
    let view: TuiView | undefined;
    let unsubscribe = () => {};
    let closed = false;
    let active = false;
    let stopping = false;
    let activeTurn: Promise<void> | undefined;
    let submissionController: AbortController | undefined;
    let resolveExit!: () => void;
    let rejectAdapter!: (error: unknown) => void;
    const exitPromise = new Promise<void>((resolve) => {
        resolveExit = resolve;
    });
    const adapterFailure = new Promise<never>((_resolve, reject) => {
        rejectAdapter = reject;
    });
    const requestExit = () => {
        if (closed) return;
        closed = true;
        resolveExit();
    };
    const failAdapter = (error: unknown) => {
        if (closed) return;
        closed = true;
        rejectAdapter(error);
    };
    let durableEvents: any[] = [];
    let durableOffset = 0;
    const drainDurable = () => {
        if (closed || !view) return;
        const maxIdx = opts.ctx.fns.session.getMaxEventIdx(opts.ctx, {
            id: opts.agent.id,
        });
        if (maxIdx < durableOffset - 1) {
            durableEvents = [];
            durableOffset = 0;
        }
        if (maxIdx < durableOffset) return;
        const events = opts.ctx.fns.session.getEvents(opts.ctx, {
            id: opts.agent.id,
            fromIdx: durableOffset,
        });
        durableEvents.push(...events);
        durableOffset = maxIdx + 1;
        view.setTranscript(
            durableEvents.map(formatEvent).filter(Boolean).join('\n\n'),
        );
    };
    let live = {
        thinking: '',
        assistant: '',
        outcome: undefined as 'stopped' | 'failed' | undefined,
    };
    let currentRunId: string | undefined;
    let currentCallId: string | undefined;
    const renderLive = () => view?.setLive(live);

    const startTurn = async (text: string) => {
        if (closed || active || !view) return;
        // Keep the exact pre-submit buffer so a slow durable submission cannot
        // erase a draft typed while it is awaiting acceptance.
        const submittedComposerText = view.composer.plainText;
        active = true;
        stopping = false;
        live = { thinking: '', assistant: '', outcome: undefined };
        view.setRunState('running');
        submissionController = new AbortController();
        try {
            await opts.ctx.fns.agent.submit(opts.ctx, {
                agent: opts.agent,
                text,
                delayMs: 0,
                signal: submissionController.signal,
            });
            if (!closed) {
                clearSubmittedComposer(view, submittedComposerText);
                drainDurable();
            }
            while (!closed) {
                throwIfWorkerCrashed(opts.ctx);
                const row = opts.ctx.fns.db.select<any>(opts.ctx, {
                    sql: 'SELECT run_state, next_run_at FROM agents WHERE id = ?',
                    params: [opts.agent.id],
                })[0];
                drainDurable();
                if (
                    !row ||
                    (row.run_state === 'idle' && row.next_run_at == null)
                )
                    break;
                await opts.ctx.fns.agent.waitForEvent(opts.ctx, {
                    agentId: opts.agent.id,
                    timeoutMs: 50,
                });
            }
            throwIfWorkerCrashed(opts.ctx);
        } finally {
            active = false;
            stopping = false;
            submissionController = undefined;
            if (!closed && view) {
                drainDurable();
                live = { thinking: '', assistant: '', outcome: undefined };
                renderLive();
                view.setRunState('idle');
                view.composer.focus();
            }
        }
    };
    const onSubmit = (text: string) => {
        if (active || closed) return;
        activeTurn = startTurn(text);
        void activeTurn.catch(failAdapter);
    };
    const onInterrupt = () => {
        if (closed) return;
        if (!active) {
            requestExit();
            return;
        }
        if (stopping) return;
        stopping = true;
        submissionController?.abort('stopped_by_user');
        opts.ctx.fns.agent.stop(opts.ctx, {
            agent: opts.agent,
            clearQueue: true,
        });
        view?.setRunState('stopping');
    };
    const onExitSignal = () => requestExit();
    opts.exitSignal?.addEventListener('abort', onExitSignal, { once: true });
    if (opts.exitSignal?.aborted) requestExit();

    try {
        const makeRenderer =
            opts.createRenderer ??
            (() =>
                createCliRenderer({
                    exitOnCtrlC: false,
                    exitSignals: [],
                    clearOnShutdown: true,
                    screenMode: 'alternate-screen',
                    useKittyKeyboard: {},
                    useMouse: true,
                }));
        renderer = await makeRenderer();
        const makeView = opts.createView ?? createTuiView;
        view = makeView(renderer, {
            workspace: opts.workspace,
            model: opts.agent.model,
            onSubmit,
            onInterrupt,
            onExit: requestExit,
        });
        const onRendererError = (event: { error: unknown }) =>
            failAdapter(event.error);
        renderer.on(CliRenderEvents.RENDER_ERROR, onRendererError);
        renderer.on(CliRenderEvents.HANDLER_ERROR, onRendererError);
        unsubscribe = opts.ctx.fns.agent.subscribeLive(opts.ctx, {
            agent: opts.agent,
            subscriber: {
                onEvent: (event) => {
                    if (
                        event.version !== 1 ||
                        event.agentId !== opts.agent.id ||
                        closed
                    )
                        return;
                    if (event.type === 'run_started') {
                        currentRunId = event.runId;
                        currentCallId = undefined;
                        live = {
                            thinking: '',
                            assistant: '',
                            outcome: undefined,
                        };
                        view!.setRunState('running');
                    } else if (event.runId !== currentRunId) return;
                    else if (event.type === 'model_call_started') {
                        currentCallId = event.callId;
                        live = {
                            thinking: '',
                            assistant: '',
                            outcome: undefined,
                        };
                    } else if (
                        event.type === 'thinking_delta' &&
                        event.callId === currentCallId
                    ) {
                        live.thinking += event.delta;
                    } else if (
                        event.type === 'text_delta' &&
                        event.callId === currentCallId
                    ) {
                        live.assistant += event.delta;
                    } else if (
                        event.type === 'model_call_finished' &&
                        event.callId === currentCallId
                    ) {
                        drainDurable();
                        live = {
                            thinking: '',
                            assistant: '',
                            outcome: undefined,
                        };
                        currentCallId = undefined;
                    } else if (event.type === 'run_finished') {
                        drainDurable();
                        if (event.outcome === 'completed') {
                            live = {
                                thinking: '',
                                assistant: '',
                                outcome: undefined,
                            };
                        } else {
                            live.outcome = event.outcome;
                        }
                    }
                    renderLive();
                },
                onError: failAdapter,
            },
        });
        drainDurable();
        renderer.requestRender();
        await (opts.waitForFirstFrame?.(renderer) ?? renderer.idle());
        if (opts.initialPrompt?.trim() && !closed)
            onSubmit(opts.initialPrompt.trim());
        await Promise.race([exitPromise, adapterFailure]);
        renderer.off(CliRenderEvents.RENDER_ERROR, onRendererError);
        renderer.off(CliRenderEvents.HANDLER_ERROR, onRendererError);
    } finally {
        closed = true;
        opts.exitSignal?.removeEventListener('abort', onExitSignal);
        unsubscribe();
        view?.dispose();
        renderer?.destroy();
        void activeTurn?.catch(() => {});
    }
}

function clearSubmittedComposer(
    view: TuiView,
    submittedComposerText: string,
): void {
    const currentText = view.composer.plainText;
    if (currentText === submittedComposerText) {
        view.composer.editBuffer.setText('');
        view.composer.cursorOffset = 0;
    } else if (currentText.startsWith(submittedComposerText)) {
        const draft = currentText.slice(submittedComposerText.length);
        view.composer.editBuffer.setText(draft);
        view.composer.cursorOffset = draft.length;
    }
}

function formatEvent(event: any): string {
    if (event.type === 'user') return `You\n${indent(event.text ?? '')}`;
    if (event.type === 'assistant') {
        const text =
            !event.text && event.html
                ? '[HTML response available in browser mode only]'
                : String(event.text ?? '');
        return `Assistant\n${indent(text)}`;
    }
    if (event.type === 'thinking')
        return `Thinking\n${indent(event.text ?? '')}`;
    if (event.type === 'tool_call') {
        const status = event.isError ? 'failed' : 'done';
        return `Tool · ${event.name ?? 'unknown'} · ${status}\n${indent(event.result ?? '')}`;
    }
    if (event.type === 'error')
        return `Error\n${indent(event.error ?? 'unknown error')}`;
    return '';
}

function indent(value: unknown): string {
    return String(value).replace(/^/gm, '  ');
}

function throwIfWorkerCrashed(ctx: Context): void {
    const error = (ctx.state as any).workerLoopError;
    if (!error) return;
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`agent worker crashed: ${detail}`);
}
