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
    const ctx = await startLegacyRuntime();
    (globalThis as any).ctx = ctx;
    let shuttingDown = false;
    const shutdown = () => {
        if (shuttingDown) return;
        shuttingDown = true;
        // Keep the compatibility entrypoint safe now that §bash starts a
        // detached process group: shutdown aborts it before Bun can exit.
        const runtimeShutdown = (ctx.state as any).shutdown;
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
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
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
