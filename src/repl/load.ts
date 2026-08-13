const FUNCTION_SOURCE_IDENTITY = Symbol.for('hyper-code2.function-source.loaded-function');

async function roots(ctx: Context) {
    return ctx.fns.project.roots(ctx);
}

export default async function (ctx: Context, opts: { name: string }) {
    const target = opts.name;
    if (target.includes('.')) {
        const segs = target.split('.');
        const fnName = segs.pop()!;
        const modPath = segs.join('/');
        await loadFile(ctx, modPath, fnName);
        return { reloaded: target };
    }

    const entries = await ctx.fns.project.scan(ctx);
    const loaded: string[] = [];
    for (const entry of entries) {
        if (entry.kind === 'setting' && entry.settingModule === target) {
            const m = await import((entry as any).abs + `?reload=${crypto.randomUUID()}`);
            const desc = m.default;
            if (desc && typeof desc === 'object') {
                const regKey = `${entry.settingModule}.${entry.settingKey}`;
                ((ctx.state as any).settingsRegistry ??= new Map()).set(regKey, desc);
                loaded.push(`$setting_${entry.settingKey}`);
            }
            continue;
        }
        if (entry.kind !== 'fn') continue;
        if (entry.moduleDir !== target) continue;
        await loadFile(ctx, target, entry.runtimeName);
        if (!loaded.includes(entry.runtimeName)) loaded.push(entry.runtimeName);
    }
    return { reloaded: target, count: loaded.length, fns: loaded };
}

async function loadFile(ctx: Context, modPath: string, fnName: string) {
    const candidates = [modPath + '/' + fnName + '.ts', modPath + '/$' + fnName + '.ts'];
    // Match startup resolution: project roots are ordered from base to overlay,
    // and the later root wins when both define the same registered function.
    // Search in reverse because this targeted loader returns on the first match.
    for (const root of [...await roots(ctx)].reverse()) {
        for (const rel of candidates) {
            const abs = root.dir + '/' + rel;
            if (!(await Bun.file(abs).exists())) continue;
            const loadedHash = await sha256(abs);
            const m = await import(abs + `?reload=${crypto.randomUUID()}`);
            const fn = m.default;
            if (typeof fn !== 'function') throw new Error(`${rel}: no default function export`);
            const currentHash = await sha256(abs);
            if (currentHash !== loadedHash) {
                throw new Error(`${labelPath(root.name, rel)}: source changed while loading`);
            }
            const segs = modPath.split('/');
            let tgt: any = ctx.fns;
            for (const seg of segs) {
                tgt[seg] = tgt[seg] || {};
                tgt = tgt[seg];
            }
            tgt[fnName] = fn;
            const label = root.name;
            recordSource(ctx, [...segs, fnName].join('.'), label, rel, loadedHash, fn);
            console.log(`[reload] ctx.fns.${segs.join('.')}.${fnName}  ←  ${label}/${rel}`);
            return;
        }
    }
    throw new Error(`no file for ${modPath}/${fnName}`);
}

function labelPath(root: string, rel: string) {
    return `${root}/${rel}`;
}

function recordSource(ctx: Context, name: string, root: string, rel: string, loadedHash: string, fn: Function) {
    const state = ((ctx as any).state ??= {});
    const registry = (state.functionSources ??= {});
    const generation = (state.functionSourceGeneration ?? 0) + 1;
    state.functionSourceGeneration = generation;
    const receipt = {
        name,
        root,
        rel,
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
