import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import describeSelf from './describe';
import scan from '../project/scan';

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
});

function makeCtx(src: string, overlay: string, receipts: Record<string, any>) {
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
        fns: { project: { roots, scan }, demo: { value: () => 'overlay' } },
    } as unknown as Context;
}

async function hash(path: string) {
    const digest = await crypto.subtle.digest('SHA-256', await Bun.file(path).arrayBuffer());
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
