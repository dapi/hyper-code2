import { dirname, resolve } from 'node:path';
import { stat } from 'node:fs/promises';
import { realpathSync, statSync } from 'node:fs';

const FUNCTION_SOURCE_IDENTITY = Symbol.for('hyper-code2.function-source.loaded-function');
const FUNCTION_SOURCE_PATH = Symbol.for('hyper-code2.function-source.loaded-physical-path');
const FUNCTION_SOURCE_WRAPPED_IDENTITY = Symbol.for('hyper-code2.function-source.wrapped-function');
const BASE_COMPOSER = { root: 'src', rel: 'agent/fullSystemPrompt.ts' } as const;
// Prompt-layer composition is known only for these reviewed shipped bytes.
// A composer edit deliberately fails closed until this attestation is reviewed.
const BASE_COMPOSER_HASH = 'f874eec8fb90fdc5c7bd13123bc2b5b0e5a033d9e59380471e7fa6607df83086';
const BASE_PROMPT_SOURCES = [
    ['core', resolve(import.meta.dir, '../agent/SYSTEM_PROMPT_CORE.txt'), 'src/agent/SYSTEM_PROMPT_CORE.txt'],
    ['wire-format', resolve(import.meta.dir, '../agent/SYSTEM_PROMPT.txt'), 'src/agent/SYSTEM_PROMPT.txt'],
] as const;

export default async function (ctx: Context) {
    let lastResult: Awaited<ReturnType<typeof describeSnapshot>>['result'] | undefined;
    let lastEntries: any[] = [];
    for (let attempt = 0; attempt < 2; attempt++) {
        const entries = await ctx.fns.project.scan(ctx);
        const membership = functionMembership(entries);
        const paths = sourcePaths(ctx, entries);
        const before = sourceVersionVector(paths);
        const snapshot = await describeSnapshot(ctx, entries);
        lastResult = snapshot.result;
        const afterEntries = await ctx.fns.project.scan(ctx);
        lastEntries = afterEntries;
        if (membership === functionMembership(afterEntries)
            && before === sourceVersionVector(sourcePaths(ctx, afterEntries))
            && sameFunctionIdentities(snapshot.live, liveFunctions(ctx))) return lastResult;
    }
    return invalidateSourceFacts(lastResult!, lastEntries, ctx);
}

async function describeSnapshot(ctx: Context, entries: any[]) {
    const grouped = new Map<string, any[]>();
    for (const entry of entries) {
        if (entry.kind !== 'fn') continue;
        const name = entry.moduleDir === '.'
            ? entry.runtimeName
            : `${entry.moduleDir.replaceAll('/', '.')}.${entry.runtimeName}`;
        const list = grouped.get(name) ?? [];
        list.push(entry);
        grouped.set(name, list);
    }

    const live = liveFunctions(ctx);
    const receipts: Record<string, any> = (ctx.state as any).functionSources ?? {};
    const names = [...new Set([...grouped.keys(), ...live.keys()])].sort();
    const capabilities = [];
    const effectiveSources = new Map<string, ResolvedEffectiveSource>();

    for (const name of names) {
        const candidates = [];
        for (const entry of grouped.get(name) ?? []) {
            const currentHash = await readableHash(entry.abs);
            candidates.push({
                root: entry.root,
                path: `${entry.root}/${entry.rel}`,
                status: currentHash ? 'observed' : 'unavailable',
                provenance: 'project.scan',
                ...(currentHash ? { sourceHash: currentHash } : {}),
            });
        }

        const resolvedSource = await resolveEffectiveSource(
            ctx,
            name,
            grouped.get(name) ?? [],
            receipts[name],
            live.get(name),
        );
        effectiveSources.set(name, resolvedSource);

        capabilities.push({
            name,
            registryStatus: live.has(name) ? 'observed' : 'unavailable',
            provenance: live.has(name) ? 'runtime.registry' : 'project.scan',
            candidates,
            effectiveSource: resolvedSource.descriptor,
        });
    }

    let prompts = await promptLayers(ctx, effectiveSources.get('agent.fullSystemPrompt'));
    const composerName = 'agent.fullSystemPrompt';
    const composerCapability = capabilities.find((item) => item.name === composerName);
    if (composerCapability) {
        const refreshedComposer = await resolveEffectiveSource(
            ctx,
            composerName,
            grouped.get(composerName) ?? [],
            receipts[composerName],
            live.get(composerName),
        );
        effectiveSources.set(composerName, refreshedComposer);
        composerCapability.effectiveSource = refreshedComposer.descriptor;
        if (!isFreshBaseComposer(refreshedComposer)) {
            prompts = unavailablePromptLayers(refreshedComposer.descriptor);
        }
    }
    const finalLive = liveFunctions(ctx);
    for (const capability of capabilities) {
        const expected = live.get(capability.name);
        const current = finalLive.get(capability.name);
        if (current === expected) continue;
        capability.registryStatus = current ? 'observed' : 'unavailable';
        capability.provenance = current ? 'runtime.registry' : 'project.scan';
        capability.effectiveSource = unavailableEffectiveSource();
        effectiveSources.set(capability.name, { descriptor: capability.effectiveSource });
    }
    const reconciledNames = new Set(capabilities.map((capability) => capability.name));
    for (const name of finalLive.keys()) {
        if (reconciledNames.has(name)) continue;
        capabilities.push({
            name,
            registryStatus: 'observed',
            provenance: 'runtime.registry',
            candidates: [],
            effectiveSource: unavailableEffectiveSource(),
        });
    }
    capabilities.sort((left, right) => left.name.localeCompare(right.name));
    if (finalLive.get(composerName) !== live.get(composerName)) {
        prompts = unavailablePromptLayers(unavailableEffectiveSource());
    }

    const result = {
        schemaVersion: 1 as const,
        generatedAt: new Date().toISOString(),
        capabilities,
        prompts: {
            valuesIncluded: false as const,
            layers: prompts,
        },
        state: {
            valuesIncluded: false as const,
            categories: [
                fact('durable', 'inferred', 'memory-bank/engineering/architecture.md', ['sessions database']),
                fact('synchronized-runtime', 'inferred', 'src/session/loadAll.ts', ['live agents', 'messages', 'events']),
                fact('transient-process', 'observed', 'runtime.state.keys', safeStateCategories(ctx)),
            ],
        },
        authority: {
            valuesIncluded: false as const,
            mutationAddedByDescriptor: false as const,
            categories: authorityCategories(finalLive),
        },
    };
    return { result, live: finalLive };
}

type ResolvedEffectiveSource = {
    descriptor: Record<string, unknown>;
    receipt?: Record<string | symbol, any>;
    sourcePath?: string;
    sourceRoot?: string;
};

function unavailableEffectiveSource() {
    return {
        status: 'unavailable',
        provenance: 'loader.receipt',
        freshness: 'unavailable',
    };
}

async function resolveEffectiveSource(
    ctx: Context,
    name: string,
    entries: any[],
    receipt: any,
    liveFunction?: Function,
): Promise<ResolvedEffectiveSource> {
    const matching = validateReceipt(name, entries, receipt, liveFunction);
    if (!matching) return { descriptor: unavailableEffectiveSource() };

    const sourcePath = receipt[FUNCTION_SOURCE_PATH] as string;
    const currentHash = await readableHash(sourcePath);
    if (!currentHash) return { descriptor: unavailableEffectiveSource() };

    // The registry may be mutated while the source file is being read (for
    // example by §eval). Reconcile the identity again after the await so a
    // descriptor never reports a receipt for a function that is no longer live.
    const currentLive = liveFunctions(ctx).get(name);
    if (currentLive !== liveFunction) return { descriptor: unavailableEffectiveSource() };

    return {
        descriptor: {
            status: 'observed',
            provenance: 'loader.receipt',
            freshness: currentHash === receipt.loadedHash ? 'fresh' : 'stale',
            root: receipt.root,
            path: `${receipt.root}/${receipt.rel}`,
            loadedHash: receipt.loadedHash,
            currentHash,
            loadedAt: receipt.loadedAt,
            generation: receipt.generation,
        },
        receipt,
        sourcePath,
        sourceRoot: matching.root,
    };
}

function validateReceipt(name: string, entries: any[], receipt: any, liveFunction?: Function) {
    if (!liveFunction || !receipt || typeof receipt !== 'object') return undefined;
    if (receipt.name !== name) return undefined;
    if (typeof receipt.loadedHash !== 'string' || !/^[a-f0-9]{64}$/.test(receipt.loadedHash)) return undefined;
    if (!isCanonicalIsoDate(receipt.loadedAt)) return undefined;
    if (!Number.isSafeInteger(receipt.generation) || receipt.generation < 1) return undefined;
    const receiptIdentity = receipt[FUNCTION_SOURCE_IDENTITY];
    if (receiptIdentity !== liveFunction
        && (liveFunction as any)[FUNCTION_SOURCE_WRAPPED_IDENTITY] !== receiptIdentity) return undefined;
    const sourcePath = receipt[FUNCTION_SOURCE_PATH];
    if (typeof sourcePath !== 'string' || physicalPath(sourcePath) !== sourcePath) return undefined;
    return entries.find((entry) => entry.root === receipt.root
        && entry.rel === receipt.rel
        && typeof entry.abs === 'string'
        && physicalPath(entry.abs) === sourcePath);
}

function physicalPath(path: string) {
    try {
        return realpathSync(resolve(path));
    } catch {
        return undefined;
    }
}

function isCanonicalIsoDate(value: unknown) {
    if (typeof value !== 'string') return false;
    const parsed = new Date(value);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function liveFunctions(ctx: Context) {
    const functions = new Map<string, Function>();
    visit(ctx.fns, '', functions, new Set<object>());
    for (const key of Object.keys(ctx)) {
        if (key === 'fns' || key === 'state' || key === 'env' || key === 'routes') continue;
        if (typeof (ctx as any)[key] === 'function') functions.set(key, (ctx as any)[key]);
    }
    return functions;
}

function visit(value: any, prefix: string, functions: Map<string, Function>, ancestors: Set<object>) {
    if (!value || typeof value !== 'object') return;
    if (ancestors.has(value)) return;
    ancestors.add(value);
    for (const [key, child] of Object.entries(value)) {
        const name = prefix ? `${prefix}.${key}` : key;
        if (typeof child === 'function') functions.set(name, child);
        else visit(child, name, functions, ancestors);
    }
    ancestors.delete(value);
}

async function promptLayers(ctx: Context, composer?: ResolvedEffectiveSource) {
    const composerDescriptor = composer?.descriptor ?? unavailableEffectiveSource();
    const layers: Array<Record<string, unknown>> = [{
        name: 'effective-composer',
        ...composerDescriptor,
        contentIncluded: false,
    }];
    if (!isFreshBaseComposer(composer)) {
        return unavailablePromptLayers(composerDescriptor);
    }

    const promptSources = promptSourceSpecs(composer?.sourcePath, composer?.sourceRoot);
    for (const [name, abs, path] of promptSources) {
        const sourceHash = await readableHash(abs);
        layers.push({
            name,
            path,
            status: sourceHash ? 'observed' : 'unavailable',
            provenance: 'prompt.file',
            ...(sourceHash ? { sourceHash } : {}),
            contentIncluded: false,
        });
    }

    const agents = Object.values((ctx.state as any).agent ?? {}) as any[];
    const hashes = [];
    for (const agent of agents) {
        const prompt = typeof agent?.systemPrompt === 'string' ? agent.systemPrompt.trim() : '';
        if (prompt) hashes.push(await sha256Text(prompt));
    }
    layers.push({
        name: 'per-agent-additive',
        status: agents.length ? 'observed' : 'unavailable',
        provenance: 'runtime.agent.systemPrompt',
        configuredAgentCount: hashes.length,
        sourceHashes: hashes.sort(),
        contentIncluded: false,
    });
    const runtimePathInstructions = (ctx.state as any).runtimePathInstructions;
    layers.push({
        name: 'cli-runtime-paths',
        status: typeof runtimePathInstructions === 'string' && runtimePathInstructions.trim()
            ? 'observed'
            : 'unavailable',
        provenance: 'runtime.cli.runtimePathInstructions',
        contentIncluded: false,
    });
    layers.push({
        name: 'runtime-context',
        status: 'inferred',
        provenance: 'src/agent/fullSystemPrompt.ts',
        fields: ['cwd', 'agent-id', 'db-path'],
        valuesIncluded: false,
    });
    return layers;
}

function isFreshBaseComposer(composer?: ResolvedEffectiveSource) {
    return !!composer
        && isBaseComposerReceipt(composer.receipt)
        && composer.descriptor.status === 'observed'
        && composer.descriptor.freshness === 'fresh';
}

function isBaseComposerReceipt(receipt: any) {
    return receipt?.root === BASE_COMPOSER.root
        && receipt.rel === BASE_COMPOSER.rel
        && receipt.loadedHash === BASE_COMPOSER_HASH;
}

function promptSourceSpecs(composerPath?: string, composerRoot: string = BASE_COMPOSER.root) {
    if (!composerPath) return BASE_PROMPT_SOURCES;
    const composerDir = dirname(composerPath);
    return [
        ['core', resolve(composerDir, 'SYSTEM_PROMPT_CORE.txt'), `${composerRoot}/agent/SYSTEM_PROMPT_CORE.txt`],
        ['wire-format', resolve(composerDir, 'SYSTEM_PROMPT.txt'), `${composerRoot}/agent/SYSTEM_PROMPT.txt`],
    ] as const;
}

function unavailablePromptLayers(composerDescriptor: Record<string, unknown>) {
    return [{
        name: 'effective-composer',
        ...composerDescriptor,
        contentIncluded: false,
    }, ...['core', 'wire-format', 'per-agent-additive', 'cli-runtime-paths', 'runtime-context'].map((name) => ({
        name,
        status: 'unavailable',
        provenance: 'active-composer.structure',
        contentIncluded: false,
    }))];
}

function safeStateCategories(ctx: Context) {
    const keys = Object.keys(ctx.state ?? {});
    const categories = new Set<string>();
    if (keys.includes('agent')) categories.add('agent-runtime');
    if (keys.includes('settingsRegistry')) categories.add('settings-descriptors');
    if (keys.includes('functionSources')) categories.add('function-source-receipts');
    if (keys.includes('server') || keys.includes('http')) categories.add('http-runtime');
    if (keys.includes('db')) categories.add('database-handle');
    if (keys.includes('events')) categories.add('event-subscribers');
    return [...categories].sort();
}

function authorityCategories(live: ReadonlyMap<string, Function>) {
    const definitions = [
        ['filesystem', ['files.read', 'files.write', 'files.list']],
        ['shell', ['agent.executeBash']],
        ['runtime-eval', ['repl.eval', 'repl.load']],
        ['network', ['http.start', 'llm.stream']],
        ['git', ['git.run', 'git.stage', 'git.commit', 'git.push']],
    ] as const;
    return definitions.map(([name, evidence]) => ({
        name,
        status: evidence.some((fn) => live.has(fn)) ? 'observed' : 'unavailable',
        provenance: 'runtime.registry',
        evidence: evidence.filter((fn) => live.has(fn)),
        valuesIncluded: false,
    }));
}

function fact(name: string, status: string, provenance: string, members: string[]) {
    return { name, status, provenance, members, valuesIncluded: false };
}

async function readableHash(path: string) {
    try {
        const before = await sourceVersion(path);
        const digest = await sha256Bytes(await Bun.file(path).arrayBuffer());
        const after = await sourceVersion(path);
        return before === after ? digest : undefined;
    } catch {
        return undefined;
    }
}

async function sourceVersion(path: string) {
    const info = await stat(path, { bigint: true });
    return [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs].join(':');
}

function sourcePaths(ctx: Context, entries: any[]) {
    const receipts: Record<string, any> = (ctx.state as any).functionSources ?? {};
    const composerName = 'agent.fullSystemPrompt';
    const composerReceipt = receipts[composerName];
    const liveComposer = (ctx.fns as any).agent?.fullSystemPrompt;
    const matchingComposer = validateReceipt(
        composerName,
        entries,
        composerReceipt,
        typeof liveComposer === 'function' ? liveComposer : undefined,
    );
    const activePromptPaths = matchingComposer && isBaseComposerReceipt(composerReceipt)
        ? promptSourceSpecs(composerReceipt[FUNCTION_SOURCE_PATH], matchingComposer.root).map(([, abs]) => abs)
        : [];
    return [...new Set([
        ...entries.filter((entry) => entry.kind === 'fn' && typeof entry.abs === 'string').map((entry) => entry.abs),
        ...BASE_PROMPT_SOURCES.map(([, abs]) => abs),
        ...activePromptPaths,
    ])].sort();
}

function sameFunctionIdentities(
    before: ReadonlyMap<string, Function>,
    after: ReadonlyMap<string, Function>,
) {
    if (before.size !== after.size) return false;
    for (const [name, fn] of before) {
        if (after.get(name) !== fn) return false;
    }
    return true;
}

function functionMembership(entries: any[]) {
    const byName = new Map<string, unknown[][]>();
    for (const entry of entries) {
        if (entry.kind !== 'fn') continue;
        const name = entry.moduleDir === '.'
            ? entry.runtimeName
            : `${entry.moduleDir.replaceAll('/', '.')}.${entry.runtimeName}`;
        const candidates = byName.get(name) ?? [];
        candidates.push([
            entry.root, entry.rootDir ?? null, entry.rel, entry.abs,
            entry.moduleDir, entry.runtimeName,
        ]);
        byName.set(name, candidates);
    }
    return JSON.stringify([...byName.entries()].sort(([left], [right]) => left.localeCompare(right)));
}

function sourceVersionVector(paths: string[]) {
    return JSON.stringify(paths.map((path) => [path, sourceVersionSync(path)]));
}

function sourceVersionSync(path: string) {
    try {
        const info = statSync(path, { bigint: true });
        return [info.dev, info.ino, info.size, info.mtimeNs, info.ctimeNs].join(':');
    } catch {
        return 'unavailable';
    }
}

function invalidateSourceFacts(
    result: Awaited<ReturnType<typeof describeSnapshot>>['result'],
    entries: any[],
    ctx: Context,
) {
    const grouped = new Map<string, any[]>();
    for (const entry of entries) {
        if (entry.kind !== 'fn') continue;
        const name = entry.moduleDir === '.'
            ? entry.runtimeName
            : `${entry.moduleDir.replaceAll('/', '.')}.${entry.runtimeName}`;
        grouped.set(name, [...(grouped.get(name) ?? []), entry]);
    }
    const live = liveFunctions(ctx);
    const names = [...new Set([...grouped.keys(), ...live.keys()])].sort();
    result.capabilities = names.map((name) => ({
        name,
        registryStatus: live.has(name) ? 'observed' : 'unavailable',
        provenance: live.has(name) ? 'runtime.registry' : 'project.scan',
        candidates: (grouped.get(name) ?? []).map((entry) => ({
            root: entry.root,
            path: `${entry.root}/${entry.rel}`,
            status: 'unavailable',
            provenance: 'project.scan',
        })),
        effectiveSource: unavailableEffectiveSource(),
    }));
    result.prompts.layers = unavailablePromptLayers(unavailableEffectiveSource());
    result.authority.categories = authorityCategories(live);
    return result;
}

async function sha256Text(value: string) {
    return sha256Bytes(new TextEncoder().encode(value));
}

async function sha256Bytes(value: ArrayBuffer | Uint8Array) {
    const input = value instanceof Uint8Array ? value.slice().buffer : value;
    const digest = await crypto.subtle.digest('SHA-256', input);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
