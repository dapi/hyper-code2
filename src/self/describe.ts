import { resolve } from 'node:path';

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

    const live = liveFunctionNames(ctx);
    const receipts: Record<string, any> = (ctx.state as any).functionSources ?? {};
    const names = [...new Set([...grouped.keys(), ...live, ...Object.keys(receipts)])].sort();
    const capabilities = [];

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

        const receipt = receipts[name];
        let effectiveSource: Record<string, unknown> = {
            status: 'unavailable',
            provenance: 'loader.receipt',
            freshness: 'unavailable',
        };
        if (receipt) {
            const matching = (grouped.get(name) ?? []).find(
                (entry) => entry.root === receipt.root && entry.rel === receipt.rel,
            );
            const currentHash = matching ? await readableHash(matching.abs) : undefined;
            effectiveSource = {
                status: 'observed',
                provenance: 'loader.receipt',
                freshness: currentHash
                    ? (currentHash === receipt.loadedHash ? 'fresh' : 'stale')
                    : 'unavailable',
                root: receipt.root,
                path: `${receipt.root}/${receipt.rel}`,
                loadedHash: receipt.loadedHash,
                ...(currentHash ? { currentHash } : {}),
                loadedAt: receipt.loadedAt,
                generation: receipt.generation,
            };
        }

        capabilities.push({
            name,
            registryStatus: live.has(name) ? 'observed' : 'unavailable',
            provenance: live.has(name) ? 'runtime.registry' : 'project.scan',
            candidates,
            effectiveSource,
        });
    }

    return {
        schemaVersion: 1 as const,
        generatedAt: new Date().toISOString(),
        capabilities,
        prompts: { valuesIncluded: false as const, layers: await promptLayers(ctx) },
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

function liveFunctionNames(ctx: Context) {
    const names = new Set<string>();
    visit(ctx.fns, '', names);
    for (const key of Object.keys(ctx)) {
        if (key === 'fns' || key === 'state' || key === 'env' || key === 'routes') continue;
        if (typeof (ctx as any)[key] === 'function') names.add(key);
    }
    return names;
}

function visit(value: any, prefix: string, names: Set<string>) {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
        const name = prefix ? `${prefix}.${key}` : key;
        if (typeof child === 'function') names.add(name);
        else visit(child, name, names);
    }
}

async function promptLayers(ctx: Context) {
    const base = [
        ['core', resolve(process.cwd(), 'src/agent/SYSTEM_PROMPT_CORE.txt'), 'src/agent/SYSTEM_PROMPT_CORE.txt'],
        ['wire-format', resolve(process.cwd(), 'src/agent/SYSTEM_PROMPT.txt'), 'src/agent/SYSTEM_PROMPT.txt'],
    ] as const;
    const layers: Array<Record<string, unknown>> = [];
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

function authorityCategories(live: Set<string>) {
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
