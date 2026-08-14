import { createInterface } from 'node:readline/promises';

export type TerminalOptions = {
    ctx: Context;
    agent: types.agent.Agent;
    workspace: string;
    initialPrompt?: string;
    input?: AsyncIterable<string>;
    write?: (text: string) => void;
    registerInterrupt?: (handler: () => void) => () => void;
    exitSignal?: AbortSignal;
};

export default async function runTerminal(opts: TerminalOptions): Promise<void> {
    const write = opts.write ?? ((text: string) => process.stdout.write(text));
    const oneShot = !opts.input && Boolean(opts.initialPrompt) && !process.stdin.isTTY;
    const readline = opts.input || oneShot ? null : createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: Boolean(process.stdin.isTTY && process.stdout.isTTY),
    });
    const input = opts.input ?? (oneShot ? emptyLines() : readline!);
    let busy = false;
    let stopRequested = false;
    let exitRequested = false;
    const exitController = new AbortController();

    write(`workspace: ${opts.workspace}\nmodel: ${opts.agent.model}\n`);
    write('Ctrl+C stops a running turn; Ctrl+D or /exit exits.\n\n');
    write('Concurrent hcode processes for the same workspace are unsupported in this preview.\n\n');

    const onSigint = () => {
        if (busy) {
            if (!stopRequested) {
                stopRequested = true;
                opts.ctx.fns.agent.stop(opts.ctx, { agent: opts.agent, clearQueue: true });
                write('\n[stopped; press Ctrl+C again to exit]\n');
            } else {
                exitRequested = true;
                exitController.abort();
                readline?.close();
            }
        } else {
            exitRequested = true;
            exitController.abort();
            readline?.close();
        }
    };
    const unregisterInterrupt = opts.registerInterrupt
        ? opts.registerInterrupt(onSigint)
        : (() => {
            if (readline?.terminal) {
                readline.on('SIGINT', onSigint);
                return () => readline.off('SIGINT', onSigint);
            }
            // Redirected stdin/stdout readline sessions receive SIGINT on the
            // process, just like positional one-shot runs with no interface.
            process.on('SIGINT', onSigint);
            return () => process.off('SIGINT', onSigint);
        })();
    const onExitSignal = () => {
        exitRequested = true;
        exitController.abort();
        readline?.close();
    };
    // readline emits close for Ctrl+D/EOF even if the prompt loop is waiting
    // on an active turn rather than requesting its next line. Route it through
    // the shared exit controller so that turn does not keep terminal shutdown
    // blocked.
    const onReadlineClose = () => onExitSignal();
    readline?.on('close', onReadlineClose);
    opts.exitSignal?.addEventListener('abort', onExitSignal, { once: true });
    if (opts.exitSignal?.aborted) onExitSignal();
    if (!opts.input && !opts.initialPrompt) write('> ');

    try {
        const prompts = prepend(opts.initialPrompt, input);
        for await (const raw of prompts) {
            if (exitRequested) break;
            const text = raw.trim();
            if (!text) continue;
            if (text === '/exit') break;
            busy = true;
            stopRequested = false;
            try {
                const activeTurn = submitAndRender(opts.ctx, opts.agent, text, write);
                const exitWait = waitForAbort(exitController.signal);
                const outcome = await Promise.race([
                    activeTurn.then(() => 'turn' as const),
                    exitWait.promise.then(() => 'exit' as const),
                ]);
                exitWait.cancel();
                if (outcome === 'exit') {
                    // Observe any later failure from an adapter that ignored
                    // cancellation, without keeping terminal shutdown blocked.
                    void activeTurn.catch(() => {});
                    break;
                }
            } finally {
                busy = false;
            }
            if (readline) write('\n> ');
        }
    } finally {
        opts.exitSignal?.removeEventListener('abort', onExitSignal);
        readline?.off('close', onReadlineClose);
        unregisterInterrupt();
        readline?.close();
    }
}

async function submitAndRender(
    ctx: Context,
    agent: types.agent.Agent,
    text: string,
    write: (text: string) => void,
) {
    let offset = ctx.fns.session.getMaxEventIdx(ctx, { id: agent.id }) + 1;
    await ctx.fns.agent.submit(ctx, { agent, text, delayMs: 0 });

    while (true) {
        throwIfWorkerCrashed(ctx);
        const events = ctx.fns.session.getEvents(ctx, { id: agent.id, fromIdx: offset });
        for (const event of events) {
            renderEvent(event, write);
            offset++;
        }

        const row = ctx.fns.db.select<any>(ctx, {
            sql: 'SELECT run_state, next_run_at FROM agents WHERE id = ?', params: [agent.id],
        })[0];
        if (!row || (row.run_state === 'idle' && row.next_run_at == null)) {
            const tail = ctx.fns.session.getEvents(ctx, { id: agent.id, fromIdx: offset });
            for (const event of tail) {
                renderEvent(event, write);
                offset++;
            }
            return;
        }
        await ctx.fns.agent.waitForEvent(ctx, { agentId: agent.id, timeoutMs: 100 });
        throwIfWorkerCrashed(ctx);
    }
}

function throwIfWorkerCrashed(ctx: Context): void {
    const error = (ctx.state as any).workerLoopError;
    if (!error) return;
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`agent worker crashed: ${detail}`);
}

function renderEvent(event: any, write: (text: string) => void) {
    if (event.type === 'user' || event.type === 'job') return;
    if (event.type === 'assistant') {
        if (!event.text && event.html) write('[HTML response available in browser mode only]\n');
        else write(`${event.text ?? ''}\n`);
    }
    else if (event.type === 'thinking') write(`[thinking] ${event.text ?? ''}\n`);
    else if (event.type === 'tool_call') {
        const status = event.isError ? 'failed' : 'done';
        write(`[tool ${event.name ?? 'unknown'}: ${status}]\n${event.result ?? ''}\n`);
    } else if (event.type === 'error') write(`[error] ${event.error ?? 'unknown error'}\n`);
}

async function* prepend(first: string | undefined, rest: AsyncIterable<string>) {
    if (first?.trim()) yield first;
    yield* rest;
}

async function* emptyLines(): AsyncIterable<string> {}

function waitForAbort(signal: AbortSignal): { promise: Promise<void>; cancel: () => void } {
    if (signal.aborted) return { promise: Promise.resolve(), cancel: () => {} };
    let resolvePromise!: () => void;
    const onAbort = () => resolvePromise();
    const promise = new Promise<void>((resolve) => { resolvePromise = resolve; });
    signal.addEventListener('abort', onAbort, { once: true });
    return { promise, cancel: () => signal.removeEventListener('abort', onAbort) };
}
