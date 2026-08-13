// Scan src/ and .hyper/ for function files and register them on ctx.
// Bootstrap: ctx.fns is empty when this runs, so we import project/scan
// directly to do the first sweep. After that all other code (genTypes,
// repl.load, etc.) can use ctx.fns.project.scan normally.
export default async function (ctx: Context): Promise<void> {
    const { default: scan } = await import("./project/scan?t=" + Date.now());
    const entries = await scan(ctx);

    // Settings registry — populated alongside fns so it's ready by the time
    // anything calls ctx.fns.settings.get(...).
    const registry: Map<string, any> = ((ctx.state as any).settingsRegistry ??= new Map());

    for (const entry of entries) {
        if (entry.kind === 'setting') {
            const mod = await import(entry.abs + `?t=${Date.now()}`);
            const descriptor = mod.default;
            if (!descriptor || typeof descriptor !== 'object') {
                console.warn(`[settings] skip (no default-export descriptor): ${entry.root}/${entry.rel}`);
                continue;
            }
            const regKey = `${entry.settingModule}.${entry.settingKey}`;
            registry.set(regKey, descriptor);
            console.log(`[settings] declare ${regKey}  ←  ${entry.root}/${entry.rel}`);
            continue;
        }

        if (entry.kind !== 'fn') continue;
        const mod = await import(entry.abs + `?t=${Date.now()}`);
        const fn = mod.default;
        if (typeof fn !== 'function') continue;
        const fnName = entry.runtimeName;
        const label = entry.root;
        const qualifiedName = entry.moduleDir === '.'
            ? fnName
            : `${entry.moduleDir.replaceAll('/', '.')}.${fnName}`;
        if (entry.moduleDir === '.') {
            (ctx as any)[fnName] = fn;
            console.log(`[fns] ctx.${fnName}  ←  ${label}/${entry.rel}`);
        } else {
            const segments = entry.moduleDir.split('/');
            let target: any = ctx.fns;
            for (const seg of segments) {
                target[seg] = target[seg] || {};
                target = target[seg];
            }
            target[fnName] = fn;
            console.log(`[fns] ctx.fns.${segments.join('.')}.${fnName}  ←  ${label}/${entry.rel}`);
        }
        await recordSource(ctx, qualifiedName, entry);
    }
}

async function recordSource(ctx: Context, name: string, entry: any) {
    const state = ((ctx as any).state ??= {});
    const registry = (state.functionSources ??= {});
    const generation = (state.functionSourceGeneration ?? 0) + 1;
    state.functionSourceGeneration = generation;
    registry[name] = {
        name,
        root: entry.root,
        rel: entry.rel,
        loadedHash: await sha256(entry.abs),
        loadedAt: new Date().toISOString(),
        generation,
    };
}

async function sha256(path: string) {
    const digest = await crypto.subtle.digest('SHA-256', await Bun.file(path).arrayBuffer());
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
