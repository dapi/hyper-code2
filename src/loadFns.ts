// Scan src/ and .hyper/ for function files and register them on ctx.
// Bootstrap: ctx.fns is empty when this runs, so we import project/scan
// directly to do the first sweep. After that all other code (genTypes,
// repl.load, etc.) can use ctx.fns.project.scan normally.
import { stat } from 'node:fs/promises';

const FUNCTION_SOURCE_IDENTITY = Symbol.for('hyper-code2.function-source.loaded-function');

export default async function (ctx: Context): Promise<void> {
    const scan = ctx.fns.project?.scan
        ?? (await import("./project/scan?load=" + crypto.randomUUID())).default;
    const entries = await scan(ctx);

    // Settings registry — populated alongside fns so it's ready by the time
    // anything calls ctx.fns.settings.get(...).
    const registry: Map<string, any> = ((ctx.state as any).settingsRegistry ??= new Map());

    for (const entry of entries) {
        if (entry.kind === 'setting') {
            const mod = await import(entry.abs + `?load=${crypto.randomUUID()}`);
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
        const sourceBefore = await sourceVersion(entry.abs);
        const loadedHash = await sha256(entry.abs);
        const mod = await import(entry.abs + `?load=${crypto.randomUUID()}`);
        const fn = mod.default;
        if (typeof fn !== 'function') continue;
        const currentHash = await sha256(entry.abs);
        const sourceAfter = await sourceVersion(entry.abs);
        if (currentHash !== loadedHash || sourceAfter !== sourceBefore) {
            throw new Error(`${entry.root}/${entry.rel}: source changed while loading`);
        }
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
        recordSource(ctx, qualifiedName, entry, loadedHash, fn);
    }
}

function recordSource(ctx: Context, name: string, entry: any, loadedHash: string, fn: Function) {
    const state = ((ctx as any).state ??= {});
    const registry = (state.functionSources ??= {});
    const generation = (state.functionSourceGeneration ?? 0) + 1;
    state.functionSourceGeneration = generation;
    const receipt = {
        name,
        root: entry.root,
        rel: entry.rel,
        loadedHash,
        loadedAt: new Date().toISOString(),
        generation,
    };
    Object.defineProperty(receipt, FUNCTION_SOURCE_IDENTITY, {
        value: fn,
        enumerable: false,
        writable: false,
        configurable: false,
    });
    registry[name] = receipt;
}

async function sha256(path: string) {
    const digest = await crypto.subtle.digest('SHA-256', await Bun.file(path).arrayBuffer());
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sourceVersion(path: string) {
    const info = await stat(path, { bigint: true });
    return [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs].join(':');
}
