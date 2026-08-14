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
    shutdown: () => Promise<void>;
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
    let shutdownPromise: Promise<void> | null = null;

    const shutdown = () => {
        if (shutdownPromise) return shutdownPromise;
        shutdownPromise = (async () => {
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
            const workerSettled = await settleWithin(workerPromise, opts.shutdownTimeoutMs ?? 2_000);
            if (!workerSettled) {
                // An adapter can ignore AbortSignal (for example an eval
                // awaiting forever). Shutdown must still be terminal: retain
                // an observer for a later rejection, but never await the same
                // uncooperative work after its grace period has elapsed.
                console.warn('[workerLoop] shutdown grace period elapsed; forcing runtime shutdown');
                void workerPromise?.catch(() => {});
            }
            try { await (ctx.state as any).http?.logFile?.end?.(); } catch {}
            try { (ctx.state as any).db?.close?.(); } catch {}
            process.chdir(previousCwd);
        })();
        return shutdownPromise;
    };

    try {
        await withMutedLogs(opts.quiet === true, async () => {
            const { default: loadFns } = await import('../loadFns');
            await loadFns(ctx);
            await ctx.genTypes(ctx);

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
