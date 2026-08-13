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

    test('revalidates an earlier capability when its source changes during a later hash', async () => {
        const root = resolve('.test-tmp', `self-descriptor-source-snapshot-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        const firstSource = resolve(src, 'demo/a.ts');
        const laterSource = resolve(src, 'demo/z.ts');
        await mkdir(resolve(src, 'demo'), { recursive: true });
        await Bun.write(firstSource, 'export default () => "a-v1";\n');
        await Bun.write(laterSource, 'export default () => "z";\n');

        const loaded = () => 'a-v1';
        const receipt = {
            name: 'demo.a', root: 'src', rel: 'demo/a.ts',
            loadedHash: await hash(firstSource), loadedAt: '2026-08-13T00:00:00.000Z', generation: 1,
        };
        bindReceipt(receipt, loaded);
        const entries = [
            { kind: 'fn', moduleDir: 'demo', runtimeName: 'a', root: 'src', rel: 'demo/a.ts', abs: firstSource },
            { kind: 'fn', moduleDir: 'demo', runtimeName: 'z', root: 'src', rel: 'demo/z.ts', abs: laterSource },
        ];
        const ctx = makeCtx(src, overlay, { 'demo.a': receipt }, { demo: { a: loaded } }, async () => entries);

        const originalFile = Bun.file;
        let markStarted!: () => void;
        let resumeRead!: () => void;
        const started = new Promise<void>((resolveStarted) => { markStarted = resolveStarted; });
        const resume = new Promise<void>((resolveResume) => { resumeRead = resolveResume; });
        let blocked = false;
        (Bun as any).file = (path: string | URL, ...args: any[]) => {
            const file = (originalFile as any).call(Bun, path, ...args);
            if (String(path) !== laterSource) return file;
            return {
                arrayBuffer: async () => {
                    if (!blocked) {
                        blocked = true;
                        markStarted();
                        await resume;
                    }
                    return file.arrayBuffer();
                },
            };
        };

        try {
            const describing = describeSelf(ctx);
            await started;
            await Bun.write(firstSource, 'export default () => "a-v2";\n');
            const changedHash = await hash(firstSource);
            resumeRead();
            const result = await describing;
            const capability = result.capabilities.find((item) => item.name === 'demo.a');
            expect(capability?.candidates[0]).toMatchObject({ status: 'observed', sourceHash: changedHash });
            expect(capability?.effectiveSource).toMatchObject({
                status: 'observed', freshness: 'stale', loadedHash: receipt.loadedHash, currentHash: changedHash,
            });
        } finally {
            (Bun as any).file = originalFile;
            resumeRead();
        }
    });

    test('retries when a new source candidate appears after the initial scan', async () => {
        const root = resolve('.test-tmp', `self-descriptor-membership-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        const firstSource = resolve(src, 'demo/a.ts');
        const addedSource = resolve(src, 'demo/b.ts');
        await mkdir(resolve(src, 'demo'), { recursive: true });
        await Bun.write(firstSource, 'export default () => "a";\n');
        const ctx = makeCtx(src, overlay, {}, {}, scan);

        const originalFile = Bun.file;
        let markStarted!: () => void;
        let resumeRead!: () => void;
        const started = new Promise<void>((resolveStarted) => { markStarted = resolveStarted; });
        const resume = new Promise<void>((resolveResume) => { resumeRead = resolveResume; });
        let blocked = false;
        (Bun as any).file = (path: string | URL, ...args: any[]) => {
            const file = (originalFile as any).call(Bun, path, ...args);
            if (String(path) !== firstSource) return file;
            return {
                arrayBuffer: async () => {
                    if (!blocked) {
                        blocked = true;
                        markStarted();
                        await resume;
                    }
                    return file.arrayBuffer();
                },
            };
        };

        try {
            const describing = describeSelf(ctx);
            await started;
            await Bun.write(addedSource, 'export default () => "b";\n');
            resumeRead();
            const result = await describing;
            expect(result.capabilities.find((item) => item.name === 'demo.a')?.candidates[0]).toMatchObject({
                status: 'observed', sourceHash: expect.stringMatching(/^[a-f0-9]{64}$/),
            });
            expect(result.capabilities.find((item) => item.name === 'demo.b')?.candidates[0]).toMatchObject({
                path: 'src/demo/b.ts', status: 'observed', sourceHash: await hash(addedSource),
            });
        } finally {
            (Bun as any).file = originalFile;
            resumeRead();
        }
    });

    test('uses current membership without source claims after repeated scan churn', async () => {
        const root = resolve('.test-tmp', `self-descriptor-membership-churn-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        await mkdir(resolve(src, 'demo'), { recursive: true });
        const entries = ['a', 'b', 'c'].map((runtimeName) => ({
            kind: 'fn', moduleDir: 'demo', runtimeName, root: 'src',
            rel: `demo/${runtimeName}.ts`, abs: resolve(src, `demo/${runtimeName}.ts`),
        }));
        for (const entry of entries) await Bun.write(entry.abs, `export default () => "${entry.runtimeName}";\n`);
        let scanCalls = 0;
        const churnScan = async () => {
            scanCalls++;
            if (scanCalls === 1) return entries.slice(0, 1);
            if (scanCalls <= 3) return entries.slice(0, 2);
            return entries;
        };
        const ctx = makeCtx(src, overlay, {}, {}, churnScan);

        const result = await describeSelf(ctx);
        expect(scanCalls).toBe(4);
        expect(result.capabilities.filter((item) => item.name.startsWith('demo.')).map((item) => item.name)).toEqual([
            'demo.a', 'demo.b', 'demo.c',
        ]);
        for (const capability of result.capabilities.filter((item) => item.name.startsWith('demo.'))) {
            expect(capability.candidates).toHaveLength(1);
            expect(capability.candidates[0]).toEqual({
                root: 'src', path: `src/demo/${capability.name.split('.')[1]}.ts`,
                status: 'unavailable', provenance: 'project.scan',
            });
            expect(capability.effectiveSource).toEqual({
                status: 'unavailable', provenance: 'loader.receipt', freshness: 'unavailable',
            });
        }
    });

    test('treats scan ordering changes as the same canonical membership', async () => {
        const root = resolve('.test-tmp', `self-descriptor-membership-order-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        await mkdir(resolve(src, 'demo'), { recursive: true });
        const entries = ['a', 'b'].map((runtimeName) => ({
            kind: 'fn', moduleDir: 'demo', runtimeName, root: 'src',
            rel: `demo/${runtimeName}.ts`, abs: resolve(src, `demo/${runtimeName}.ts`),
        }));
        for (const entry of entries) await Bun.write(entry.abs, `export default () => "${entry.runtimeName}";\n`);
        let scanCalls = 0;
        const alternatingScan = async () => {
            scanCalls++;
            return scanCalls % 2 ? entries : [...entries].reverse();
        };
        const ctx = makeCtx(src, overlay, {}, {}, alternatingScan);

        const result = await describeSelf(ctx);
        expect(scanCalls).toBe(2);
        for (const name of ['demo.a', 'demo.b']) {
            expect(result.capabilities.find((item) => item.name === name)?.candidates[0]).toMatchObject({
                status: 'observed', sourceHash: expect.stringMatching(/^[a-f0-9]{64}$/),
            });
        }
    });

    test('retries when ordered source roots reverse precedence', async () => {
        const root = resolve('.test-tmp', `self-descriptor-root-order-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        await mkdir(resolve(src, 'demo'), { recursive: true });
        await mkdir(resolve(overlay, 'demo'), { recursive: true });
        const srcEntry = {
            kind: 'fn', moduleDir: 'demo', runtimeName: 'value', root: 'src', rootDir: src,
            rel: 'demo/value.ts', abs: resolve(src, 'demo/value.ts'),
        };
        const overlayEntry = {
            kind: 'fn', moduleDir: 'demo', runtimeName: 'value', root: '.hyper', rootDir: overlay,
            rel: 'demo/value.ts', abs: resolve(overlay, 'demo/value.ts'),
        };
        await Bun.write(srcEntry.abs, 'export default () => "src";\n');
        await Bun.write(overlayEntry.abs, 'export default () => "overlay";\n');
        let scanCalls = 0;
        const reversingScan = async () => {
            scanCalls++;
            return scanCalls === 1 ? [srcEntry, overlayEntry] : [overlayEntry, srcEntry];
        };
        const ctx = makeCtx(src, overlay, {}, {}, reversingScan);

        const result = await describeSelf(ctx);
        expect(scanCalls).toBe(4);
        const capability = result.capabilities.find((item) => item.name === 'demo.value');
        expect(capability?.candidates.map((item) => item.path)).toEqual([
            '.hyper/demo/value.ts', 'src/demo/value.ts',
        ]);
        expect(capability?.candidates.every((item) => item.status === 'observed')).toBe(true);
    });

    test('retries when same-root aliases reverse effective precedence', async () => {
        const root = resolve('.test-tmp', `self-descriptor-alias-order-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        await mkdir(resolve(src, 'demo'), { recursive: true });
        const plainEntry = {
            kind: 'fn', moduleDir: 'demo', runtimeName: 'value', root: 'src', rootDir: src,
            rel: 'demo/value.ts', abs: resolve(src, 'demo/value.ts'),
        };
        const dollarEntry = {
            kind: 'fn', moduleDir: 'demo', runtimeName: 'value', root: 'src', rootDir: src,
            rel: 'demo/$value.ts', abs: resolve(src, 'demo/$value.ts'),
        };
        await Bun.write(plainEntry.abs, 'export default () => "plain";\n');
        await Bun.write(dollarEntry.abs, 'export default () => "dollar";\n');
        let scanCalls = 0;
        const reversingScan = async () => {
            scanCalls++;
            return scanCalls === 1 ? [plainEntry, dollarEntry] : [dollarEntry, plainEntry];
        };
        const ctx = makeCtx(src, overlay, {}, {}, reversingScan);

        const result = await describeSelf(ctx);
        expect(scanCalls).toBe(4);
        expect(result.capabilities.find((item) => item.name === 'demo.value')?.candidates.map((item) => item.path)).toEqual([
            'src/demo/$value.ts', 'src/demo/value.ts',
        ]);
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

    test('fails closed when the live registry changes during source inspection', async () => {
        const root = resolve('.test-tmp', `self-descriptor-mutation-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        await mkdir(resolve(src, 'demo'), { recursive: true });
        const source = resolve(src, 'demo/value.ts');
        await Bun.write(source, 'export default () => "loaded";\n');

        const original = () => 'original';
        const replacement = () => 'replacement';
        const demo: Record<string, unknown> = {};
        Object.defineProperty(demo, 'value', {
            configurable: true,
            enumerable: true,
            get() {
                Object.defineProperty(demo, 'value', {
                    configurable: true,
                    enumerable: true,
                    writable: true,
                    value: replacement,
                });
                return original;
            },
        });
        const receipt = {
            name: 'demo.value', root: 'src', rel: 'demo/value.ts',
            loadedHash: await hash(source), loadedAt: '2026-08-13T00:00:00.000Z', generation: 1,
        };
        bindReceipt(receipt, original);
        const ctx = makeCtx(src, overlay, { 'demo.value': receipt }, { demo });

        const capability = (await describeSelf(ctx)).capabilities.find((item) => item.name === 'demo.value');
        expect((demo as any).value).toBe(replacement);
        expect(capability?.effectiveSource).toEqual({
            status: 'unavailable', provenance: 'loader.receipt', freshness: 'unavailable',
        });
    });

    test('reconciles capability names and authority from the same final registry snapshot', async () => {
        const root = resolve('.test-tmp', `self-descriptor-registry-keys-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        const source = resolve(src, 'git/commit.ts');
        await mkdir(resolve(src, 'git'), { recursive: true });
        await Bun.write(source, 'export default () => "commit";\n');
        const commit = () => 'commit';
        const push = () => 'push';
        const receipt = {
            name: 'git.commit', root: 'src', rel: 'git/commit.ts',
            loadedHash: await hash(source), loadedAt: '2026-08-13T00:00:00.000Z', generation: 1,
        };
        bindReceipt(receipt, commit);
        const ctx = makeCtx(src, overlay, { 'git.commit': receipt }, { git: { commit } });

        const originalFile = Bun.file;
        let markStarted!: () => void;
        let resumeRead!: () => void;
        const started = new Promise<void>((resolveStarted) => { markStarted = resolveStarted; });
        const resume = new Promise<void>((resolveResume) => { resumeRead = resolveResume; });
        let blocked = false;
        (Bun as any).file = (path: string | URL, ...args: any[]) => {
            const file = (originalFile as any).call(Bun, path, ...args);
            if (String(path) !== source) return file;
            return {
                arrayBuffer: async () => {
                    if (!blocked) {
                        blocked = true;
                        markStarted();
                        await resume;
                    }
                    return file.arrayBuffer();
                },
            };
        };

        try {
            const describing = describeSelf(ctx);
            await started;
            (ctx.fns as any).git = { push };
            resumeRead();
            const result = await describing;
            expect(result.capabilities.find((item) => item.name === 'git.commit')).toMatchObject({
                registryStatus: 'unavailable',
                effectiveSource: { status: 'unavailable', freshness: 'unavailable' },
            });
            expect(result.capabilities.find((item) => item.name === 'git.push')).toEqual({
                name: 'git.push', registryStatus: 'observed', provenance: 'runtime.registry',
                candidates: [],
                effectiveSource: { status: 'unavailable', provenance: 'loader.receipt', freshness: 'unavailable' },
            });
            const gitAuthority = result.authority.categories.find((item) => item.name === 'git');
            expect(gitAuthority?.evidence).toEqual(['git.push']);
        } finally {
            (Bun as any).file = originalFile;
            resumeRead();
        }
    });

    test('fails closed when the active composer changes while prompt layers are read', async () => {
        const root = resolve('.test-tmp', `self-descriptor-composer-race-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(import.meta.dir, '..');
        const overlay = resolve(root, '.hyper');
        const source = resolve(src, 'agent/fullSystemPrompt.ts');
        const core = resolve(src, 'agent/SYSTEM_PROMPT_CORE.txt');
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

        const originalFile = Bun.file;
        let markStarted!: () => void;
        let resumeRead!: () => void;
        const started = new Promise<void>((resolveStarted) => { markStarted = resolveStarted; });
        const resume = new Promise<void>((resolveResume) => { resumeRead = resolveResume; });
        (Bun as any).file = (path: string | URL, ...args: any[]) => {
            const file = (originalFile as any).call(Bun, path, ...args);
            if (String(path) !== core) return file;
            return {
                exists: () => file.exists(),
                arrayBuffer: async () => {
                    markStarted();
                    await resume;
                    return file.arrayBuffer();
                },
            };
        };

        try {
            const describing = describeSelf(ctx);
            await started;
            (ctx.fns as any).agent.fullSystemPrompt = async () => 'replacement';
            resumeRead();
            const result = await describing;
            const composer = result.capabilities.find((item) => item.name === 'agent.fullSystemPrompt');
            expect(composer?.effectiveSource).toEqual({
                status: 'unavailable', provenance: 'loader.receipt', freshness: 'unavailable',
            });
            expectUnknownComposition(layerMap(result));
        } finally {
            (Bun as any).file = originalFile;
            resumeRead();
        }
    });

    test('marks the composer stale when its source changes while prompt layers are read', async () => {
        const root = resolve('.test-tmp', `self-descriptor-composer-source-race-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        const shippedSource = resolve(import.meta.dir, '../agent/fullSystemPrompt.ts');
        const source = resolve(src, 'agent/fullSystemPrompt.ts');
        const core = resolve(src, 'agent/SYSTEM_PROMPT_CORE.txt');
        await mkdir(resolve(src, 'agent'), { recursive: true });
        await Bun.write(source, await Bun.file(shippedSource).arrayBuffer());
        await Bun.write(core, 'test core layer\n');
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

        const originalFile = Bun.file;
        let markStarted!: () => void;
        let resumeRead!: () => void;
        const started = new Promise<void>((resolveStarted) => { markStarted = resolveStarted; });
        const resume = new Promise<void>((resolveResume) => { resumeRead = resolveResume; });
        (Bun as any).file = (path: string | URL, ...args: any[]) => {
            const file = (originalFile as any).call(Bun, path, ...args);
            if (String(path) !== core) return file;
            return {
                exists: () => file.exists(),
                arrayBuffer: async () => {
                    markStarted();
                    await resume;
                    return file.arrayBuffer();
                },
            };
        };

        try {
            const describing = describeSelf(ctx);
            await started;
            await Bun.write(source, 'export default async () => "changed composer";\n');
            resumeRead();
            const result = await describing;
            const composer = result.capabilities.find((item) => item.name === 'agent.fullSystemPrompt');
            expect(composer?.effectiveSource).toMatchObject({
                status: 'observed', freshness: 'stale', loadedHash: receipt.loadedHash,
            });
            expect((composer?.effectiveSource as any).currentHash).not.toBe(receipt.loadedHash);
            expect(layerMap(result)['effective-composer']).toMatchObject({
                status: 'observed', freshness: 'stale', loadedHash: receipt.loadedHash,
            });
            expectUnknownComposition(layerMap(result));
        } finally {
            (Bun as any).file = originalFile;
            resumeRead();
        }
    });

    test('revalidates when the composer changes during the final provenance read', async () => {
        const root = resolve('.test-tmp', `self-descriptor-composer-final-read-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        const shippedSource = resolve(import.meta.dir, '../agent/fullSystemPrompt.ts');
        const source = resolve(src, 'agent/fullSystemPrompt.ts');
        await mkdir(resolve(src, 'agent'), { recursive: true });
        await Bun.write(source, await Bun.file(shippedSource).arrayBuffer());
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

        const originalFile = Bun.file;
        let composerReads = 0;
        (Bun as any).file = (path: string | URL, ...args: any[]) => {
            const file = (originalFile as any).call(Bun, path, ...args);
            if (String(path) !== source) return file;
            return {
                arrayBuffer: async () => {
                    composerReads++;
                    const bytes = await file.arrayBuffer();
                    if (composerReads === 3) {
                        await Bun.write(source, 'export default async () => "changed during final read";\n');
                    }
                    return bytes;
                },
            };
        };

        try {
            const result = await describeSelf(ctx);
            expect(composerReads).toBe(6);
            const composer = result.capabilities.find((item) => item.name === 'agent.fullSystemPrompt');
            expect(composer?.effectiveSource).toMatchObject({
                status: 'observed', provenance: 'loader.receipt', freshness: 'stale',
                loadedHash: receipt.loadedHash,
            });
            expect((composer?.effectiveSource as any).currentHash).toBe(await hash(source));
            expectUnknownComposition(layerMap(result));
        } finally {
            (Bun as any).file = originalFile;
        }
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

    test('resolves prompt layers beside an overridden physical composer source', async () => {
        const root = resolve('.test-tmp', `self-descriptor-composer-root-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        const shippedSource = resolve(import.meta.dir, '../agent/fullSystemPrompt.ts');
        const agentDir = resolve(src, 'agent');
        const source = resolve(agentDir, 'fullSystemPrompt.ts');
        const core = resolve(agentDir, 'SYSTEM_PROMPT_CORE.txt');
        const wire = resolve(agentDir, 'SYSTEM_PROMPT.txt');
        await mkdir(agentDir, { recursive: true });
        await Bun.write(source, await Bun.file(shippedSource).arrayBuffer());
        await Bun.write(core, 'override core layer\n');
        await Bun.write(wire, 'override wire layer\n');
        const composer = {
            name: 'agent.fullSystemPrompt', root: 'src', rel: 'agent/fullSystemPrompt.ts',
            loadedHash: await hash(source), loadedAt: '2026-08-13T00:00:00.000Z', generation: 1,
        };
        bindReceipt(composer, fullSystemPrompt);
        const ctx = makeCtx(src, overlay, { 'agent.fullSystemPrompt': composer }, {
            agent: { fullSystemPrompt },
        }, async () => [{
            kind: 'fn', moduleDir: 'agent', runtimeName: 'fullSystemPrompt', root: 'src', rootDir: src,
            rel: 'agent/fullSystemPrompt.ts', abs: source,
        }]);

        const layers = layerMap(await describeSelf(ctx));
        expect(layers.core).toMatchObject({
            status: 'observed', path: 'src/agent/SYSTEM_PROMPT_CORE.txt', sourceHash: await hash(core),
        });
        expect(layers['wire-format']).toMatchObject({
            status: 'observed', path: 'src/agent/SYSTEM_PROMPT.txt', sourceHash: await hash(wire),
        });
    });

    test('returns a descriptor when runtime registry namespaces contain cycles', async () => {
        const root = resolve('.test-tmp', `self-descriptor-cycle-${crypto.randomUUID()}`);
        fixtures.push(root);
        const src = resolve(root, 'src');
        const overlay = resolve(root, '.hyper');
        await mkdir(src, { recursive: true });
        const namespace: Record<string, any> = { value: () => 'value' };
        namespace.self = namespace;
        const ctx = makeCtx(src, overlay, {}, { demo: namespace }, async () => []);

        const result = await describeSelf(ctx);
        expect(result.schemaVersion).toBe(1);
        expect(result.capabilities.find((item) => item.name === 'demo.value')).toMatchObject({
            name: 'demo.value', registryStatus: 'observed',
        });
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
