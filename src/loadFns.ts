// Scan src/ and .hyper/ for function files and register them on ctx.
// Bootstrap: ctx.fns is empty when this runs, so we import project/scan
// directly to do the first sweep. After that all other code (genTypes,
// repl.load, etc.) can use ctx.fns.project.scan normally.
import { realpath, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const FUNCTION_SOURCE_IDENTITY = Symbol.for('hyper-code2.function-source.loaded-function');
const FUNCTION_SOURCE_PATH = Symbol.for('hyper-code2.function-source.loaded-physical-path');
const FUNCTION_SOURCE_WRAPPED_IDENTITY = Symbol.for('hyper-code2.function-source.wrapped-function');

export default async function (ctx: Context): Promise<void> {
    const scan = ctx.fns.project?.scan
        ?? (await import("./project/scan?load=" + crypto.randomUUID())).default;
    const entries = await scan(ctx);
    const winners = scanWinners(entries);
    const staged: StagedFunction[] = [];
    const settings: StagedSetting[] = [];
    try {
        // Module evaluation is deliberately serial in the scan order. Function
        // modules may coordinate through top-level await or acquire shared
        // resources before they export their implementation.
        for (const entry of entries) {
            if (entry.kind === 'fn' && winners.functions.get(qualifiedName(entry)) === entry) {
                staged.push(await stageFunction(entry));
            }
            // Settings have fallback precedence rather than winner-takes-all
            // precedence: a malformed overlay must leave the last valid base
            // descriptor effective. Stage every candidate so the committed
            // registry can select that descriptor without publishing a stale
            // value from an earlier generation.
            if (entry.kind === 'setting') {
                settings.push(await stageSetting(entry));
            }
        }
    } catch (error) {
        await disposeStaged(ctx, staged);
        throw error;
    }

    // Nothing above this line touches a live function, receipt, lifecycle
    // record, or settings registry. A late import/source failure therefore
    // leaves the previously published generation set wholly intact.
    let committed = false;
    try {
        await validateStaged(scan, ctx, staged, settings, winners);
        const currentNames = new Set(staged.map((item) => item.name));
        const removedNames = trackedFunctionNames(ctx).filter((name) => !currentNames.has(name));
        commit(ctx, staged, removedNames, effectiveSettings(settings));
        committed = true;
    } finally {
        if (!committed) await disposeStaged(ctx, staged);
    }
}

type StagedFunction = {
    entry: any;
    name: string;
    sourcePath: string;
    loadedHash: string;
    loadedVersion: string;
    fn: Function;
};

type StagedSetting = {
    entry: any;
    key: string;
    sourcePath: string;
    loadedHash: string;
    loadedVersion: string;
    descriptor?: object;
};

function scanWinners(entries: any[]) {
    // project.scan returns roots in precedence order, so later entries are the
    // current winners. Importing superseded base candidates would otherwise
    // create an unnecessary intermediate generation during bootstrap reload.
    const functions = new Map<string, any>();
    const settings = new Map<string, any>();
    for (const entry of entries) {
        if (entry.kind === 'fn') functions.set(qualifiedName(entry), entry);
        if (entry.kind === 'setting') settings.set(settingKey(entry), entry);
    }
    return { functions, settings };
}

async function stageFunction(entry: any): Promise<StagedFunction> {
    const sourcePath = await realpath(resolve(entry.abs));
    const loadedVersion = await sourceVersion(sourcePath);
    const loadedHash = await sha256(sourcePath);
    const mod = await import(sourcePath + `?load=${crypto.randomUUID()}`);
    const fn = mod.default;
    if (typeof fn !== 'function') {
        throw new Error(`${entry.root}/${entry.rel}: no default function export`);
    }
    return { entry, name: qualifiedName(entry), sourcePath, loadedHash, loadedVersion, fn };
}

async function stageSetting(entry: any): Promise<StagedSetting> {
    const sourcePath = await realpath(resolve(entry.abs));
    const loadedVersion = await sourceVersion(sourcePath);
    const loadedHash = await sha256(sourcePath);
    const mod = await import(sourcePath + `?load=${crypto.randomUUID()}`);
    const descriptor = mod.default;
    const staged = { entry, key: settingKey(entry), sourcePath, loadedHash, loadedVersion };
    if (!descriptor || typeof descriptor !== 'object') {
        console.warn(`[settings] skip (no default-export descriptor): ${entry.root}/${entry.rel}`);
        return staged;
    }
    return { ...staged, descriptor };
}

async function validateStaged(
    scan: Function,
    ctx: Context,
    staged: StagedFunction[],
    settings: StagedSetting[],
    expectedWinners: ReturnType<typeof scanWinners>,
) {
    // Each complete snapshot ends with source-vector validation. Repeating the
    // snapshot after the first concurrent barrier prevents an early-validated
    // source (or membership set) from changing while a slower peer is checked.
    await validateStartupSnapshot(scan, ctx, staged, settings, expectedWinners);
    await validateStartupSnapshot(scan, ctx, staged, settings, expectedWinners);
}

async function validateStartupSnapshot(
    scan: Function,
    ctx: Context,
    staged: StagedFunction[],
    settings: StagedSetting[],
    expectedWinners: ReturnType<typeof scanWinners>,
) {
    const current = scanWinners(await scan(ctx));
    if (!sameWinners(expectedWinners.functions, current.functions)
        || !sameWinners(expectedWinners.settings, current.settings)) {
        throw new Error('function or setting membership changed while loading');
    }
    await Promise.all([...staged, ...settings].map(async (item) => {
        try {
            // A stable entry.abs string can still name a different physical
            // file when its root is a symlink that changes during staging.
            if (await realpath(resolve(item.entry.abs)) !== item.sourcePath) {
                throw new Error('logical source changed');
            }
            const [currentHash, currentVersion] = await Promise.all([
                sha256(item.sourcePath),
                sourceVersion(item.sourcePath),
            ]);
            if (currentHash === item.loadedHash && currentVersion === item.loadedVersion) return;
        } catch {
            // Deletion and unreadable replacement are source changes too.
        }
        throw new Error(`${item.entry.root}/${item.entry.rel}: source changed while loading`);
    }));
}

function sameWinners(left: Map<string, any>, right: Map<string, any>) {
    return left.size === right.size && [...left].every(([name, entry]) => {
        const other = right.get(name);
        return other
            && other.root === entry.root
            && other.rel === entry.rel
            && other.abs === entry.abs
            && other.moduleDir === entry.moduleDir
            && other.runtimeName === entry.runtimeName;
    });
}

function qualifiedName(entry: any) {
    return entry.moduleDir === '.'
        ? entry.runtimeName
        : `${entry.moduleDir.replaceAll('/', '.')}.${entry.runtimeName}`;
}

function settingKey(entry: any) {
    return `${entry.settingModule}.${entry.settingKey}`;
}

function hasDescriptor(setting: StagedSetting): setting is StagedSetting & { descriptor: object } {
    return !!setting.descriptor;
}

function effectiveSettings(settings: StagedSetting[]) {
    // Scan order is precedence order: later roots overlay earlier roots. Keep
    // only valid descriptors, so an invalid overlay falls back to the nearest
    // valid preceding candidate instead of erasing the setting.
    const effective = new Map<string, StagedSetting & { descriptor: object }>();
    for (const setting of settings) {
        if (hasDescriptor(setting)) effective.set(setting.key, setting);
    }
    return [...effective.values()];
}

function trackedFunctionNames(ctx: Context) {
    const state = (ctx as any).state ?? {};
    return [...new Set([
        ...Object.keys(state.functionSources ?? {}),
        ...Object.keys(state.functionLifecycle?.active ?? {}),
    ])];
}

function commit(
    ctx: Context,
    staged: StagedFunction[],
    removedNames: string[],
    settings: Array<StagedSetting | undefined>,
) {
    const rollbackMetadata = snapshotLifecycleMetadata(ctx);
    // Validate the whole vector before publishing its first member: a retired
    // singleton may already be disposing and must never be made active again.
    try {
        seedExistingActiveRecords(ctx, [...staged.map((item) => item.name), ...removedNames]);
        for (const item of staged) assertReactivatable(ctx, item.name, item.fn);
        const namespaceReplacements = removedNamespaceReplacements(staged, removedNames);
        preflightPublication(ctx, staged, namespaceReplacements);
        preflightRemovals(ctx, removedNames);
        preflightSettingsRegistry(ctx, settings);
        const rollbackPublication = publishStaged(ctx, staged, removedNames, namespaceReplacements);
        const retired: Array<{ name: string; record: any }> = [];
        try {
            for (const item of staged) {
                const previous = recordSource(
                    ctx,
                    item.name,
                    item.entry,
                    item.sourcePath,
                    item.loadedHash,
                    item.fn,
                );
                if (previous) retired.push({ name: item.name, record: previous });
            }

            // Remove every old alias and register every retired record before the first
            // quiescence check. Shared identities may carry a lease through any alias.
            for (const name of removedNames) {
                removeFunction(ctx, name, retired, !namespaceReplacements.has(name));
            }

            replaceSettingsRegistry(ctx, settings);
            retireGenerations(ctx, retired);
        } catch (error) {
            rollbackPublication();
            throw error;
        }
    } catch (error) {
        rollbackMetadata();
        throw error;
    }

    for (const item of staged) {
        const label = `${item.entry.root}/${item.entry.rel}`;
        console.log(item.entry.moduleDir === '.'
            ? `[fns] ctx.${item.entry.runtimeName}  ←  ${label}`
            : `[fns] ctx.fns.${item.entry.moduleDir.replaceAll('/', '.')}.${item.entry.runtimeName}  ←  ${label}`);
    }
    for (const setting of settings) {
        if (setting) console.log(`[settings] declare ${setting.key}  ←  ${setting.entry.root}/${setting.entry.rel}`);
    }
}

function publicationTarget(ctx: Context, item: StagedFunction, create: boolean) {
    if (item.entry.moduleDir === '.') return { target: ctx as any, fnName: item.entry.runtimeName };
    let target: any = ctx.fns;
    for (const segment of item.entry.moduleDir.split('/')) {
        if (!target[segment]) {
            if (!create) return { target: undefined, fnName: item.entry.runtimeName, missingSegment: segment };
            target[segment] = {};
        }
        target = target[segment];
    }
    return { target, fnName: item.entry.runtimeName };
}

function loadedIdentity(fn: Function) {
    const wrapped = (fn as any)[FUNCTION_SOURCE_WRAPPED_IDENTITY];
    return typeof wrapped === 'function' ? wrapped : fn;
}

function resolveLiveFunction(ctx: Context, name: string) {
    const parts = name.split('.');
    let value: any = parts.length === 1 ? ctx : ctx.fns;
    for (const part of parts) {
        if (!value || !Object.prototype.hasOwnProperty.call(value, part)) return undefined;
        value = value[part];
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

function removedNamespaceReplacements(staged: StagedFunction[], removedNames: string[]) {
    const currentNames = staged.map((item) => item.name);
    return new Set(removedNames.filter((name) => currentNames.some((current) => current.startsWith(`${name}.`))));
}

function preflightPublication(ctx: Context, staged: StagedFunction[], namespaceReplacements: Set<string>) {
    for (const item of staged) {
        if (item.entry.moduleDir !== '.') {
            let target: any = ctx.fns;
            const segments: string[] = [];
            for (const segment of item.entry.moduleDir.split('/')) {
                segments.push(segment);
                const value = target[segment];
                if (value) {
                    if (namespaceReplacements.has(segments.join('.'))) {
                        assertReplacementNamespace(target, segment, item.name);
                        target = {};
                        continue;
                    }
                    if (typeof value !== 'object') throw new Error(`cannot publish ${item.name}: ${segment} is not a namespace`);
                    target = value;
                    continue;
                }
                assertAssignable(target, segment, `namespace ${segment}`);
                target = {};
            }
        }
        const { target, fnName } = publicationTarget(ctx, item, false);
        // A missing namespace was checked above and will be created during the
        // transaction; its final procedure property is necessarily writable.
        if (target) {
            assertAssignable(target, fnName, item.name);
            const accessor = ownRegistryValue((ctx.state as any)?.runtimeProcedureAccessors, item.name);
            if (accessor) assertRestorableRuntimeProcedureAccessor(target, fnName, item.name);
        }
    }
}

function assertReplacementNamespace(target: object, key: string, name: string) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    // preflightRemovals verifies that the retired procedure can be deleted;
    // after that deletion the namespace needs a new own property.
    if (descriptor && !descriptor.configurable) {
        throw new Error(`cannot replace ${name}: namespace property is not configurable`);
    }
    if (!Object.isExtensible(target)) {
        throw new Error(`cannot publish namespace ${key}: target is not extensible`);
    }
}

function assertRestorableRuntimeProcedureAccessor(target: object, key: string, name: string) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (descriptor && !descriptor.configurable) {
        throw new Error(`cannot restore runtime accessor for ${name}: target property is not configurable`);
    }
}

function preflightRemovals(ctx: Context, names: string[]) {
    for (const name of names) {
        const parts = name.split('.');
        const fnName = parts.pop()!;
        let target: any = parts.length ? ctx.fns : ctx;
        for (const part of parts) target = target?.[part];
        if (!target || typeof target !== 'object') continue;
        const descriptor = Object.getOwnPropertyDescriptor(target, fnName);
        if (descriptor && !descriptor.configurable) {
            throw new Error(`cannot remove ${name}: target property is not configurable`);
        }
    }
}

function preflightSettingsRegistry(ctx: Context, settings: Array<StagedSetting | undefined>) {
    const registry = (ctx.state as any)?.settingsRegistry;
    if (!settings.some(Boolean) && registry === undefined) return;
    if (registry !== undefined && !(registry instanceof Map)) {
        throw new Error('cannot publish settings: registry is not a Map');
    }
}

function replaceSettingsRegistry(ctx: Context, settings: Array<StagedSetting | undefined>) {
    // A complete scan is authoritative for declarations. Replacing the whole
    // registry removes keys whose final candidate was deleted or malformed.
    const registry: Map<string, any> = ((ctx.state as any).settingsRegistry ??= new Map());
    registry.clear();
    for (const setting of settings) {
        if (setting) registry.set(setting.key, setting.descriptor);
    }
}

function assertAssignable(target: object, key: string, label: string) {
    const descriptor = Object.getOwnPropertyDescriptor(target, key);
    if (!descriptor && !Object.isExtensible(target)) throw new Error(`cannot publish ${label}: target is not extensible`);
    if (descriptor && (("value" in descriptor && !descriptor.writable)
        || (!("value" in descriptor) && !descriptor.set))) {
        throw new Error(`cannot publish ${label}: target property is not writable`);
    }
    if (descriptor && !("value" in descriptor)
        && !wrappedAccessorImplementation(target, descriptor)) {
        throw new Error(`cannot publish ${label}: accessor is not reversible`);
    }
}

function publishStaged(
    ctx: Context,
    staged: StagedFunction[],
    removedNames: string[] = [],
    namespaceReplacements = new Set<string>(),
) {
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
        // Include all retired registry slots up front so a later failure can
        // restore a function that was already deleted.
        for (const name of removedNames) {
            const parts = name.split('.');
            const fnName = parts.pop()!;
            let target: any = parts.length ? ctx.fns : ctx;
            for (const part of parts) target = target?.[part];
            if (target && typeof target === 'object') capture(target, fnName);
        }
        // A retired procedure can occupy a path that the current generation
        // needs as a namespace (demo.value -> demo.value.child). Remove that
        // property before assigning staged descendants, but defer lifecycle
        // metadata retirement until the rest of publication succeeds.
        for (const name of namespaceReplacements) {
            const parts = name.split('.');
            const fnName = parts.pop()!;
            let target: any = parts.length ? ctx.fns : ctx;
            for (const part of parts) target = target?.[part];
            if (!target || typeof target !== 'object') continue;
            preserveRuntimeProcedureAccessor(ctx, name, target, fnName);
            delete target[fnName];
        }
        for (const item of staged) {
            let target: any;
            if (item.entry.moduleDir === '.') {
                target = ctx as any;
            } else {
                target = ctx.fns;
                for (const segment of item.entry.moduleDir.split('/')) {
                    if (!target[segment]) {
                        capture(target, segment);
                        target[segment] = {};
                    }
                    target = target[segment];
                }
            }
            const fnName = item.entry.runtimeName;
            const accessors = (ctx.state as any)?.runtimeProcedureAccessors;
            const accessor = ownRegistryValue(accessors, item.name);
            if (accessor) {
                capture(target, fnName);
                Object.defineProperty(target, fnName, accessor);
                delete accessors[item.name];
                restoredAccessors.push({ name: item.name, descriptor: accessor });
            }
            capture(target, fnName);
            target[fnName] = item.fn;
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

async function disposeStaged(ctx: Context, staged: StagedFunction[]) {
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
            console.error(`[fns] staged ${item.name} disposal failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

function lifecycleOwnsIdentity(ctx: Context, fn: Function) {
    const lifecycle = (ctx.state as any)?.functionLifecycle;
    return Object.values(lifecycle?.active ?? {}).some((record: any) => record?.fn === fn)
        || Object.values(lifecycle?.retired ?? {}).some((record: any) => record?.fn === fn);
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
    removeProperty = true,
) {
    const parts = name.split('.');
    const fnName = parts.pop()!;
    let target: any = parts.length ? ctx.fns : ctx;
    for (const part of parts) target = target?.[part];
    const previous = ownRegistryValue((ctx.state as any)?.functionLifecycle?.active, name);
    if (removeProperty && target && typeof target === 'object') {
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

function recordSource(
    ctx: Context,
    name: string,
    entry: any,
    sourcePath: string,
    loadedHash: string,
    fn: Function,
) {
    const state = ((ctx as any).state ??= {});
    const registry = (state.functionSources ??= createRegistry());
    const lifecycle = ensureLifecycle(ctx);
    const previous = ownRegistryValue(lifecycle.active, name);
    // Bootstrap may be run again after the initial registry is populated. A
    // module can intentionally export a stable singleton, so preserve its
    // active record and any managed leases instead of orphaning them.
    const unchanged = previous?.fn === fn;
    if (!unchanged) assertReactivatable(ctx, name, fn);
    const generation = unchanged
        ? previous.generation
        : (state.functionSourceGeneration ?? 0) + 1;
    if (!unchanged) state.functionSourceGeneration = generation;
    const receipt = {
        name,
        root: entry.root,
        rel: entry.rel,
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
    if (typeof dispose !== 'function') {
        releaseRetiredIdentity(ctx, retired.fn);
        return;
    }

    retired.disposeStarted = true;
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
