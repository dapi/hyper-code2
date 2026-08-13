import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import describeSelf from './describe';
import scan from '../project/scan';
import evalFn from '../repl/eval';
import fullSystemPrompt from '../agent/fullSystemPrompt';

const fixtures: string[] = [];

afterEach(async () => {
    await Promise.all(fixtures.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe('self.describe', () => {
    test('joins candidates with the observed overlay receipt and freshness', async () => {
        const root = resolve('.test-tmp', `self-descriptor-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        await mkdir(resolve(src, 'demo'), { recursive: true });
        await mkdir(resolve(overlay, 'demo'), { recursive: true });
        await Bun.write(resolve(src, 'demo/value.ts'), 'export default () => "src";\n');
        await Bun.write(resolve(overlay, 'demo/value.ts'), 'export default () => "overlay";\n');

        const loadedHash = await hash(resolve(overlay, 'demo/value.ts'));
        const ctx = makeCtx(src, overlay, {
            'demo.value': {
                name: 'demo.value', root: '.hyper', rel: 'demo/value.ts',
                loadedHash, loadedAt: '2026-08-13T00:00:00.000Z', generation: 2,
            },
        });
        bindReceipt((ctx.state as any).functionSources['demo.value'], (ctx.fns as any).demo.value);
        const result = await describeSelf(ctx);
        const capability = result.capabilities.find((item) => item.name === 'demo.value');
        expect(capability?.candidates.map((item) => item.path)).toEqual([
            'src/demo/value.ts', '.hyper/demo/value.ts',
        ]);
        expect(capability?.effectiveSource).toMatchObject({
            status: 'observed', root: '.hyper', path: '.hyper/demo/value.ts', freshness: 'fresh',
        });

        await Bun.write(resolve(overlay, 'demo/value.ts'), 'export default () => "changed";\n');
        const stale = await describeSelf(ctx);
        expect(stale.capabilities.find((item) => item.name === 'demo.value')?.effectiveSource.freshness).toBe('stale');
    });

    test('marks a live function without a receipt unavailable and never transits secret values', async () => {
        const sentinel = `SECRET-${crypto.randomUUID()}`;
        const root = resolve('.test-tmp', `self-descriptor-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        await mkdir(src, { recursive: true });
        const ctx = makeCtx(src, overlay, {});
        ctx.env = { OPENAI_API_KEY: sentinel };
        ctx.state.privateValue = sentinel;
        ctx.state.agent = { a1: { systemPrompt: sentinel } };
        (ctx.fns as any).dynamic = { runtimeOnly: () => sentinel };

        const result = await describeSelf(ctx);
        expect(result.capabilities.find((item) => item.name === 'dynamic.runtimeOnly')?.effectiveSource).toEqual({
            status: 'unavailable', provenance: 'loader.receipt', freshness: 'unavailable',
        });
        const serialized = JSON.stringify(result);
        expect(serialized).not.toContain(sentinel);
        expect(result.prompts.valuesIncluded).toBe(false);
        expect(result.state.valuesIncluded).toBe(false);
        expect(result.authority.mutationAddedByDescriptor).toBe(false);
    });

    test('marks a receipt unavailable when its source is deleted', async () => {
        const root = resolve('.test-tmp', `self-descriptor-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        await mkdir(resolve(overlay, 'demo'), { recursive: true });
        const source = resolve(overlay, 'demo/value.ts');
        await Bun.write(source, 'export default () => "overlay";\n');

        const ctx = makeCtx(src, overlay, {
            'demo.value': {
                name: 'demo.value', root: '.hyper', rel: 'demo/value.ts',
                loadedHash: await hash(source), loadedAt: '2026-08-13T00:00:00.000Z', generation: 2,
            },
        });
        bindReceipt((ctx.state as any).functionSources['demo.value'], (ctx.fns as any).demo.value);
        await Bun.file(source).delete();

        const result = await describeSelf(ctx);
        expect(result.capabilities.find((item) => item.name === 'demo.value')?.effectiveSource).toMatchObject({
            status: 'unavailable', provenance: 'loader.receipt', freshness: 'unavailable',
        });
    });

    test('invalidates an old receipt after direct registry replacement or deletion', async () => {
        const root = resolve('.test-tmp', `self-descriptor-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        await mkdir(resolve(src, 'demo'), { recursive: true });
        const source = resolve(src, 'demo/value.ts');
        await Bun.write(source, 'export default () => "loaded";\n');

        const loaded = () => 'loaded';
        const receipt = {
            name: 'demo.value', root: 'src', rel: 'demo/value.ts',
            loadedHash: await hash(source), loadedAt: '2026-08-13T00:00:00.000Z', generation: 1,
        };
        bindReceipt(receipt, loaded);
        const ctx = makeCtx(src, overlay, { 'demo.value': receipt }, { demo: { value: loaded } });

        expect((await describeSelf(ctx)).capabilities.find(
            (item) => item.name === 'demo.value',
        )?.effectiveSource.status).toBe('observed');

        await evalFn(ctx, { code: 'ctx.fns.demo.value = () => "replacement"' });
        const replaced = (await describeSelf(ctx)).capabilities.find((item) => item.name === 'demo.value');
        expect(replaced?.registryStatus).toBe('observed');
        expect(replaced?.effectiveSource).toEqual({
            status: 'unavailable', provenance: 'loader.receipt', freshness: 'unavailable',
        });

        await evalFn(ctx, { code: 'delete ctx.fns.demo.value' });
        const deleted = (await describeSelf(ctx)).capabilities.find((item) => item.name === 'demo.value');
        expect(deleted?.registryStatus).toBe('unavailable');
        expect(deleted?.effectiveSource).toEqual({
            status: 'unavailable', provenance: 'loader.receipt', freshness: 'unavailable',
        });
    });

    test('does not serialize malformed or receipt-only runtime values', async () => {
        const sentinel = `SECRET-${crypto.randomUUID()}`;
        const root = resolve('.test-tmp', `self-descriptor-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        await mkdir(resolve(src, 'demo'), { recursive: true });
        const source = resolve(src, 'demo/value.ts');
        await Bun.write(source, 'export default () => "loaded";\n');

        const loaded = () => 'loaded';
        const malformed = {
            name: 'demo.value', root: 'src', rel: 'demo/value.ts',
            loadedHash: sentinel, loadedAt: sentinel, generation: 1,
        };
        bindReceipt(malformed, loaded);
        const ctx = makeCtx(src, overlay, {
            'demo.value': malformed,
            [`receipt-only.${sentinel}`]: { name: sentinel, loadedHash: sentinel },
        }, { demo: { value: loaded } });

        const result = await describeSelf(ctx);
        expect(result.capabilities.find((item) => item.name === 'demo.value')?.effectiveSource).toEqual({
            status: 'unavailable', provenance: 'loader.receipt', freshness: 'unavailable',
        });
        expect(JSON.stringify(result)).not.toContain(sentinel);
    });

    test('reports known layers only for the fresh shipped composer', async () => {
        const root = resolve('.test-tmp', `self-descriptor-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(import.meta.dir, '..');
        const overlay = resolve(root, '.hyper');
        const source = resolve(src, 'agent/fullSystemPrompt.ts');

        const receipt = {
            name: 'agent.fullSystemPrompt', root: 'src', rel: 'agent/fullSystemPrompt.ts',
            loadedHash: await hash(source), loadedAt: '2026-08-13T00:00:00.000Z', generation: 1,
        };
        bindReceipt(receipt, fullSystemPrompt);
        const ctx = makeCtx(src, overlay, { 'agent.fullSystemPrompt': receipt }, {
            agent: { fullSystemPrompt },
        }, async () => [{
            kind: 'fn', moduleDir: 'agent', runtimeName: 'fullSystemPrompt', root: 'src',
            rel: 'agent/fullSystemPrompt.ts', abs: source,
        }]);
        ctx.state.agent = { a1: { systemPrompt: 'bounded additive prompt' } };

        const result = await describeSelf(ctx);
        const layers = layerMap(result);
        expect(layers['effective-composer']).toMatchObject({
            status: 'observed', path: 'src/agent/fullSystemPrompt.ts', freshness: 'fresh',
        });
        expect(layers.core).toMatchObject({
            status: 'observed', path: 'src/agent/SYSTEM_PROMPT_CORE.txt',
            sourceHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        });
        expect(layers['wire-format']).toMatchObject({
            status: 'observed', path: 'src/agent/SYSTEM_PROMPT.txt',
            sourceHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        });
        expect(layers['per-agent-additive']).toMatchObject({
            status: 'observed', configuredAgentCount: 1,
        });
        expect(layers['runtime-context']).toMatchObject({
            status: 'inferred', provenance: 'src/agent/fullSystemPrompt.ts',
        });
    });

    test('keeps internal prompt layers unavailable for overlay, replacement and unproven composers', async () => {
        const root = resolve('.test-tmp', `self-descriptor-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        await mkdir(resolve(src, 'agent'), { recursive: true });
        await mkdir(resolve(overlay, 'agent'), { recursive: true });
        await Bun.write(resolve(src, 'agent/fullSystemPrompt.ts'), 'export default async () => "base";\n');
        const overlaySource = resolve(overlay, 'agent/fullSystemPrompt.ts');
        await Bun.write(overlaySource, 'export default async () => "overlay";\n');

        const overlayComposer = async () => 'overlay';
        const receipt = {
            name: 'agent.fullSystemPrompt', root: '.hyper', rel: 'agent/fullSystemPrompt.ts',
            loadedHash: await hash(overlaySource), loadedAt: '2026-08-13T00:00:00.000Z', generation: 2,
        };
        bindReceipt(receipt, overlayComposer);
        const overlayCtx = makeCtx(src, overlay, { 'agent.fullSystemPrompt': receipt }, {
            agent: { fullSystemPrompt: overlayComposer },
        });
        const overlayLayers = layerMap(await describeSelf(overlayCtx));
        expect(overlayLayers['effective-composer']).toMatchObject({
            status: 'observed', path: '.hyper/agent/fullSystemPrompt.ts', freshness: 'fresh',
        });
        expectUnknownComposition(overlayLayers);

        const replacementCtx = makeCtx(src, overlay, { 'agent.fullSystemPrompt': receipt }, {
            agent: { fullSystemPrompt: async () => 'replacement' },
        });
        const replacementLayers = layerMap(await describeSelf(replacementCtx));
        expect(replacementLayers['effective-composer'].status).toBe('unavailable');
        expectUnknownComposition(replacementLayers);

        const unprovenCtx = makeCtx(src, overlay, {}, {
            agent: { fullSystemPrompt: async () => 'dynamic' },
        });
        const unprovenLayers = layerMap(await describeSelf(unprovenCtx));
        expect(unprovenLayers['effective-composer'].status).toBe('unavailable');
        expectUnknownComposition(unprovenLayers);
    });

    test('does not infer known layers for a fresh same-path composer with different bytes', async () => {
        const root = resolve('.test-tmp', `self-descriptor-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        await mkdir(resolve(src, 'agent'), { recursive: true });
        const source = resolve(src, 'agent/fullSystemPrompt.ts');
        await Bun.write(source, 'export default async () => "different structure";\n');

        const composer = async () => 'different structure';
        const receipt = {
            name: 'agent.fullSystemPrompt', root: 'src', rel: 'agent/fullSystemPrompt.ts',
            loadedHash: await hash(source), loadedAt: '2026-08-13T00:00:00.000Z', generation: 1,
        };
        bindReceipt(receipt, composer);
        const ctx = makeCtx(src, overlay, { 'agent.fullSystemPrompt': receipt }, {
            agent: { fullSystemPrompt: composer },
        });

        const layers = layerMap(await describeSelf(ctx));
        expect(layers['effective-composer']).toMatchObject({
            status: 'observed', path: 'src/agent/fullSystemPrompt.ts', freshness: 'fresh',
        });
        expectUnknownComposition(layers);
    });
});

function makeCtx(
    src: string,
    overlay: string,
    receipts: Record<string, any>,
    runtimeFns: Record<string, any> = { demo: { value: () => 'overlay' } },
    scanFn: (ctx: Context) => Promise<any[]> = scan,
) {
    const roots = async () => {
        const candidates = [
            { name: 'src', dir: src },
            { name: '.hyper', dir: overlay },
        ];
        const existing = [];
        for (const candidate of candidates) {
            if (await stat(candidate.dir).then(() => true).catch(() => false)) existing.push(candidate);
        }
        return existing;
    };
    return {
        env: {},
        state: { functionSources: receipts },
        routes: {},
        fns: { project: { roots, scan: scanFn }, ...runtimeFns },
    } as unknown as Context;
}

function bindReceipt(receipt: Record<string | symbol, unknown>, fn: Function) {
    Object.defineProperty(receipt, Symbol.for('hyper-code2.function-source.loaded-function'), {
        value: fn,
        enumerable: false,
    });
}

function layerMap(result: Awaited<ReturnType<typeof describeSelf>>) {
    return Object.fromEntries(result.prompts.layers.map((layer) => [layer.name, layer])) as Record<string, any>;
}

function expectUnknownComposition(layers: Record<string, any>) {
    for (const name of ['core', 'wire-format', 'per-agent-additive', 'runtime-context']) {
        expect(layers[name]).toEqual({
            name,
            status: 'unavailable',
            provenance: 'active-composer.structure',
            contentIncluded: false,
        });
    }
}

async function hash(path: string) {
    const digest = await crypto.subtle.digest('SHA-256', await Bun.file(path).arrayBuffer());
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
