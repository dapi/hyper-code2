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
    version: string;
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
    let modelAdvice = '';
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
            [durableEvents.map(formatEvent).filter(Boolean).join('\n\n'), modelAdvice]
                .filter(Boolean)
                .join('\n\n'),
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
        const turnStartOffset = opts.ctx.fns.session.getMaxEventIdx(opts.ctx, {
            id: opts.agent.id,
        }) + 1;
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
            const turnEvents = opts.ctx.fns.session.getEvents(opts.ctx, {
                id: opts.agent.id,
                fromIdx: turnStartOffset,
            });
            const failed = turnEvents.some((event: any) => event.type === 'error');
            if (failed && (opts.agent as any).__hcodeDetectedDefaultModel === opts.agent.model) {
                const alternatives = (opts.agent as any).__hcodeModelAlternatives as string[] | undefined;
                opts.ctx.fns.settings.remove(opts.ctx, {
                    module: 'llm', scopeType: 'global', key: 'defaultModel',
                });
                if (alternatives?.length)
                    modelAdvice = `[model unavailable; try: hcode -m ${alternatives[0]}]`;
                delete (opts.agent as any).__hcodeDetectedDefaultModel;
                delete (opts.agent as any).__hcodeModelAlternatives;
                drainDurable();
            }
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
            version: opts.version,
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

    // Most submissions do not receive edits while agent.submit() is waiting
    // for durable acceptance. Avoid reconciling an unchanged buffer: the old
    // LCS implementation allocated a quadratic matrix for this common case.
    if (currentText === submittedComposerText) {
        view.composer.editBuffer.setText('');
        view.composer.cursorOffset = 0;
        return;
    }

    const draft = postSubmitEditText(submittedComposerText, currentText);
    view.composer.editBuffer.setText(draft);
    view.composer.cursorOffset = draft.length;
}

/**
 * Remove the text that was present when submission started, retaining text
 * introduced while submit() was waiting for durable acceptance. The common
 * prefix and suffix are the submitted text's stable regions; the middle of
 * the post-submit buffer is the pending draft. This keeps reconciliation
 * linear in the buffer size and uses constant extra space.
 */
function postSubmitEditText(before: string, after: string): string {
    let prefix = 0;
    const sharedLength = Math.min(before.length, after.length);
    while (prefix < sharedLength && before[prefix] === after[prefix])
        prefix++;

    let beforeEnd = before.length - 1;
    let afterEnd = after.length - 1;
    while (
        beforeEnd >= prefix &&
        afterEnd >= prefix &&
        before[beforeEnd] === after[afterEnd]
    ) {
        beforeEnd--;
        afterEnd--;
    }

    return after.slice(prefix, afterEnd + 1);
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
