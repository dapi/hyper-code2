// Architecture contract: memory-bank/engineering/architecture.md
// This entrypoint realizes the documented load → migrate → rehydrate → serve → worker composition.
export default async function () {
    const { default: startRuntime } = await import('./runtime/start.entry');
    const runtime = await startRuntime({ workspace: process.cwd(), http: true });
    (runtime.ctx.state as any).shutdown = runtime.shutdown;
    return runtime.ctx;
}

if (import.meta.main) {
    const main = (await import("./$main.ts")).default;
    const ctx = await main();
    (globalThis as any).ctx = ctx;
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
