// Architecture contract: memory-bank/engineering/architecture.md
// This entrypoint realizes the documented load → migrate → rehydrate → serve → worker composition.
async function startLegacyRuntime() {
    const { default: startRuntime } = await import('./runtime/start.entry');
    const runtime = await startRuntime({ workspace: process.cwd(), http: true });
    (runtime.ctx.state as any).shutdown = runtime.shutdown;
    return runtime.ctx;
}

export default async function () {
    return startLegacyRuntime();
}

if (import.meta.main) {
    const forcedShutdownExitCode = 125;
    let ctx: Awaited<ReturnType<typeof startLegacyRuntime>> | undefined;
    let shuttingDown = false;
    let shutdownRequested = false;
    const shutdown = () => {
        if (shuttingDown) return;
        shuttingDown = true;
        const runtimeShutdown = (ctx?.state as any)?.shutdown;
        if (typeof runtimeShutdown !== 'function') {
            process.exitCode = 1;
            return;
        }
        void runtimeShutdown()
            .then((result: { forced?: boolean }) => {
                if (result?.forced) process.exit(forcedShutdownExitCode);
                process.exitCode = 0;
            })
            .catch((error: any) => {
                console.error('[shutdown] failed:', error?.message ?? error);
                process.exitCode = 1;
            });
    };
    // Install the handlers before runtime boot. A supervisor can signal the
    // process as soon as the listener opens, before startLegacyRuntime
    // resolves; handling that signal later must still quiesce the runtime.
    const requestShutdown = () => {
        shutdownRequested = true;
        if (ctx) shutdown();
    };
    process.once('SIGINT', requestShutdown);
    process.once('SIGTERM', requestShutdown);
    ctx = await startLegacyRuntime();
    (globalThis as any).ctx = ctx;
    if (shutdownRequested) shutdown();
    console.log("\nctx keys:", Object.keys(ctx));
    console.log("ctx.fns:", JSON.stringify(mapShape(ctx.fns), null, 2));
}

function mapShape(obj: any): any {
    if (typeof obj === "function") return "[fn]";
    if (obj && typeof obj === "object") {
        const out: any = {};
        for (const k of Object.keys(obj)) out[k] = mapShape(obj[k]);
        return out;
    }
    return typeof obj;
}
