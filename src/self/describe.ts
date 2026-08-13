import { resolve } from 'node:path';

const FUNCTION_SOURCE_IDENTITY = Symbol.for('hyper-code2.function-source.loaded-function');
const BASE_COMPOSER = { root: 'src', rel: 'agent/fullSystemPrompt.ts' } as const;
// Prompt-layer composition is known only for these reviewed shipped bytes.
// A composer edit deliberately fails closed until this attestation is reviewed.
const BASE_COMPOSER_HASH = '377c99e4ce5f8c2935dc0297688c71edcc00244e7f8a45546882084f0a2fdca6';

export default async function (ctx: Context) {
    const entries = await ctx.fns.project.scan(ctx);
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

    return {
        schemaVersion: 1 as const,
        generatedAt: new Date().toISOString(),
        capabilities,
        prompts: {
            valuesIncluded: false as const,
            layers: await promptLayers(ctx, effectiveSources.get('agent.fullSystemPrompt')),
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
            categories: authorityCategories(live),
        },
    };
}

type ResolvedEffectiveSource = {
    descriptor: Record<string, unknown>;
    receipt?: Record<string | symbol, any>;
};

function unavailableEffectiveSource() {
    return {
        status: 'unavailable',
        provenance: 'loader.receipt',
        freshness: 'unavailable',
    };
}

async function resolveEffectiveSource(
    name: string,
    entries: any[],
    receipt: any,
    liveFunction?: Function,
): Promise<ResolvedEffectiveSource> {
    const matching = validateReceipt(name, entries, receipt, liveFunction);
    if (!matching) return { descriptor: unavailableEffectiveSource() };

    const currentHash = await readableHash(matching.abs);
    if (!currentHash) return { descriptor: unavailableEffectiveSource() };

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
    };
}

function validateReceipt(name: string, entries: any[], receipt: any, liveFunction?: Function) {
    if (!liveFunction || !receipt || typeof receipt !== 'object') return undefined;
    if (receipt.name !== name) return undefined;
    if (typeof receipt.loadedHash !== 'string' || !/^[a-f0-9]{64}$/.test(receipt.loadedHash)) return undefined;
    if (!isCanonicalIsoDate(receipt.loadedAt)) return undefined;
    if (!Number.isSafeInteger(receipt.generation) || receipt.generation < 1) return undefined;
    if (receipt[FUNCTION_SOURCE_IDENTITY] !== liveFunction) return undefined;
    return entries.find((entry) => entry.root === receipt.root && entry.rel === receipt.rel);
}

function isCanonicalIsoDate(value: unknown) {
    if (typeof value !== 'string') return false;
    const parsed = new Date(value);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString() === value;
}

function liveFunctions(ctx: Context) {
    const functions = new Map<string, Function>();
    visit(ctx.fns, '', functions);
    for (const key of Object.keys(ctx)) {
        if (key === 'fns' || key === 'state' || key === 'env' || key === 'routes') continue;
        if (typeof (ctx as any)[key] === 'function') functions.set(key, (ctx as any)[key]);
    }
    return functions;
}

function visit(value: any, prefix: string, functions: Map<string, Function>) {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
        const name = prefix ? `${prefix}.${key}` : key;
        if (typeof child === 'function') functions.set(name, child);
        else visit(child, name, functions);
    }
}

async function promptLayers(ctx: Context, composer?: ResolvedEffectiveSource) {
    const composerDescriptor = composer?.descriptor ?? unavailableEffectiveSource();
    const layers: Array<Record<string, unknown>> = [{
        name: 'effective-composer',
        ...composerDescriptor,
        contentIncluded: false,
    }];
    const isFreshBaseComposer = composer?.receipt?.root === BASE_COMPOSER.root
        && composer.receipt.rel === BASE_COMPOSER.rel
        && composer.receipt.loadedHash === BASE_COMPOSER_HASH
        && composerDescriptor.status === 'observed'
        && composerDescriptor.freshness === 'fresh';

    if (!isFreshBaseComposer) {
        for (const name of ['core', 'wire-format', 'per-agent-additive', 'runtime-context']) {
            layers.push({
                name,
                status: 'unavailable',
                provenance: 'active-composer.structure',
                contentIncluded: false,
            });
        }
        return layers;
    }

    const base = [
        ['core', resolve(import.meta.dir, '../agent/SYSTEM_PROMPT_CORE.txt'), 'src/agent/SYSTEM_PROMPT_CORE.txt'],
        ['wire-format', resolve(import.meta.dir, '../agent/SYSTEM_PROMPT.txt'), 'src/agent/SYSTEM_PROMPT.txt'],
    ] as const;
    for (const [name, abs, path] of base) {
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
    layers.push({
        name: 'runtime-context',
        status: 'inferred',
        provenance: 'src/agent/fullSystemPrompt.ts',
        fields: ['cwd', 'agent-id', 'db-path'],
        valuesIncluded: false,
    });
    return layers;
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
        if (!(await Bun.file(path).exists())) return undefined;
        return await sha256Bytes(await Bun.file(path).arrayBuffer());
    } catch {
        return undefined;
    }
}

async function sha256Text(value: string) {
    return sha256Bytes(new TextEncoder().encode(value));
}

async function sha256Bytes(value: ArrayBuffer | Uint8Array) {
    const input = value instanceof Uint8Array ? value.slice().buffer : value;
    const digest = await crypto.subtle.digest('SHA-256', input);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
