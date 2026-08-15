// The agent turn loop. Marker-protocol only — we don't run native function
// calls. The model emits §eval/write/bash/html markers in plain content;
// parseMarkers extracts them; executeMarker runs each one, persists the
// marker message + tool_call event + synthetic §result feedback. The loop
// continues until the model returns a response with no markers (pure prose).
//
// All the per-marker mechanics live in ctx.fns.agent.executeMarker. This
// file is intentionally small — orchestration only.
// Canonical protocol contract: memory-bank/engineering/agent-protocol.md
export default async function (
    ctx: Context,
    opts: {
        agent: types.agent.Agent;
        userText: string;
        userMessageAlreadyAppended?: boolean;
    },
) {
    const { agent, userText } = opts;
    const ac = new AbortController();
    agent.abortController = ac;
    const runId = crypto.randomUUID();
    let seq = 0;
    let callOrdinal = 0;
    let runFinished = false;
    const publish = (event: LiveEventInput) => {
        ctx.fns.agent.publishLive(ctx, {
            agent,
            event: {
                version: 1,
                agentId: agent.id,
                runId,
                seq: seq++,
                ...event,
            } as types.agent.LiveEvent,
        });
    };
    publish({ type: 'run_started' });

    try {
        if (!opts.userMessageAlreadyAppended) {
            await ctx.fns.session.appendUserMessage(ctx, {
                id: agent.id,
                text: userText,
            });
            ctx.fns.session.syncAgentState(ctx, { agent });
        }

        while (true) {
            const callId = `${runId}:${++callOrdinal}`;
            publish({ type: 'model_call_started', callId });
            const { text, thinking, usage } = await ctx.fns.llm.stream(ctx, {
                agent,
                signal: ac.signal,
                onEvent: (event: any) => {
                    const delta =
                        typeof event?.delta === 'string' ? event.delta : '';
                    if (!delta) return;
                    if (event.type === 'text_delta')
                        publish({ type: 'text_delta', callId, delta });
                    else if (event.type === 'thinking_delta')
                        publish({ type: 'thinking_delta', callId, delta });
                },
            });
            throwIfAborted(ac.signal);

            // Provider reasoning is a durable operator-visible activity event.
            // Persist it before rendering any response or executing markers.
            if (thinking?.trim()) {
                await ctx.fns.session.appendThinkingEvent(ctx, {
                    id: agent.id,
                    text: thinking,
                });
                ctx.fns.session.syncAgentState(ctx, { agent });
                throwIfAborted(ac.signal);
            }

            const { prose, calls, errors } = ctx.fns.agent.parseMarkers(ctx, {
                text: String(text ?? ''),
            });

            // No markers and no parser errors — close the turn cleanly.
            if (calls.length === 0 && errors.length === 0) {
                // Skip empty completions entirely — they produce phantom bubbles
                // and have no informational value to either UI or LLM.
                if (!text || !String(text).trim()) {
                    publish({ type: 'model_call_finished', callId });
                    publish({ type: 'run_finished', outcome: 'completed' });
                    runFinished = true;
                    return { text: text ?? '', usage };
                }
                throwIfAborted(ac.signal);
                const html = await ctx.fns.markdown.render(ctx, {
                    source: prose || text || '',
                });
                throwIfAborted(ac.signal);
                const append = ctx.fns.session.appendAssistantMessage(ctx, {
                    id: agent.id,
                    msg: { content: text },
                });
                ctx.fns.session.syncAgentState(ctx, { agent });
                await ctx.fns.session.appendAssistantEvent(ctx, {
                    id: agent.id,
                    payload: {
                        text: prose || text || '',
                        html,
                        usage,
                        messageIdx: append.idx,
                    },
                });
                ctx.fns.session.syncAgentState(ctx, { agent });
                publish({ type: 'model_call_finished', callId });
                publish({ type: 'run_finished', outcome: 'completed' });
                runFinished = true;
                return { text, usage };
            }

            // Persist the prose chunk that preceded the first marker, if any.
            // Splitting prose from markers gives the model clean per-call pairing
            // on later turns: [assistant: prose?] → (assistant<marker> → user<result>)+.
            if (prose.trim()) {
                throwIfAborted(ac.signal);
                const proseHtml = await ctx.fns.markdown.render(ctx, {
                    source: prose,
                });
                throwIfAborted(ac.signal);
                const proseAppend = ctx.fns.session.appendAssistantMessage(
                    ctx,
                    {
                        id: agent.id,
                        msg: { content: prose },
                    },
                );
                ctx.fns.session.syncAgentState(ctx, { agent });
                await ctx.fns.session.appendAssistantEvent(ctx, {
                    id: agent.id,
                    payload: {
                        text: prose,
                        html: proseHtml,
                        usage,
                        messageIdx: proseAppend.idx,
                    },
                });
                ctx.fns.session.syncAgentState(ctx, { agent });
            }

            for (const call of calls) {
                throwIfAborted(ac.signal);
                await ctx.fns.agent.executeMarker(ctx, { agent, call, usage });
                throwIfAborted(ac.signal);
            }

            // Parser errors (misplaced markers etc) tail the chain as a single
            // user message so the model can self-correct on the next turn.
            if (errors.length > 0) {
                throwIfAborted(ac.signal);
                for (const e of errors) {
                    await ctx.fns.session.appendErrorEvent(ctx, {
                        id: agent.id,
                        error: e.hint,
                    });
                }
                const errText = errors
                    .map((e) =>
                        ctx.fns.agent.formatMarkerError(ctx, { error: e }),
                    )
                    .join('\n\n');
                ctx.fns.session.appendMessage(ctx, {
                    id: agent.id,
                    message: {
                        role: 'user',
                        content: errText,
                        excluded_from_cursor: true,
                    },
                });
                ctx.fns.session.syncAgentState(ctx, { agent });
            }
            publish({ type: 'model_call_finished', callId });
        }
    } catch (error: any) {
        if (!runFinished) {
            const stopped =
                error?.name === 'AbortError' ||
                String(error?.message ?? error ?? '').includes('aborted');
            publish({
                type: 'run_finished',
                outcome: stopped ? 'stopped' : 'failed',
                reason: stopped
                    ? String(ac.signal.reason ?? 'aborted')
                    : undefined,
                error: stopped ? undefined : String(error?.message ?? error),
            });
            runFinished = true;
        }
        throw error;
    }
}

type WithoutLiveEnvelope<T> = T extends unknown
    ? Omit<T, 'version' | 'agentId' | 'runId' | 'seq'>
    : never;
type LiveEventInput = WithoutLiveEnvelope<types.agent.LiveEvent>;

function throwIfAborted(signal: AbortSignal): void {
    if (!signal.aborted) return;
    const error = new Error(
        `AbortError: ${String(signal.reason ?? 'aborted')}`,
    );
    error.name = 'AbortError';
    throw error;
}
