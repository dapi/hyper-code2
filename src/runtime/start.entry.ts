import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export type RuntimeOptions = {
    workspace: string;
    dbPath?: string;
    http?: boolean;
    quiet?: boolean;
    env?: Record<string, string | undefined>;
    // Test seam and forced-shutdown safety valve for adapters that do not
    // cooperate with AbortSignal. Normal callers use the conservative default.
    shutdownTimeoutMs?: number;
};

export type RuntimeHandle = {
    ctx: Context;
    shutdown: () => Promise<ShutdownResult>;
};

export type ShutdownResult = {
    // The worker ignored cancellation beyond the bounded shutdown grace. Its
    // event-loop handles remain live, so the executable must terminate after
    // resource cleanup rather than returning to Bun's event loop.
    forced: boolean;
};

export default async function startRuntime(opts: RuntimeOptions): Promise<RuntimeHandle> {
    const previousCwd = process.cwd();
    process.chdir(opts.workspace);

    const ctx = {
        env: { ...process.env, ...opts.env },
        state: {},
        fns: {} as FnsRegistry,
        routes: {},
    } as Context;
    let shutdownPromise: Promise<ShutdownResult> | null = null;

    const shutdown = () => {
        if (shutdownPromise) return shutdownPromise;
        shutdownPromise = (async () => {
            let forced = false;
            // Queued UI launches run in a later microtask. Mark shutdown before
            // the first await so they cannot begin after the active-run snapshot.
            (ctx.state as any).runtimeShuttingDown = true;
            // Quiesce the external adapter first so no new work can arrive while
            // the worker drains/aborts and the database is still open.
            const server = (ctx.state as any).server?.server;
            if (server?.stop) {
                try {
                    const graceful = await settleWithin(server.stop(), opts.shutdownTimeoutMs ?? 2_000);
                    // /events is deliberately long-lived SSE. A browser tab must
                    // not keep the worker or SQLite alive past the shutdown grace.
                    if (!graceful) await server.stop(true);
                } catch {}
            }
            (ctx.state as any).workerLoopRunning = false;
            for (const agent of Object.values((ctx.state as any).agent ?? {}) as any[]) {
                try { agent.abortController?.abort('runtime_shutdown'); } catch {}
            }
            try { ctx.fns.agent?.wakeWorker?.(ctx); } catch {}
            const workerPromise = (ctx.state as any).workerLoopPromise as Promise<unknown> | undefined;
            const activeRuns = (ctx.state as any).activeAgentRunPromises as Set<Promise<unknown>> | undefined;
            // agent.run is also used by delegation and the UI outside the
            // worker. Await its snapshot together with the worker so SQLite
            // remains available until every already-started run has settled.
            const running = [workerPromise, ...(activeRuns ? [...activeRuns] : [])]
                .filter((promise): promise is Promise<unknown> => !!promise);
            const runsSettled = await settleWithin(Promise.allSettled(running), opts.shutdownTimeoutMs ?? 2_000);
            if (!runsSettled) {
                // An adapter can ignore AbortSignal (for example an eval
                // awaiting forever). Shutdown must still be terminal: retain
                // observers for later rejections, but never await the same
                // uncooperative work after its grace period has elapsed.
                console.warn('[runtime] agent runs did not settle within shutdown grace period; forcing runtime shutdown');
                for (const promise of running) void promise.catch(() => {});
                forced = true;
            }
            try { await (ctx.state as any).http?.logFile?.end?.(); } catch {}
            try { (ctx.state as any).db?.close?.(); } catch {}
            process.chdir(previousCwd);
            return { forced };
        })();
        return shutdownPromise;
    };

    try {
        await withMutedLogs(opts.quiet === true, async () => {
            const { default: loadFns } = await import('../loadFns');
            await loadFns(ctx);
            await ctx.genTypes(ctx);
            trackAgentRuns(ctx);

            const dbPath = opts.dbPath ?? ctx.env.DB_PATH ?? '.hyper/_runtime/sessions';
            ctx.env.DB_PATH = dbPath;
            if (dbPath !== ':memory:') await mkdir(dirname(resolve(dbPath)), { recursive: true });
            ctx.fns.db.connect(ctx, { path: dbPath });
            await ctx.fns.db.migrate(ctx);
            const rehydrated = ctx.fns.session.loadAll(ctx);
            if (!opts.quiet) console.log(`[session] rehydrated ${rehydrated.loaded} agent(s)`);

            if (opts.http) {
                await ctx.fns.http.loadRoutes(ctx);
                await ctx.fns.http.start(ctx);
            }
        });

        const workerPromise = ctx.fns.agent.workerLoop(ctx).catch((error: any) => {
            (ctx.state as any).workerLoopError = error;
            console.error('[workerLoop] crashed:', error?.message ?? error);
        });
        (ctx.state as any).workerLoopPromise = workerPromise;
        if (!opts.quiet) console.log('[worker] started');
        return { ctx, shutdown };
    } catch (error) {
        await shutdown();
        throw error;
    }
}

function trackAgentRuns(ctx: Context): void {
    const activeRuns = new Set<Promise<unknown>>();
    (ctx.state as any).activeAgentRunPromises = activeRuns;
    const run = ctx.fns.agent.run;

    ctx.fns.agent.run = ((...args: Parameters<typeof run>) => {
        // A UI launch may already be queued when shutdown begins. It must not
        // create an AbortController or touch SQLite after the shutdown snapshot.
        if ((ctx.state as any).runtimeShuttingDown) return Promise.resolve(undefined);
        let promise: Promise<unknown>;
        try {
            // Invoke immediately: agent.run installs its AbortController before
            // its first await, and stop/shutdown rely on that synchronous setup.
            promise = Promise.resolve(run(...args));
        } catch (error) {
            promise = Promise.reject(error);
        }
        activeRuns.add(promise);
        void promise.then(
            () => activeRuns.delete(promise),
            () => activeRuns.delete(promise),
        );
        return promise;
    }) as typeof run;
}

async function settleWithin(promise: Promise<unknown> | undefined, timeoutMs: number): Promise<boolean> {
    if (!promise) return true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            promise.then(() => true, () => true),
            new Promise<boolean>((resolve) => {
                timer = setTimeout(() => resolve(false), Math.max(0, timeoutMs));
            }),
        ]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

async function withMutedLogs<T>(muted: boolean, action: () => Promise<T>): Promise<T> {
    if (!muted) return action();
    const original = console.log;
    console.log = () => {};
    try {
        return await action();
    } finally {
        console.log = original;
    }
}
