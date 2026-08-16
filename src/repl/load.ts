import { realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

const FUNCTION_SOURCE_IDENTITY = Symbol.for('hyper-code2.function-source.loaded-function');
const FUNCTION_SOURCE_PATH = Symbol.for('hyper-code2.function-source.loaded-physical-path');
const FUNCTION_SOURCE_WRAPPED_IDENTITY = Symbol.for('hyper-code2.function-source.wrapped-function');

async function roots(ctx: Context) {
    return ctx.fns.project.roots(ctx);
}

export default async function (ctx: Context, opts: { name: string }) {
    const target = opts.name;
    if (target.includes('.')) {
        const segs = target.split('.');
        const fnName = segs.pop()!;
        const modPath = segs.join('/');
        let staged: LoadedFunction;
        let committed = false;
        try {
            staged = await stageFile(ctx, modPath, fnName);
        } catch (error) {
            if (error instanceof MissingFunctionError
                && hasFunctionRecord(ctx, target)
                && await isStablyMissing(ctx, modPath, fnName)) {
                // A process upgraded in place can have a validated receipt but
                // no transient lifecycle record yet. Adopt it before removal
                // so its implementation is retired and disposed normally.
                const rollbackMetadata = snapshotLifecycleMetadata(ctx);
                try {
                    seedExistingActiveRecords(ctx, [target]);
                    preflightRemovals(ctx, [target]);
                    removeFunction(ctx, target);
                } catch (removalError) {
                    rollbackMetadata();
                    throw removalError;
                }
            }
            throw error;
        }
        try {
            await validateStaged(ctx, [staged]);
            commitFunctions(ctx, [staged]);
            committed = true;
        } finally {
            if (!committed) await disposeStaged(ctx, [staged]);
        }
        return { reloaded: target };
    }

    const entries = await ctx.fns.project.scan(ctx);
    const initialFunctionNames = namespaceFunctionNames(entries, target);
    const initialSettings = namespaceSettingCandidates(entries, target);
    const loaded: string[] = [];
    const loadedFunctions = new Set<string>();
    const staged: LoadedFunction[] = [];
    const stagedSettings: LoadedSetting[] = [];
    let committed = false;
    try {
        for (const entry of entries) {
            if (entry.kind === 'setting' && entry.settingModule === target) {
                // Settings use fallback precedence: stage every candidate so
                // an invalid overlay can fall back to the preceding valid
                // descriptor instead of retaining a stale published value.
                stagedSettings.push(await stageSetting(entry));
                continue;
            }
            if (entry.kind !== 'fn') continue;
            if (entry.moduleDir !== target) continue;
            if (loadedFunctions.has(entry.runtimeName)) continue;
            loadedFunctions.add(entry.runtimeName);
            staged.push(await stageFile(ctx, target, entry.runtimeName));
            loaded.push(entry.runtimeName);
        }
        const prefix = namespaceRegistryPrefix(target);
        const namesBefore = await validateNamespaceSnapshot(
            ctx, target, staged, stagedSettings, initialFunctionNames, initialSettings,
        );
        const effectiveSettings = effectiveSettingDescriptors(stagedSettings);
        commitFunctions(
            ctx,
            staged,
            [...namesBefore].filter((name) => !loadedFunctions.has(name.slice(prefix.length))),
            effectiveSettings,
            target,
        );
        for (const setting of effectiveSettings) loaded.push(`$setting_${setting.entry.settingKey}`);
        committed = true;
    } finally {
        if (!committed) await disposeStaged(ctx, staged);
    }
    return { reloaded: target, count: loaded.length, fns: loaded };
}

function namespaceFunctionNames(entries: any[], target: string) {
    const names = new Set<string>();
    for (const entry of entries) {
        if (entry.kind === 'fn' && entry.moduleDir === target) names.add(entry.runtimeName);
    }
    return names;
}

function sameFunctionNames(left: Set<string>, right: Set<string>) {
    return left.size === right.size && [...left].every((name) => right.has(name));
}

function namespaceSettingCandidates(entries: any[], target: string) {
    return entries.filter((entry) => entry.kind === 'setting' && entry.settingModule === target);
}

function sameSettingCandidates(left: any[], right: any[]) {
    return left.length === right.length && left.every((entry, index) => {
        const other = right[index];
        return other
            && other.root === entry.root
            && other.rel === entry.rel
            && other.abs === entry.abs
            && other.settingModule === entry.settingModule
            && other.settingKey === entry.settingKey;
    });
}

class MissingFunctionError extends Error {}

type LoadedFunction = {
    name: string;
    modPath: string;
    fnName: string;
    root: string;
    rootDir: string;
    rel: string;
    candidatePath: string;
    sourcePath: string;
    loadedHash: string;
    loadedVersion: string;
    fn: Function;
};

type LoadedSetting = {
    entry: any;
    key: string;
    sourcePath: string;
    loadedHash: string;
    loadedVersion: string;
    descriptor?: object;
};

async function stageSetting(entry: any): Promise<LoadedSetting> {
    const sourcePath = await realpath(resolve(entry.abs));
    const loadedVersion = await sourceVersion(sourcePath);
    const loadedHash = await sha256(sourcePath);
    const m = await import(sourcePath + `?reload=${crypto.randomUUID()}`);
    const descriptor = m.default;
    const staged = { entry, key: settingKey(entry), sourcePath, loadedHash, loadedVersion };
    if (!descriptor || typeof descriptor !== 'object') return staged;
    return { ...staged, descriptor };
}

async function stageFile(ctx: Context, modPath: string, fnName: string): Promise<LoadedFunction> {
    const candidates = [modPath + '/' + fnName + '.ts', modPath + '/$' + fnName + '.ts'];
    // Match startup resolution: project roots are ordered from base to overlay,
    // and the later root wins when both define the same registered function.
    // Search in reverse because this targeted loader returns on the first match.
    for (const root of [...await roots(ctx)].reverse()) {
        for (const rel of candidates) {
            const candidatePath = resolve(root.dir, rel);
            if (!(await Bun.file(candidatePath).exists())) continue;
            const sourcePath = await realpath(candidatePath);
            const sourceBefore = await sourceVersion(sourcePath);
            const loadedHash = await sha256(sourcePath);
            const m = await import(sourcePath + `?reload=${crypto.randomUUID()}`);
            const fn = m.default;
            if (typeof fn !== 'function') throw new Error(`${rel}: no default function export`);
            try {
                const currentHash = await sha256(sourcePath);
                const sourceAfter = await sourceVersion(sourcePath);
                if (currentHash !== loadedHash || sourceAfter !== sourceBefore) {
                    throw new Error(`${labelPath(root.name, rel)}: source changed while loading`);
                }
            } catch (error) {
                // Module evaluation can acquire resources before the final
                // source check detects a concurrent rewrite. It never became
                // a staged member, so clean that identity up explicitly.
                await disposeStaged(ctx, [{ name: [...modPath.split('/'), fnName].join('.'), fn } as LoadedFunction]);
                throw error;
            }
            return {
                name: [...modPath.split('/'), fnName].join('.'),
                modPath,
                fnName,
                root: root.name,
                rootDir: root.dir,
                rel,
                candidatePath,
                sourcePath,
                loadedHash,
                loadedVersion: sourceBefore,
                fn,
            };
        }
    }
    throw new MissingFunctionError(`no file for ${modPath}/${fnName}`);
}

function commitFunctions(
    ctx: Context,
    staged: LoadedFunction[],
    removedNames: string[] = [],
    stagedSettings: LoadedSetting[] = [],
    targetNamespace?: string,
) {
    const rollbackMetadata = snapshotLifecycleMetadata(ctx);
    // Do this before changing any registry property: a singleton that was
    // previously retired may already be disposing and cannot safely become a
    // new active generation.
    try {
        seedExistingActiveRecords(ctx, [...staged.map((item) => item.name), ...removedNames]);
        for (const item of staged) assertReactivatable(ctx, item.name, item.fn);
        preflightPublication(ctx, staged);
        preflightRemovals(ctx, removedNames);
        preflightSettingsRegistry(ctx, stagedSettings, targetNamespace);
        const rollbackPublication = publishStaged(ctx, staged, removedNames);
        const retired: Array<{ name: string; record: any }> = [];
        try {
            for (const item of staged) {
                const previous = recordSource(ctx, item.name, item.root, item.rel, item.sourcePath, item.loadedHash, item.fn);
                if (previous) retired.push({ name: item.name, record: previous });
                console.log(`[reload] ctx.fns.${item.name}  ←  ${item.root}/${item.rel}`);
            }
            // Remove every old alias and register every retired record before the first
            // quiescence check. Shared identities may carry a lease through any alias.
            for (const name of removedNames) removeFunction(ctx, name, retired);
            reconcileNamespaceSettings(ctx, targetNamespace, stagedSettings);
            retireGenerations(ctx, retired);
        } catch (error) {
            rollbackPublication();
            throw error;
        }
    } catch (error) {
        rollbackMetadata();
        throw error;
    }
}

function loadedIdentity(fn: Function) {
    const wrapped = (fn as any)[FUNCTION_SOURCE_WRAPPED_IDENTITY];
    return typeof wrapped === 'function' ? wrapped : fn;
}

function resolveLiveFunction(ctx: Context, name: string) {
    let value: any = ctx.fns;
    for (const segment of name.split('.')) {
        if (!value || !Object.prototype.hasOwnProperty.call(value, segment)) return undefined;
        value = value[segment];
    }
    return typeof value === 'function' ? value : undefined;
}

function seedExistingActiveRecords(ctx: Context, names: string[]) {
    const state = ((ctx as any).state ??= {});
    const receipts = state.functionSources ?? {};
    const lifecycle = ensureLifecycle(ctx);
    for (const name of new Set(names)) {
        if (ownRegistryValue(lifecycle.active, name)) continue;
        const receipt = ownRegistryValue(receipts, name);
        const live = resolveLiveFunction(ctx, name);
        if (!receipt || !live || !Number.isInteger(receipt.generation)) continue;
        const identity = receipt[FUNCTION_SOURCE_IDENTITY];
        if (typeof identity === 'function' && identity === loadedIdentity(live)) {
            lifecycle.active[name] = { generation: receipt.generation, fn: identity };
            state.functionSourceGeneration = Math.max(state.functionSourceGeneration ?? 0, receipt.generation);
        }
    }
}

function preflightPublication(ctx: Context, staged: LoadedFunction[]) {
    for (const item of staged) {
        let target: any = ctx.fns;
        for (const segment of item.modPath.split('/')) {
            const value = target[segment];
            if (value) {
                if (typeof value !== 'object') throw new Error(`cannot publish ${item.name}: ${segment} is not a namespace`);
                target = value;
                continue;
            }
            assertAssignable(target, segment, `namespace ${segment}`);
            target = {};
        }
        const accessor = ownRegistryValue((ctx.state as any)?.runtimeProcedureAccessors, item.name);
        if (accessor && !Object.getOwnPropertyDescriptor(target, item.fnName)
            && !Object.isExtensible(target)) {
            throw new Error(`cannot publish ${item.name}: namespace is not extensible`);
        }
        assertAssignable(target, item.fnName, item.name);
    }
}

function preflightRemovals(ctx: Context, names: string[]) {
    for (const name of names) {
        const parts = name.split('.');
        const fnName = parts.pop()!;
        let target: any = ctx.fns;
        for (const part of parts) target = target?.[part];
        if (!target || typeof target !== 'object') continue;
        const descriptor = Object.getOwnPropertyDescriptor(target, fnName);
        if (descriptor && !descriptor.configurable) {
            throw new Error(`cannot remove ${name}: target property is not configurable`);
        }
    }
}

function preflightSettingsRegistry(
    ctx: Context,
    settings: LoadedSetting[],
    targetNamespace: string | undefined,
) {
    const registry = (ctx.state as any)?.settingsRegistry;
    if (!settings.length && (targetNamespace === undefined || registry === undefined)) return;
    if (registry !== undefined && !(registry instanceof Map)) {
        throw new Error('cannot publish settings: registry is not a Map');
    }
}

function reconcileNamespaceSettings(
    ctx: Context,
    targetNamespace: string | undefined,
    settings: LoadedSetting[],
) {
    // A namespace reload owns only its own declaration slice. Reconcile that
    // slice so a deleted or malformed final candidate cannot remain visible.
    if (!targetNamespace) {
        if (!settings.length) return;
        const registry: Map<string, any> = ((ctx.state as any).settingsRegistry ??= new Map());
        for (const setting of settings) registry.set(setting.key, setting.descriptor);
        return;
    }

    const registry = (ctx.state as any).settingsRegistry as Map<string, any> | undefined;
    if (!registry && !settings.length) return;
    const published = registry ?? ((ctx.state as any).settingsRegistry = new Map<string, any>());
    const prefix = `${targetNamespace}.`;
    const effectiveKeys = new Set(settings.map((setting) => setting.key));
    for (const key of published.keys()) {
        if (typeof key === 'string' && key.startsWith(prefix) && !effectiveKeys.has(key)) {
            published.delete(key);
        }
    }
    for (const setting of settings) published.set(setting.key, setting.descriptor);
}

function assertAssignable(target: object, key: string, label: string) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (!descriptor && !Object.isExtensible(target)) {
        throw new Error(`cannot publish ${label}: target is not extensible`);
    }
    if (descriptor && (("value" in descriptor && !descriptor.writable)
        || (!("value" in descriptor) && !descriptor.set))) {
        throw new Error(`cannot publish ${label}: target property is not writable`);
    }
    if (descriptor && !("value" in descriptor)
        && !wrappedAccessorImplementation(target, descriptor)) {
        throw new Error(`cannot publish ${label}: accessor is not reversible`);
    }
}

function publishStaged(ctx: Context, staged: LoadedFunction[], removedNames: string[] = []) {
    const missing = Symbol('missing-property');
    const snapshots: Array<{
        target: object;
        key: string;
        descriptor: PropertyDescriptor | typeof missing;
        accessorImplementation?: Function;
    }> = [];
    const captured = new Map<object, Set<string>>();
    const restoredAccessors: Array<{ name: string; descriptor: PropertyDescriptor }> = [];
    const capture = (target: object, key: string) => {
        const keys = captured.get(target) ?? new Set<string>();
        if (keys.has(key)) return;
        keys.add(key);
        captured.set(target, keys);
        const descriptor = Object.getOwnPropertyDescriptor(target, key) ?? missing;
        snapshots.push({
            target,
            key,
            descriptor,
            accessorImplementation: descriptor === missing
                ? undefined
                : wrappedAccessorImplementation(target, descriptor),
        });
    };
    const rollback = () => {
        for (const snapshot of [...snapshots].reverse()) {
            if (snapshot.descriptor === missing) delete (snapshot.target as any)[snapshot.key];
            else {
                Object.defineProperty(snapshot.target, snapshot.key, snapshot.descriptor);
                if (snapshot.accessorImplementation) {
                    (snapshot.target as any)[snapshot.key] = snapshot.accessorImplementation;
                }
            }
        }
        const accessors = (ctx.state as any)?.runtimeProcedureAccessors;
        for (const restored of restoredAccessors) accessors[restored.name] = restored.descriptor;
    };
    try {
        // Removals occur after staged assignments and before settings writes.
        // Include their registry slots in this transaction up front so a later
        // failure can restore a function that was already deleted.
        for (const name of removedNames) {
            const parts = name.split('.');
            const fnName = parts.pop()!;
            let target: any = ctx.fns;
            for (const part of parts) target = target?.[part];
            if (target && typeof target === 'object') capture(target, fnName);
        }
        for (const item of staged) {
            let target: any = ctx.fns;
            for (const segment of item.modPath.split('/')) {
                if (!target[segment]) {
                    capture(target, segment);
                    target[segment] = {};
                }
                target = target[segment];
            }
            const accessors = (ctx.state as any)?.runtimeProcedureAccessors;
            const accessor = ownRegistryValue(accessors, item.name);
            if (accessor && !Object.getOwnPropertyDescriptor(target, item.fnName)) {
                capture(target, item.fnName);
                Object.defineProperty(target, item.fnName, accessor);
                delete accessors[item.name];
                restoredAccessors.push({ name: item.name, descriptor: accessor });
            }
            capture(target, item.fnName);
            target[item.fnName] = item.fn;
        }
        return rollback;
    } catch (error) {
        rollback();
        throw error;
    }
}

function wrappedAccessorImplementation(target: object, descriptor: PropertyDescriptor) {
    if (!descriptor.get || !descriptor.set) return undefined;
    try {
        const callable = descriptor.get.call(target);
        const implementation = typeof callable === 'function'
            ? (callable as any)[FUNCTION_SOURCE_WRAPPED_IDENTITY]
            : undefined;
        return typeof implementation === 'function' ? implementation : undefined;
    } catch {
        // Capturing a rollback value must not make an otherwise writable
        // accessor unpublishable. Only runtime wrappers expose this identity.
        return undefined;
    }
}

async function disposeStaged(ctx: Context, staged: LoadedFunction[]) {
    const disposed = new Set<Function>();
    const lifecycle = ensureLifecycle(ctx);
    for (const item of staged) {
        const fn = item.fn;
        const live = resolveLiveFunction(ctx, item.name);
        if (disposed.has(fn)
            || lifecycle.retiredIdentities.has(fn)
            || (live && loadedIdentity(live) === fn)
            || lifecycleOwnsIdentity(ctx, fn)) continue;
        disposed.add(fn);
        try {
            const dispose = (fn as any).dispose;
            if (typeof dispose === 'function') {
                // This identity has acquired resources but was never published.
                // It must remain unavailable after teardown just like a retired
                // generation, even once its disposer has finished.
                lifecycle.retiredIdentities.add(fn);
                await dispose(ctx);
            }
        } catch (error) {
            console.error(`[reload] staged ${item.name} disposal failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

function lifecycleOwnsIdentity(ctx: Context, fn: Function) {
    const lifecycle = (ctx.state as any)?.functionLifecycle;
    return Object.values(lifecycle?.active ?? {}).some((record: any) => record?.fn === fn)
        || Object.values(lifecycle?.retired ?? {}).some((record: any) => record?.fn === fn);
}

async function validateStaged(ctx: Context, staged: LoadedFunction[]) {
    await Promise.all(staged.map(async (item) => {
        try {
            // The physical source alone is insufficient here: a symlinked
            // root can move while an import is suspended at top level, leaving
            // the old target intact. Re-resolve the logical winner so the
            // staged item is still part of the current replacement set.
            const current = await currentCandidate(ctx, item.modPath, item.fnName);
            if (!current
                || current.root.name !== item.root
                || current.root.dir !== item.rootDir
                || current.rel !== item.rel
                || current.candidatePath !== item.candidatePath
                || await realpath(current.candidatePath) !== item.sourcePath) {
                throw new Error('logical candidate changed');
            }
            const [currentHash, currentVersion] = await Promise.all([
                sha256(item.sourcePath),
                sourceVersion(item.sourcePath),
            ]);
            if (currentHash === item.loadedHash && currentVersion === item.loadedVersion) return;
        } catch {
            // Treat deletion and unreadable replacements exactly like a source
            // rewrite: the staged implementation must not be published.
        }
        throw new Error(`${labelPath(item.root, item.rel)}: source changed while loading`);
    }));
    // The per-item validations finish at different times. Re-read the whole
    // candidate/source vector after that barrier so an early member cannot be
    // published if it changed while another member was still validating.
    await validateSourceVector(ctx, staged);
}

async function validateNamespaceSnapshot(
    ctx: Context,
    target: string,
    staged: LoadedFunction[],
    stagedSettings: LoadedSetting[],
    expectedNames: Set<string>,
    expectedSettings: any[],
) {
    // Membership/removal discovery also awaits the filesystem. Require two
    // equal snapshots; a candidate restored during validation must abort the
    // reload instead of being deleted by the synchronous commit below.
    const first = await namespaceSnapshot(ctx, target, staged, stagedSettings);
    const second = await namespaceSnapshot(ctx, target, staged, stagedSettings);
    if (!sameFunctionNames(expectedNames, first.names)
        || !sameFunctionNames(first.names, second.names)
        || !sameSettingCandidates(expectedSettings, first.settings)
        || !sameSettingCandidates(first.settings, second.settings)
        || !sameStringSets(first.removedNames, second.removedNames)) {
        throw new Error(`namespace ${target}: membership changed while loading`);
    }
    return [...second.removedNames];
}

async function namespaceSnapshot(
    ctx: Context,
    target: string,
    staged: LoadedFunction[],
    stagedSettings: LoadedSetting[],
) {
    const entries = await ctx.fns.project.scan(ctx);
    const names = namespaceFunctionNames(entries, target);
    const settings = namespaceSettingCandidates(entries, target);
    const removedNames = await reconcilableFunctionNames(ctx, target, await canonicalRoots(ctx));
    // Keep source validation last: this vector is the final asynchronous
    // observation before the caller returns to synchronous publication.
    await validateStaged(ctx, staged);
    await validateSettings(stagedSettings);
    return { names, settings, removedNames };
}

async function validateSettings(staged: LoadedSetting[]) {
    await Promise.all(staged.map(async (item) => {
        try {
            if (await realpath(resolve(item.entry.abs)) !== item.sourcePath) {
                throw new Error('logical source changed');
            }
            const [currentHash, currentVersion] = await Promise.all([
                sha256(item.sourcePath),
                sourceVersion(item.sourcePath),
            ]);
            if (currentHash === item.loadedHash && currentVersion === item.loadedVersion) return;
        } catch {
            // Deletion and unreadable replacements are source changes too.
        }
        throw new Error(`${labelPath(item.entry.root, item.entry.rel)}: source changed while loading`);
    }));
}

function sameStringSets(left: Set<string>, right: Set<string>) {
    return left.size === right.size && [...left].every((name) => right.has(name));
}

async function validateSourceVector(ctx: Context, staged: LoadedFunction[]) {
    await Promise.all(staged.map(async (item) => {
        try {
            const current = await currentCandidate(ctx, item.modPath, item.fnName);
            if (!current
                || current.root.name !== item.root
                || current.root.dir !== item.rootDir
                || current.rel !== item.rel
                || current.candidatePath !== item.candidatePath
                || await realpath(current.candidatePath) !== item.sourcePath) {
                throw new Error('logical candidate changed');
            }
            const [currentHash, currentVersion] = await Promise.all([
                sha256(item.sourcePath),
                sourceVersion(item.sourcePath),
            ]);
            if (currentHash === item.loadedHash && currentVersion === item.loadedVersion) return;
        } catch {
            // Match the primary validation's fail-closed behavior.
        }
        throw new Error(`${labelPath(item.root, item.rel)}: source changed while loading`);
    }));
}

async function currentCandidate(ctx: Context, modPath: string, fnName: string) {
    const candidates = [modPath + '/' + fnName + '.ts', modPath + '/$' + fnName + '.ts'];
    for (const root of [...await roots(ctx)].reverse()) {
        for (const rel of candidates) {
            const candidatePath = resolve(root.dir, rel);
            if (await Bun.file(candidatePath).exists()) return { root, rel, candidatePath };
        }
    }
    return undefined;
}

async function isStablyMissing(ctx: Context, modPath: string, fnName: string) {
    // A targeted reload normally has only one candidate observation. Match the
    // namespace path's stable-membership rule before changing live state: an
    // atomic replace may expose a brief absence between the failed stage and
    // this recheck.
    return !(await currentCandidate(ctx, modPath, fnName))
        && !(await currentCandidate(ctx, modPath, fnName));
}

async function reconcilableFunctionNames(
    ctx: Context,
    modulePath: string,
    currentRoots: Array<{ name: string; dir: string }>,
) {
    const prefix = namespaceRegistryPrefix(modulePath);
    const names = new Set<string>();
    for (const [name, receipt] of Object.entries((ctx.state as any)?.functionSources ?? {}) as any) {
        if (!name.startsWith(prefix)) continue;
        const member = name.slice(prefix.length);
        // A namespace reload owns its immediate procedures only. Descendant
        // namespaces have independent replacement sets and receipts.
        if (!member || member.includes('.')) continue;
        const sourcePath = receipt?.[FUNCTION_SOURCE_PATH];
        if (typeof sourcePath !== 'string') continue;
        // Receipts carry a physical source path, which loses the logical
        // symlink path that named the root. A missing registered root name is
        // therefore itself evidence that its namespace membership is gone.
        if (typeof receipt.root === 'string' && !currentRoots.some((root) => root.name === receipt.root)) {
            names.add(name);
            continue;
        }
        if (currentRoots.some((root) => isWithin(root.dir, sourcePath))) {
            names.add(name);
            continue;
        }
        // A logical root that now resolves elsewhere replaces its entire
        // namespace membership. Its old physical tree can still exist (for
        // example after a symlink swap), but its receipts are no longer valid.
        if (currentRoots.some((root) => root.name === receipt.root)) {
            names.add(name);
            continue;
        }

        // Legacy receipts without a logical root can still detect removal by
        // reconstructing their prior physical root from the source path.
        const priorRoot = receiptRoot(sourcePath, receipt.rel);
        if (priorRoot && !(await pathExists(priorRoot))) names.add(name);
    }
    return names;
}

function namespaceRegistryPrefix(modulePath: string) {
    return modulePath === '.' ? '' : `${modulePath.replaceAll('/', '.')}.`;
}

function settingKey(entry: any) {
    return `${entry.settingModule}.${entry.settingKey}`;
}

function hasDescriptor(setting: LoadedSetting): setting is LoadedSetting & { descriptor: object } {
    return !!setting.descriptor;
}

function effectiveSettingDescriptors(settings: LoadedSetting[]) {
    // project.scan orders roots by precedence. Retain the last valid
    // descriptor for each key, allowing a malformed overlay to fall back to
    // the closest valid base candidate.
    const effective = new Map<string, LoadedSetting & { descriptor: object }>();
    for (const setting of settings) {
        if (hasDescriptor(setting)) effective.set(setting.key, setting);
    }
    return [...effective.values()];
}

async function canonicalRoots(ctx: Context) {
    return Promise.all((await roots(ctx)).map(async (root) => ({
        ...root,
        dir: await realpath(root.dir).catch(() => resolve(root.dir)),
    })));
}

function isWithin(rootDir: string, sourcePath: string) {
    const rel = relative(rootDir, sourcePath);
    return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`));
}

function receiptRoot(sourcePath: string, rel: unknown) {
    if (typeof rel !== 'string' || !rel) return undefined;
    const segments = rel.split('/').filter(Boolean);
    return resolve(sourcePath, ...segments.map(() => '..'));
}

async function pathExists(path: string) {
    return stat(path).then(() => true).catch(() => false);
}

function hasFunctionRecord(ctx: Context, name: string) {
    return !!ownRegistryValue((ctx.state as any)?.functionSources, name)
        || !!ownRegistryValue((ctx.state as any)?.functionLifecycle?.active, name);
}

type ObjectSnapshot = { target: object; descriptors: PropertyDescriptorMap };

function snapshotLifecycleMetadata(ctx: Context) {
    const state = ((ctx as any).state ??= {});
    const lifecycle = state.functionLifecycle;
    const snapshots = [
        snapshotObject(state),
        snapshotObject(state.functionSources),
        snapshotObject(state.runtimeProcedureAccessors),
        snapshotObject(lifecycle),
        snapshotObject(lifecycle?.active),
        snapshotObject(lifecycle?.retired),
        snapshotObject(lifecycle?.unavailable),
        snapshotObject(lifecycle?.disposalErrors),
        ...Object.values(lifecycle?.active ?? {}).map(snapshotObject),
        ...Object.values(lifecycle?.retired ?? {}).map(snapshotObject),
    ].filter((snapshot): snapshot is ObjectSnapshot => !!snapshot);
    const settingsRegistry = state.settingsRegistry;
    const settingsEntries = settingsRegistry instanceof Map ? [...settingsRegistry.entries()] : undefined;

    return () => {
        if (settingsEntries && settingsRegistry instanceof Map) {
            Map.prototype.clear.call(settingsRegistry);
            for (const [key, value] of settingsEntries) Map.prototype.set.call(settingsRegistry, key, value);
        }
        for (const snapshot of [...snapshots].reverse()) restoreObject(snapshot);
    };
}

function snapshotObject(value: unknown): ObjectSnapshot | undefined {
    if (!value || (typeof value !== 'object' && typeof value !== 'function')) return undefined;
    return { target: value, descriptors: Object.getOwnPropertyDescriptors(value) };
}

function restoreObject(snapshot: ObjectSnapshot) {
    for (const key of Reflect.ownKeys(snapshot.target)) {
        if (!Object.prototype.hasOwnProperty.call(snapshot.descriptors, key)) {
            delete (snapshot.target as any)[key];
        }
    }
    Object.defineProperties(snapshot.target, snapshot.descriptors);
}

function removeFunction(
    ctx: Context,
    name: string,
    retired?: Array<{ name: string; record: any }>,
) {
    const parts = name.split('.');
    const fnName = parts.pop()!;
    let target: any = ctx.fns;
    for (const part of parts) target = target?.[part];
    const previous = ownRegistryValue((ctx.state as any)?.functionLifecycle?.active, name);
    if (target && typeof target === 'object') {
        preserveRuntimeProcedureAccessor(ctx, name, target, fnName);
        delete target[fnName];
    }
    const receipts = (ctx.state as any)?.functionSources;
    if (receipts) delete receipts[name];
    const lifecycle = ensureLifecycle(ctx);
    delete lifecycle.active[name];
    if (previous) {
        if (retired) retired.push({ name, record: previous });
        else retireGenerations(ctx, [{ name, record: previous }]);
    }
    lifecycle.unavailable[name] = {
        generation: ((ctx.state as any).functionSourceGeneration ?? 0) + 1,
        reason: 'no-current-candidate',
        recordedAt: new Date().toISOString(),
    };
}

function preserveRuntimeProcedureAccessor(ctx: Context, name: string, target: object, fnName: string) {
    const descriptor = Object.getOwnPropertyDescriptor(target, fnName);
    const publicCallable = descriptor?.get?.call(target);
    if (!descriptor?.configurable || !descriptor.set
        || typeof publicCallable !== 'function'
        || typeof (publicCallable as any)[FUNCTION_SOURCE_WRAPPED_IDENTITY] !== 'function') return;
    (((ctx.state as any).runtimeProcedureAccessors ??= createRegistry())[name]) = descriptor;
}

function restoreRuntimeProcedureAccessor(ctx: Context, name: string, target: object, fnName: string) {
    const accessors = (ctx.state as any)?.runtimeProcedureAccessors;
    const descriptor = ownRegistryValue(accessors, name);
    if (!descriptor || Object.getOwnPropertyDescriptor(target, fnName)) return;
    Object.defineProperty(target, fnName, descriptor);
    delete accessors[name];
}

function labelPath(root: string, rel: string) {
    return `${root}/${rel}`;
}

function recordSource(
    ctx: Context,
    name: string,
    root: string,
    rel: string,
    sourcePath: string,
    loadedHash: string,
    fn: Function,
) {
    const state = ((ctx as any).state ??= {});
    const registry = (state.functionSources ??= createRegistry());
    const lifecycle = ensureLifecycle(ctx);
    const previous = ownRegistryValue(lifecycle.active, name);
    // A reload can legitimately evaluate to the function already active (for
    // example, a module that exports a stable singleton). Keep that generation
    // object so any in-flight managed calls retain their leases through a
    // later replacement or removal.
    const unchanged = previous?.fn === fn;
    if (!unchanged) assertReactivatable(ctx, name, fn);
    const generation = unchanged
        ? previous.generation
        : (state.functionSourceGeneration ?? 0) + 1;
    if (!unchanged) state.functionSourceGeneration = generation;
    const receipt = {
        name,
        root,
        rel,
        loadedHash,
        loadedAt: new Date().toISOString(),
        generation,
    };
    Object.defineProperties(receipt, {
        [FUNCTION_SOURCE_IDENTITY]: {
            value: fn,
            enumerable: false,
            writable: false,
            configurable: false,
        },
        [FUNCTION_SOURCE_PATH]: {
            value: sourcePath,
            enumerable: false,
            writable: false,
            configurable: false,
        },
    });
    registry[name] = receipt;
    if (!unchanged) lifecycle.active[name] = { generation, fn };
    delete lifecycle.unavailable[name];
    return !unchanged ? previous : undefined;
}

function ensureLifecycle(ctx: Context) {
    const state = ((ctx as any).state ??= {});
    const lifecycle = (state.functionLifecycle ??= {
        active: createRegistry(),
        retired: createRegistry(),
        unavailable: createRegistry(),
        disposalErrors: [],
    });
    if (!lifecycle.retiredIdentities) {
        lifecycle.retiredIdentities = new WeakSet<Function>();
        for (const retired of Object.values(lifecycle.retired) as any[]) {
            if (retired?.disposeStarted && typeof retired?.fn === 'function') {
                lifecycle.retiredIdentities.add(retired.fn);
            }
        }
    }
    return lifecycle;
}

function createRegistry() {
    return Object.create(null) as Record<string, any>;
}

function ownRegistryValue(registry: any, key: string) {
    return registry && Object.prototype.hasOwnProperty.call(registry, key)
        ? registry[key]
        : undefined;
}

function assertReactivatable(ctx: Context, name: string, fn: Function) {
    const lifecycle = ensureLifecycle(ctx);
    if (lifecycle.retiredIdentities.has(fn)) {
        throw new Error(`function ${name}: retired identity cannot be reactivated`);
    }
}

function retireGenerations(ctx: Context, generations: Array<{ name: string; record: any }>) {
    const lifecycle = ensureLifecycle(ctx);
    const registered: Array<{ key: string; record: any }> = [];
    for (const { name, record: previous } of generations) {
        const key = `${name}@${previous.generation}`;
        const record = (lifecycle.retired[key] ??= previous);
        record.name = name;
        record.generation = previous.generation;
        record.fn = previous.fn;
        record.leases ??= 0;
        record.disposeStarted ??= false;
        record.disposed ??= false;
        registered.push({ key, record });
    }
    for (const { key, record } of registered) disposeWhenQuiescent(ctx, key, record);
}

function disposeWhenQuiescent(ctx: Context, key: string, retired: any) {
    if (retired.disposeStarted || retired.leases > 0) return;
    const lifecycle = ensureLifecycle(ctx);
    // A function object owns one teardown, even when it is published under
    // several logical names. Its active aliases and all their managed leases
    // keep that shared resource alive.
    if (hasActiveIdentity(lifecycle, retired.fn) || hasIdentityLeases(lifecycle, retired.fn)) return;
    if (hasStartedIdentityDisposal(lifecycle, retired.fn)) return;

    let dispose: unknown;
    try {
        dispose = retired.fn && (retired.fn as any).dispose;
    } catch (error) {
        recordDisposalError(ctx, key, error);
        releaseRetiredIdentity(ctx, retired.fn);
        return;
    }
    // A function without a disposer remains safe to reactivate. Clear every
    // quiescent retirement record for that identity instead of blacklisting it.
    if (typeof dispose !== 'function') {
        releaseRetiredIdentity(ctx, retired.fn);
        return;
    }

    retired.disposeStarted = true;
    // Only an actual disposer makes future reactivation unsafe. Mark that
    // synchronously so a concurrent reload cannot publish while it runs.
    lifecycle.retiredIdentities.add(retired.fn);
    Promise.resolve().then(() => (dispose as Function)(ctx)).then(() => {
        retired.disposed = true;
    }).catch((error) => {
        recordDisposalError(ctx, key, error);
    }).finally(() => {
        releaseRetiredIdentity(ctx, retired.fn);
    });
}

function hasActiveIdentity(lifecycle: any, fn: Function) {
    return Object.values(lifecycle.active).some((active: any) => active?.fn === fn);
}

function hasIdentityLeases(lifecycle: any, fn: Function) {
    return Object.values(lifecycle.retired).some((record: any) => record?.fn === fn && record.leases > 0);
}

function hasStartedIdentityDisposal(lifecycle: any, fn: Function) {
    return Object.values(lifecycle.retired).some((record: any) => record?.fn === fn && record.disposeStarted);
}

function releaseRetiredIdentity(ctx: Context, fn: Function) {
    const lifecycle = ensureLifecycle(ctx);
    for (const [key, record] of Object.entries(lifecycle.retired) as any[]) {
        if (record?.fn === fn && record.leases === 0) delete lifecycle.retired[key];
    }
}

function recordDisposalError(ctx: Context, key: string, error: unknown) {
    ensureLifecycle(ctx).disposalErrors.push({
        key,
        message: error instanceof Error ? error.message : String(error),
        recordedAt: new Date().toISOString(),
    });
}

async function sha256(path: string) {
    const digest = await crypto.subtle.digest('SHA-256', await Bun.file(path).arrayBuffer());
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function sourceVersion(path: string) {
    const info = await stat(path, { bigint: true });
    return [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs].join(':');
}
