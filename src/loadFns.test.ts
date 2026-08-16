import { test, expect, describe } from "bun:test";
import { mkdir, realpath, rm, symlink, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import loadFns from "./loadFns";
import roots from "./project/roots";
import scan from "./project/scan";
import invoke from "./repl/invoke";

describe("loadFns", () => {
    test("loads root and namespaced functions via project scanner", async () => {
        const ctx = { fns: { project: { roots, scan } }, routes: {}, state: {} } as unknown as Context;
        await loadFns(ctx);
        expect((ctx as any).genTypes).toBeTypeOf("function");
        expect((ctx.fns as any).db.connect).toBeTypeOf("function");
        expect((ctx.fns as any).agent.run).toBeTypeOf("function");
        const receipt = (ctx.state as any).functionSources['db.connect'];
        expect(receipt).toMatchObject({
            name: 'db.connect',
            root: 'src',
            rel: 'db/connect.ts',
            generation: expect.any(Number),
            loadedHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        });
        const identity = Symbol.for('hyper-code2.function-source.loaded-function');
        const sourcePath = Symbol.for('hyper-code2.function-source.loaded-physical-path');
        const expectedPath = await realpath(resolve('src/db/connect.ts'));
        expect(receipt[identity]).toBe((ctx.fns as any).db.connect);
        expect(receipt[sourcePath]).toBe(expectedPath);
        expect(Object.getOwnPropertyDescriptor(receipt, identity)?.enumerable).toBe(false);
        expect(Object.getOwnPropertyDescriptor(receipt, sourcePath)?.enumerable).toBe(false);
        expect(JSON.stringify(receipt)).not.toContain(expectedPath);
        expect(Object.getOwnPropertySymbols(JSON.parse(JSON.stringify(receipt)))).toEqual([]);
    });

    test("loads a root procedure whose name collides with Object.prototype", async () => {
        const fixture = `.test-tmp/load-fns-root-constructor-${crypto.randomUUID()}`;
        const source = resolve(fixture, "src/constructor.ts");
        await mkdir(resolve(fixture, "src"), { recursive: true });
        await Bun.write(source, 'export default async () => "root-constructor";\n');
        const entry = {
            kind: "fn", moduleDir: ".", runtimeName: "constructor",
            root: "src", rel: "constructor.ts", abs: source,
        };
        const ctx = {
            state: {}, routes: {},
            fns: { project: { scan: async () => [entry] } },
        } as unknown as Context;

        try {
            await loadFns(ctx);

            expect(await (ctx as any).constructor()).toBe("root-constructor");
            expect((ctx.state as any).functionLifecycle.active.constructor).toMatchObject({
                fn: (ctx as any).constructor,
            });
            expect(Object.getPrototypeOf((ctx.state as any).functionLifecycle.active)).toBeNull();
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("rejects a source rewrite during startup import before registry assignment", async () => {
        const fixture = `.test-tmp/load-fns-race-${crypto.randomUUID()}`;
        const source = resolve(fixture, "src/demo/value.ts");
        const started = resolve(fixture, "started");
        await mkdir(resolve(fixture, "src/demo"), { recursive: true });
        await Bun.write(source, [
            `await Bun.write(${JSON.stringify(started)}, "started");`,
            `await Bun.sleep(100);`,
            `export default async function () { return "v1"; }`,
            "",
        ].join("\n"));

        const previous = async () => "previous";
        const ctx = {
            state: {},
            routes: {},
            fns: {
                project: {
                    scan: async () => [{
                        kind: "fn",
                        moduleDir: "demo",
                        runtimeName: "value",
                        root: "src",
                        rel: "demo/value.ts",
                        abs: source,
                    }],
                },
                demo: { value: previous },
            },
        } as unknown as Context;

        try {
            const loading = loadFns(ctx);
            for (let attempt = 0; attempt < 100 && !(await Bun.file(started).exists()); attempt++) {
                await Bun.sleep(5);
            }
            expect(await Bun.file(started).exists()).toBe(true);
            await Bun.write(source, `export default async function () { return "v2"; }\n`);

            await expect(loading).rejects.toThrow("src/demo/value.ts: source changed while loading");
            expect((ctx.fns as any).demo.value).toBe(previous);
            expect((ctx.state as any).functionSources?.["demo.value"]).toBeUndefined();
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("evaluates winning startup modules serially in scan order", async () => {
        const fixture = `.test-tmp/load-fns-serial-evaluation-${crypto.randomUUID()}`;
        const first = resolve(fixture, "src/demo/first.ts");
        const second = resolve(fixture, "src/demo/second.ts");
        const firstStarted = resolve(fixture, "first-started");
        const release = resolve(fixture, "release");
        const secondEvaluated = resolve(fixture, "second-evaluated");
        await mkdir(resolve(fixture, "src/demo"), { recursive: true });
        await Bun.write(first, [
            `await Bun.write(${JSON.stringify(firstStarted)}, "started");`,
            `while (!(await Bun.file(${JSON.stringify(release)}).exists())) await Bun.sleep(2);`,
            'export default async () => "first";',
            '',
        ].join("\n"));
        await Bun.write(second, [
            `await Bun.write(${JSON.stringify(secondEvaluated)}, "evaluated");`,
            'export default async () => "second";',
            '',
        ].join("\n"));
        let entries = [
            { kind: "fn", moduleDir: "demo", runtimeName: "first", root: "src", rel: "demo/first.ts", abs: first },
            { kind: "fn", moduleDir: "demo", runtimeName: "second", root: "src", rel: "demo/second.ts", abs: second },
        ];
        const ctx = { state: {}, routes: {}, fns: { project: { scan: async () => entries } } } as unknown as Context;

        try {
            const loading = loadFns(ctx);
            for (let attempt = 0; attempt < 100 && !(await Bun.file(firstStarted).exists()); attempt++) {
                await Bun.sleep(2);
            }
            expect(await Bun.file(firstStarted).exists()).toBe(true);
            await Bun.sleep(20);
            expect(await Bun.file(secondEvaluated).exists()).toBe(false);

            await Bun.write(release, "release");
            await loading;
            expect(await Bun.file(secondEvaluated).exists()).toBe(true);
        } finally {
            await Bun.write(release, "release");
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("rejects a setting rewrite while a later startup module is evaluating", async () => {
        const fixture = `.test-tmp/load-fns-setting-race-${crypto.randomUUID()}`;
        const setting = resolve(fixture, "src/demo/$setting_mode.ts");
        const fn = resolve(fixture, "src/demo/value.ts");
        const started = resolve(fixture, "started");
        const release = resolve(fixture, "release");
        await mkdir(resolve(fixture, "src/demo"), { recursive: true });
        await Bun.write(setting, 'export default { type: "string", default: "staged" };\n');
        await Bun.write(fn, [
            `await Bun.write(${JSON.stringify(started)}, "started");`,
            `while (!(await Bun.file(${JSON.stringify(release)}).exists())) await Bun.sleep(2);`,
            'export default async () => "staged";',
            '',
        ].join("\n"));
        const previous = { type: "string", default: "previous" };
        const entries = [
            { kind: "setting", settingModule: "demo", settingKey: "mode", root: "src", rel: "demo/$setting_mode.ts", abs: setting },
            { kind: "fn", moduleDir: "demo", runtimeName: "value", root: "src", rel: "demo/value.ts", abs: fn },
        ];
        const ctx = {
            state: { settingsRegistry: new Map([["demo.mode", previous]]) }, routes: {},
            fns: { project: { scan: async () => entries }, demo: { value: async () => "previous" } },
        } as unknown as Context;

        try {
            const loading = loadFns(ctx);
            for (let attempt = 0; attempt < 100 && !(await Bun.file(started).exists()); attempt++) {
                await Bun.sleep(2);
            }
            expect(await Bun.file(started).exists()).toBe(true);
            await Bun.write(setting, 'export default { type: "string", default: "rewritten" };\n');
            await Bun.write(release, "release");

            await expect(loading).rejects.toThrow("src/demo/$setting_mode.ts: source changed while loading");
            expect((ctx.state as any).settingsRegistry.get("demo.mode")).toBe(previous);
        } finally {
            await Bun.write(release, "release");
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("falls back to the last valid setting descriptor when an overlay is invalid", async () => {
        const fixture = `.test-tmp/load-fns-setting-fallback-${crypto.randomUUID()}`;
        const base = resolve(fixture, "src/demo/$setting_mode.ts");
        const overlay = resolve(fixture, ".hyper/demo/$setting_mode.ts");
        await mkdir(resolve(fixture, "src/demo"), { recursive: true });
        await mkdir(resolve(fixture, ".hyper/demo"), { recursive: true });
        await Bun.write(base, 'export default { source: "base" };\n');
        await Bun.write(overlay, 'export default undefined;\n');
        let entries = [
            { kind: "setting", settingModule: "demo", settingKey: "mode", root: "src", rel: "demo/$setting_mode.ts", abs: base },
            { kind: "setting", settingModule: "demo", settingKey: "mode", root: ".hyper", rel: "demo/$setting_mode.ts", abs: overlay },
        ];
        const ctx = {
            state: {}, routes: {},
            fns: { project: { scan: async () => entries } },
        } as unknown as Context;

        try {
            await loadFns(ctx);
            expect((ctx.state as any).settingsRegistry.get("demo.mode")).toEqual({ source: "base" });

            entries = [];
            await loadFns(ctx);
            expect((ctx.state as any).settingsRegistry.has("demo.mode")).toBe(false);

            entries = [
                { kind: "setting", settingModule: "demo", settingKey: "mode", root: "src", rel: "demo/$setting_mode.ts", abs: base },
                { kind: "setting", settingModule: "demo", settingKey: "mode", root: ".hyper", rel: "demo/$setting_mode.ts", abs: overlay },
            ];

            await Bun.write(overlay, 'export default { source: "overlay" };\n');
            await loadFns(ctx);
            expect((ctx.state as any).settingsRegistry.get("demo.mode")).toEqual({ source: "overlay" });

            await Bun.write(overlay, 'export default undefined;\n');
            await loadFns(ctx);

            expect((ctx.state as any).settingsRegistry.get("demo.mode")).toEqual({ source: "base" });

            await Bun.write(base, 'export default undefined;\n');
            await loadFns(ctx);

            expect((ctx.state as any).settingsRegistry.has("demo.mode")).toBe(false);
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("disposes every successfully staged function after another startup import fails", async () => {
        const fixture = `.test-tmp/load-fns-staged-disposal-${crypto.randomUUID()}`;
        const first = resolve(fixture, "src/demo/first.ts");
        const second = resolve(fixture, "src/demo/second.ts");
        const disposed = resolve(fixture, "disposed");
        const singletonKey = `loadFnsAbortedStaging_${crypto.randomUUID()}`;
        await mkdir(resolve(fixture, "src/demo"), { recursive: true });
        const singleton = async () => "first";
        (singleton as any).dispose = async () => Bun.write(disposed, "disposed");
        (globalThis as any)[singletonKey] = singleton;
        await Bun.write(first, `export default globalThis[${JSON.stringify(singletonKey)}];\n`);
        await Bun.write(second, 'throw new Error("broken-second");\n');
        const entries = [
            { kind: "fn", moduleDir: "demo", runtimeName: "first", root: "src", rel: "demo/first.ts", abs: first },
            { kind: "fn", moduleDir: "demo", runtimeName: "second", root: "src", rel: "demo/second.ts", abs: second },
        ];
        const ctx = {
            state: {}, routes: {},
            fns: { project: { scan: async () => entries } },
        } as unknown as Context;

        try {
            await expect(loadFns(ctx)).rejects.toThrow("broken-second");
            expect(await Bun.file(disposed).text()).toBe("disposed");
            expect((ctx.state as any).functionSources).toBeUndefined();
            await Bun.write(second, 'export default async () => "second";\n');
            await expect(loadFns(ctx)).rejects.toThrow(
                "function demo.first: retired identity cannot be reactivated",
            );
        } finally {
            delete (globalThis as any)[singletonKey];
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("rejects an ABA rewrite even when the bytes hash back to the original value", async () => {
        const fixture = `.test-tmp/load-fns-aba-${crypto.randomUUID()}`;
        const source = resolve(fixture, "src/demo/value.ts");
        const started = resolve(fixture, "started");
        const originalBytes = 'export default async function () { return "a"; }\n';
        await mkdir(resolve(fixture, "src/demo"), { recursive: true });
        await Bun.write(source, [
            `await Bun.write(${JSON.stringify(source)}, ${JSON.stringify(originalBytes)});`,
            `await Bun.write(${JSON.stringify(started)}, "started");`,
            'export default async function () { return "b"; }',
            '',
        ].join("\n"));

        const previous = async () => "previous";
        const ctx = {
            state: {}, routes: {},
            fns: {
                project: {
                    scan: async () => [{
                        kind: "fn", moduleDir: "demo", runtimeName: "value",
                        root: "src", rel: "demo/value.ts", abs: source,
                    }],
                },
                demo: { value: previous },
            },
        } as unknown as Context;
        const originalFile = Bun.file;
        (Bun as any).file = (path: string | URL, ...args: any[]) => {
            if (String(path) === source) {
                return { arrayBuffer: async () => new TextEncoder().encode(originalBytes).buffer };
            }
            return (originalFile as any).call(Bun, path, ...args);
        };
        try {
            await expect(loadFns(ctx)).rejects.toThrow("source changed while loading");
            expect((ctx.fns as any).demo.value).toBe(previous);
            expect((ctx.state as any).functionSources?.["demo.value"]).toBeUndefined();
            expect(await Bun.file(started).exists()).toBe(true);
        } finally {
            (Bun as any).file = originalFile;
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("preserves a stable singleton generation and its managed lease across bootstrap reload", async () => {
        const fixture = `.test-tmp/load-fns-same-identity-${crypto.randomUUID()}`;
        const source = resolve(fixture, "src/demo/value.ts");
        const started = resolve(fixture, "started");
        const release = resolve(fixture, "release");
        const disposed = resolve(fixture, "disposed");
        const singletonKey = `loadFnsSameIdentity_${crypto.randomUUID()}`;
        await mkdir(resolve(fixture, "src/demo"), { recursive: true });
        await Bun.write(source, [
            `const fn = (globalThis as any)[Symbol.for(${JSON.stringify(singletonKey)})] ??= async () => {`,
            `  await Bun.write(${JSON.stringify(started)}, "started");`,
            `  while (!(await Bun.file(${JSON.stringify(release)}).exists())) await Bun.sleep(2);`,
            '  return "stable";',
            '};',
            `fn.dispose = async () => Bun.write(${JSON.stringify(disposed)}, "stable");`,
            'export default fn;',
            '',
        ].join("\n"));
        const entry = {
            kind: "fn", moduleDir: "demo", runtimeName: "value",
            root: "src", rel: "demo/value.ts", abs: source,
        };
        const ctx = {
            state: {}, routes: {},
            fns: { project: { scan: async () => [entry] } },
        } as unknown as Context;

        try {
            await loadFns(ctx);
            const active = (ctx.state as any).functionLifecycle.active["demo.value"];
            const running = invoke(ctx, { name: "demo.value" });
            for (let attempt = 0; attempt < 100 && !(await Bun.file(started).exists()); attempt++) {
                await Bun.sleep(2);
            }
            expect(await Bun.file(started).exists()).toBe(true);

            await loadFns(ctx);
            expect((ctx.state as any).functionLifecycle.active["demo.value"]).toBe(active);
            expect((ctx.state as any).functionSources["demo.value"].generation).toBe(active.generation);

            await Bun.write(source, 'export default async () => "replacement";\n');
            await loadFns(ctx);
            expect((ctx.state as any).functionLifecycle.retired[`demo.value@${active.generation}`]).toBe(active);
            expect(active.leases).toBe(1);
            expect(await Bun.file(disposed).exists()).toBe(false);

            await Bun.write(release, "release");
            expect(await running).toBe("stable");
            for (let attempt = 0; attempt < 100 && !(await Bun.file(disposed).exists()); attempt++) {
                await Bun.sleep(2);
            }
            expect(await Bun.file(disposed).text()).toBe("stable");
        } finally {
            delete (globalThis as any)[Symbol.for(singletonKey)];
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("does not reactivate a singleton being disposed during bootstrap reload", async () => {
        const fixture = `.test-tmp/load-fns-reactivation-${crypto.randomUUID()}`;
        const source = resolve(fixture, "src/demo/value.ts");
        const disposeStarted = resolve(fixture, "dispose-started");
        const disposeRelease = resolve(fixture, "dispose-release");
        const singletonKey = `loadFnsReactivation_${crypto.randomUUID()}`;
        await mkdir(resolve(fixture, "src/demo"), { recursive: true });
        const singleton = async () => "singleton";
        (singleton as any).dispose = async () => {
            await Bun.write(disposeStarted, "started");
            while (!(await Bun.file(disposeRelease).exists())) await Bun.sleep(2);
        };
        (globalThis as any)[singletonKey] = singleton;
        const singletonSource = `export default globalThis[${JSON.stringify(singletonKey)}];\n`;
        const entry = {
            kind: "fn", moduleDir: "demo", runtimeName: "value",
            root: "src", rel: "demo/value.ts", abs: source,
        };
        const ctx = {
            state: {}, routes: {},
            fns: { project: { scan: async () => [entry] } },
        } as unknown as Context;

        try {
            await Bun.write(source, singletonSource);
            await loadFns(ctx);
            await Bun.write(source, 'export default async () => "replacement";\n');
            await loadFns(ctx);
            for (let attempt = 0; attempt < 100 && !(await Bun.file(disposeStarted).exists()); attempt++) {
                await Bun.sleep(2);
            }
            expect(await Bun.file(disposeStarted).exists()).toBe(true);

            await Bun.write(source, singletonSource);
            await expect(loadFns(ctx)).rejects.toThrow(
                "function demo.value: retired identity cannot be reactivated",
            );
            expect(await (ctx.fns as any).demo.value()).toBe("replacement");
        } finally {
            await Bun.write(disposeRelease, "release");
            delete (globalThis as any)[singletonKey];
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("keeps a completed disposal identity blacklisted after a failed bootstrap reload", async () => {
        const fixture = `.test-tmp/load-fns-completed-reactivation-${crypto.randomUUID()}`;
        const source = resolve(fixture, "src/demo/value.ts");
        const disposed = resolve(fixture, "disposed");
        const singletonKey = `loadFnsCompleted_${crypto.randomUUID()}`;
        let disposeCalls = 0;
        await mkdir(resolve(fixture, "src/demo"), { recursive: true });
        const singleton = async () => "singleton";
        (singleton as any).dispose = async () => {
            disposeCalls++;
            await Bun.write(disposed, "disposed");
        };
        (globalThis as any)[singletonKey] = singleton;
        const singletonSource = `export default globalThis[${JSON.stringify(singletonKey)}];\n`;
        const entry = {
            kind: "fn", moduleDir: "demo", runtimeName: "value",
            root: "src", rel: "demo/value.ts", abs: source,
        };
        const ctx = {
            state: {}, routes: {},
            fns: { project: { scan: async () => [entry] } },
        } as unknown as Context;

        try {
            await Bun.write(source, singletonSource);
            await loadFns(ctx);
            await Bun.write(source, 'export default async () => "replacement";\n');
            await loadFns(ctx);
            for (let attempt = 0; attempt < 100 && !(await Bun.file(disposed).exists()); attempt++) {
                await Bun.sleep(2);
            }
            expect(await Bun.file(disposed).exists()).toBe(true);
            for (let attempt = 0; attempt < 100
                && Object.values((ctx.state as any).functionLifecycle.retired).some((record: any) => record.fn === singleton); attempt++) {
                await Bun.sleep(2);
            }

            await Bun.write(source, singletonSource);
            await expect(loadFns(ctx)).rejects.toThrow(
                "function demo.value: retired identity cannot be reactivated",
            );
            await expect(loadFns(ctx)).rejects.toThrow(
                "function demo.value: retired identity cannot be reactivated",
            );
            expect(disposeCalls).toBe(1);
            expect(await (ctx.fns as any).demo.value()).toBe("replacement");
        } finally {
            delete (globalThis as any)[singletonKey];
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("preserves every active generation when a later staged import changes", async () => {
        const fixture = `.test-tmp/load-fns-atomic-${crypto.randomUUID()}`;
        const first = resolve(fixture, "src/demo/first.ts");
        const second = resolve(fixture, "src/demo/second.ts");
        const started = resolve(fixture, "started");
        const disposed = resolve(fixture, "disposed");
        await mkdir(resolve(fixture, "src/demo"), { recursive: true });
        await Bun.write(first, [
            'const fn = async () => "first-old";',
            `fn.dispose = async () => Bun.write(${JSON.stringify(disposed)}, "disposed");`,
            'export default fn;',
            '',
        ].join('\n'));
        await Bun.write(second, 'export default async () => "second-old";\n');
        const entries = [
            { kind: 'fn', moduleDir: 'demo', runtimeName: 'first', root: 'src', rel: 'demo/first.ts', abs: first },
            { kind: 'fn', moduleDir: 'demo', runtimeName: 'second', root: 'src', rel: 'demo/second.ts', abs: second },
        ];
        const ctx = {
            state: {}, routes: {},
            fns: { project: { scan: async () => entries } },
        } as unknown as Context;

        try {
            await loadFns(ctx);
            const previousFirst = (ctx.fns as any).demo.first;
            const previousSecond = (ctx.fns as any).demo.second;
            const previousFirstActive = (ctx.state as any).functionLifecycle.active['demo.first'];
            const previousFirstReceipt = (ctx.state as any).functionSources['demo.first'];

            await Bun.write(first, 'export default async () => "first-new";\n');
            await Bun.write(second, [
                `await Bun.write(${JSON.stringify(started)}, "started");`,
                'await Bun.sleep(100);',
                'export default async () => "second-new";',
                '',
            ].join('\n'));
            const loading = loadFns(ctx);
            for (let attempt = 0; attempt < 100 && !(await Bun.file(started).exists()); attempt++) {
                await Bun.sleep(2);
            }
            expect(await Bun.file(started).exists()).toBe(true);
            await Bun.write(second, 'export default async () => "second-final";\n');

            await expect(loading).rejects.toThrow('src/demo/second.ts: source changed while loading');
            expect((ctx.fns as any).demo.first).toBe(previousFirst);
            expect((ctx.fns as any).demo.second).toBe(previousSecond);
            expect((ctx.state as any).functionLifecycle.active['demo.first']).toBe(previousFirstActive);
            expect((ctx.state as any).functionSources['demo.first']).toBe(previousFirstReceipt);
            await Bun.sleep(10);
            expect(await Bun.file(disposed).exists()).toBe(false);
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("retires functions absent from a later bootstrap scan", async () => {
        const fixture = `.test-tmp/load-fns-removed-${crypto.randomUUID()}`;
        const source = resolve(fixture, "src/demo/value.ts");
        const disposed = resolve(fixture, "disposed");
        await mkdir(resolve(fixture, "src/demo"), { recursive: true });
        await Bun.write(source, [
            'const fn = async () => "value";',
            `fn.dispose = async () => Bun.write(${JSON.stringify(disposed)}, "disposed");`,
            'export default fn;',
            '',
        ].join('\n'));
        let entries = [{
            kind: 'fn', moduleDir: 'demo', runtimeName: 'value',
            root: 'src', rel: 'demo/value.ts', abs: source,
        }];
        const ctx = {
            state: {}, routes: {},
            fns: { project: { scan: async () => entries } },
        } as unknown as Context;

        try {
            await loadFns(ctx);
            const active = (ctx.state as any).functionLifecycle.active['demo.value'];

            entries = [];
            await loadFns(ctx);

            expect((ctx.fns as any).demo.value).toBeUndefined();
            expect((ctx.state as any).functionSources['demo.value']).toBeUndefined();
            expect((ctx.state as any).functionLifecycle.active['demo.value']).toBeUndefined();
            expect((ctx.state as any).functionLifecycle.unavailable['demo.value']).toMatchObject({
                reason: 'no-current-candidate',
            });
            expect((ctx.state as any).functionLifecycle.retired[`demo.value@${active.generation}`]).toBe(active);
            for (let attempt = 0; attempt < 100 && !(await Bun.file(disposed).exists()); attempt++) {
                await Bun.sleep(2);
            }
            expect(await Bun.file(disposed).text()).toBe('disposed');
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("replaces a retired procedure with a namespace during a full reload", async () => {
        const fixture = `.test-tmp/load-fns-procedure-to-namespace-${crypto.randomUUID()}`;
        const value = resolve(fixture, "src/demo/value.ts");
        const child = resolve(fixture, "src/demo/value/child.ts");
        await mkdir(resolve(fixture, "src/demo"), { recursive: true });
        await Bun.write(value, 'export default async () => "value";\n');
        let entries: any[] = [{
            kind: "fn", moduleDir: "demo", runtimeName: "value",
            root: "src", rel: "demo/value.ts", abs: value,
        }];
        const ctx = {
            state: {}, routes: {},
            fns: { project: { scan: async () => entries } },
        } as unknown as Context;

        try {
            await loadFns(ctx);
            const previous = (ctx.fns as any).demo.value;

            await rm(value);
            await mkdir(resolve(fixture, "src/demo/value"), { recursive: true });
            await Bun.write(child, 'export default async () => "child";\n');
            entries = [{
                kind: "fn", moduleDir: "demo/value", runtimeName: "child",
                root: "src", rel: "demo/value/child.ts", abs: child,
            }];
            await loadFns(ctx);

            expect((ctx.fns as any).demo.value).not.toBe(previous);
            expect(await (ctx.fns as any).demo.value.child()).toBe("child");
            expect((ctx.state as any).functionSources["demo.value"]).toBeUndefined();
            expect((ctx.state as any).functionLifecycle.active["demo.value"]).toBeUndefined();
            expect((ctx.state as any).functionLifecycle.unavailable["demo.value"]).toMatchObject({
                reason: "no-current-candidate",
            });
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("preserves lifecycle metadata when bootstrap removal cannot be committed", async () => {
        const fixture = `.test-tmp/load-fns-removal-rollback-${crypto.randomUUID()}`;
        const a = resolve(fixture, "src/demo/a.ts");
        const stale = resolve(fixture, "src/demo/stale.ts");
        await mkdir(resolve(fixture, "src/demo"), { recursive: true });
        await Bun.write(a, 'export default async () => "old-a";\n');
        await Bun.write(stale, 'export default async () => "old-stale";\n');
        let entries = [
            { kind: "fn", moduleDir: "demo", runtimeName: "a", root: "src", rel: "demo/a.ts", abs: a },
            { kind: "fn", moduleDir: "demo", runtimeName: "stale", root: "src", rel: "demo/stale.ts", abs: stale },
        ];
        const ctx = {
            state: {}, routes: {},
            fns: { project: { scan: async () => entries } },
        } as unknown as Context;

        try {
            await loadFns(ctx);
            const oldA = (ctx.fns as any).demo.a;
            const oldReceipt = (ctx.state as any).functionSources["demo.a"];
            const oldActive = (ctx.state as any).functionLifecycle.active["demo.a"];
            Object.defineProperty((ctx.fns as any).demo, "stale", {
                configurable: false,
                enumerable: true,
                writable: true,
                value: (ctx.fns as any).demo.stale,
            });
            await Bun.write(a, 'export default async () => "new-a";\n');
            await rm(stale);
            entries = [{ kind: "fn", moduleDir: "demo", runtimeName: "a", root: "src", rel: "demo/a.ts", abs: a }];

            await expect(loadFns(ctx)).rejects.toThrow(
                "cannot remove demo.stale: target property is not configurable",
            );
            expect((ctx.fns as any).demo.a).toBe(oldA);
            expect((ctx.state as any).functionSources["demo.a"]).toBe(oldReceipt);
            expect((ctx.state as any).functionLifecycle.active["demo.a"]).toBe(oldActive);
            expect(await invoke(ctx, { name: "demo.a" })).toBe("old-a");
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("restores removed procedures when a later settings write rejects bootstrap publication", async () => {
        const fixture = `.test-tmp/load-fns-settings-removal-rollback-${crypto.randomUUID()}`;
        const value = resolve(fixture, "src/demo/value.ts");
        const stale = resolve(fixture, "src/demo/stale.ts");
        const setting = resolve(fixture, "src/demo/$setting_enabled.ts");
        await mkdir(resolve(fixture, "src/demo"), { recursive: true });
        await Bun.write(value, 'export default async () => "old";\n');
        await Bun.write(stale, 'export default async () => "old-stale";\n');
        await Bun.write(setting, 'export default { type: "boolean" };\n');
        let entries: any[] = [
            { kind: "fn", moduleDir: "demo", runtimeName: "value", root: "src", rel: "demo/value.ts", abs: value },
            { kind: "fn", moduleDir: "demo", runtimeName: "stale", root: "src", rel: "demo/stale.ts", abs: stale },
        ];
        const ctx = {
            state: {}, routes: {},
            fns: { project: { scan: async () => entries } },
        } as unknown as Context;

        try {
            await loadFns(ctx);
            const oldValue = (ctx.fns as any).demo.value;
            const oldStale = (ctx.fns as any).demo.stale;
            const registry = new Map<string, any>();
            registry.set = function (key, descriptor) {
                Map.prototype.set.call(this, key, descriptor);
                throw new Error("settings write rejected");
            };
            (ctx.state as any).settingsRegistry = registry;
            await Bun.write(value, 'export default async () => "new";\n');
            await rm(stale);
            entries = [
                { kind: "fn", moduleDir: "demo", runtimeName: "value", root: "src", rel: "demo/value.ts", abs: value },
                { kind: "setting", settingModule: "demo", settingKey: "enabled", root: "src", rel: "demo/$setting_enabled.ts", abs: setting },
            ];

            await expect(loadFns(ctx)).rejects.toThrow("settings write rejected");
            expect((ctx.fns as any).demo.value).toBe(oldValue);
            expect((ctx.fns as any).demo.stale).toBe(oldStale);
            expect(await invoke(ctx, { name: "demo.value" })).toBe("old");
            expect(await invoke(ctx, { name: "demo.stale" })).toBe("old-stale");
            expect(registry.has("demo.enabled")).toBe(false);
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("keeps the active generation when a replacement has no default function export", async () => {
        const fixture = `.test-tmp/load-fns-malformed-${crypto.randomUUID()}`;
        const source = resolve(fixture, "src/demo/value.ts");
        await mkdir(resolve(fixture, "src/demo"), { recursive: true });
        await Bun.write(source, 'export default async () => "active";\n');
        const entries = [{
            kind: 'fn', moduleDir: 'demo', runtimeName: 'value',
            root: 'src', rel: 'demo/value.ts', abs: source,
        }];
        const ctx = {
            state: {}, routes: {},
            fns: { project: { scan: async () => entries } },
        } as unknown as Context;

        try {
            await loadFns(ctx);
            const active = (ctx.fns as any).demo.value;
            const receipt = (ctx.state as any).functionSources['demo.value'];
            await Bun.write(source, 'export default {};\n');

            await expect(loadFns(ctx)).rejects.toThrow('src/demo/value.ts: no default function export');
            expect((ctx.fns as any).demo.value).toBe(active);
            expect((ctx.state as any).functionSources['demo.value']).toBe(receipt);
            expect(await active()).toBe('active');
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("rejects a staged function when its logical symlink path is remapped", async () => {
        const fixture = `.test-tmp/load-fns-symlink-${crypto.randomUUID()}`;
        const firstRoot = resolve(fixture, 'first-src');
        const secondRoot = resolve(fixture, 'second-src');
        const linkedRoot = resolve(fixture, 'src');
        const logicalSource = resolve(linkedRoot, 'demo/value.ts');
        const started = resolve(fixture, 'started');
        const release = resolve(fixture, 'release');
        await mkdir(resolve(firstRoot, 'demo'), { recursive: true });
        await mkdir(resolve(secondRoot, 'demo'), { recursive: true });
        await Bun.write(resolve(firstRoot, 'demo/value.ts'), [
            `await Bun.write(${JSON.stringify(started)}, 'started');`,
            `while (!(await Bun.file(${JSON.stringify(release)}).exists())) await Bun.sleep(2);`,
            'export default async () => "first";',
            '',
        ].join('\n'));
        await Bun.write(resolve(secondRoot, 'demo/value.ts'), 'export default async () => "second";\n');
        await symlink(firstRoot, linkedRoot, 'dir');
        const entries = [{
            kind: 'fn', moduleDir: 'demo', runtimeName: 'value',
            root: 'src', rel: 'demo/value.ts', abs: logicalSource,
        }];
        const previous = async () => 'previous';
        const ctx = {
            state: {}, routes: {},
            fns: { project: { scan: async () => entries }, demo: { value: previous } },
        } as unknown as Context;

        try {
            const loading = loadFns(ctx);
            for (let attempt = 0; attempt < 100 && !(await Bun.file(started).exists()); attempt++) {
                await Bun.sleep(2);
            }
            expect(await Bun.file(started).exists()).toBe(true);
            await unlink(linkedRoot);
            await symlink(secondRoot, linkedRoot, 'dir');
            await Bun.write(release, 'release');

            await expect(loading).rejects.toThrow('src/demo/value.ts: source changed while loading');
            expect((ctx.fns as any).demo.value).toBe(previous);
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("preserves runtime procedure accessors across full-loader removal and restoration", async () => {
        const fixture = `.test-tmp/load-fns-accessor-${crypto.randomUUID()}`;
        const source = resolve(fixture, 'src/agent/run.ts');
        await mkdir(resolve(fixture, 'src/agent'), { recursive: true });
        await Bun.write(source, 'export default async () => "first";\n');
        let entries = [{
            kind: 'fn', moduleDir: 'agent', runtimeName: 'run',
            root: 'src', rel: 'agent/run.ts', abs: source,
        }];
        const ctx = {
            state: {}, routes: {},
            fns: { project: { scan: async () => entries } },
        } as unknown as Context;

        try {
            await loadFns(ctx);
            let implementation = (ctx.fns as any).agent.run;
            const wrapper = async (...args: any[]) => implementation(...args);
            Object.defineProperty(wrapper, Symbol.for('hyper-code2.function-source.wrapped-function'), {
                get: () => implementation,
            });
            Object.defineProperty((ctx.fns as any).agent, 'run', {
                configurable: true,
                enumerable: true,
                get: () => wrapper,
                set: (next: any) => { implementation = next; },
            });

            entries = [];
            await loadFns(ctx);
            expect((ctx.fns as any).agent.run).toBeUndefined();

            await Bun.write(source, 'export default async () => "restored";\n');
            entries = [{
                kind: 'fn', moduleDir: 'agent', runtimeName: 'run',
                root: 'src', rel: 'agent/run.ts', abs: source,
            }];
            await loadFns(ctx);

            expect((ctx.fns as any).agent.run).toBe(wrapper);
            expect(await (ctx.fns as any).agent.run()).toBe('restored');
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("restores a runtime wrapper after a procedure becomes and ceases to be a namespace", async () => {
        const fixture = `.test-tmp/load-fns-accessor-shape-${crypto.randomUUID()}`;
        const source = resolve(fixture, 'src/agent/run.ts');
        const child = resolve(fixture, 'src/agent/run/child.ts');
        await mkdir(resolve(fixture, 'src/agent'), { recursive: true });
        await Bun.write(source, 'export default async () => "first";\n');
        let entries: any[] = [{
            kind: 'fn', moduleDir: 'agent', runtimeName: 'run',
            root: 'src', rel: 'agent/run.ts', abs: source,
        }];
        const ctx = {
            state: {}, routes: {},
            fns: { project: { scan: async () => entries } },
        } as unknown as Context;

        try {
            await loadFns(ctx);
            let implementation = (ctx.fns as any).agent.run;
            const wrapper = async (...args: any[]) => implementation(...args);
            Object.defineProperty(wrapper, Symbol.for('hyper-code2.function-source.wrapped-function'), {
                get: () => implementation,
            });
            Object.defineProperty((ctx.fns as any).agent, 'run', {
                configurable: true,
                enumerable: true,
                get: () => wrapper,
                set: (next: any) => { implementation = next; },
            });

            await rm(source);
            await mkdir(resolve(fixture, 'src/agent/run'), { recursive: true });
            await Bun.write(child, 'export default async () => "child";\n');
            entries = [{
                kind: 'fn', moduleDir: 'agent/run', runtimeName: 'child',
                root: 'src', rel: 'agent/run/child.ts', abs: child,
            }];
            await loadFns(ctx);
            expect(await (ctx.fns as any).agent.run.child()).toBe('child');

            await rm(child);
            await rm(resolve(fixture, 'src/agent/run'), { recursive: true });
            await Bun.write(source, 'export default async () => "restored";\n');
            entries = [{
                kind: 'fn', moduleDir: 'agent', runtimeName: 'run',
                root: 'src', rel: 'agent/run.ts', abs: source,
            }];
            await loadFns(ctx);

            expect((ctx.fns as any).agent.run).toBe(wrapper);
            expect(await (ctx.fns as any).agent.run()).toBe('restored');
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("restores an accessor-backed implementation when a later setter rejects bootstrap publication", async () => {
        const fixture = `.test-tmp/load-fns-accessor-rollback-${crypto.randomUUID()}`;
        const sourceA = resolve(fixture, "src/demo/a.ts");
        const sourceB = resolve(fixture, "src/demo/b.ts");
        await mkdir(resolve(fixture, "src/demo"), { recursive: true });
        await Bun.write(sourceA, 'export default async () => "new-a";\n');
        await Bun.write(sourceB, 'export default async () => "new-b";\n');
        let entries = [
            { kind: "fn", moduleDir: "demo", runtimeName: "a", root: "src", rel: "demo/a.ts", abs: sourceA },
            { kind: "fn", moduleDir: "demo", runtimeName: "b", root: "src", rel: "demo/b.ts", abs: sourceB },
        ];
        let implementation = async () => "old-a";
        const wrapper = async () => implementation();
        Object.defineProperty(wrapper, Symbol.for("hyper-code2.function-source.wrapped-function"), {
            get: () => implementation,
        });
        const oldB = async () => "old-b";
        let implementationB = oldB;
        const wrapperB = async () => implementationB();
        Object.defineProperty(wrapperB, Symbol.for("hyper-code2.function-source.wrapped-function"), {
            get: () => implementationB,
        });
        const demo: any = {};
        Object.defineProperty(demo, "a", {
            configurable: true,
            get: () => wrapper,
            set: (next: any) => { implementation = next; },
        });
        Object.defineProperty(demo, "b", {
            configurable: true,
            get: () => wrapperB,
            set: (next: any) => {
                implementationB = next;
                if (next !== oldB) throw new Error("reject replacement");
            },
        });
        const ctx = {
            state: {}, routes: {},
            fns: { project: { scan: async () => entries }, demo },
        } as unknown as Context;

        try {
            await expect(loadFns(ctx)).rejects.toThrow("reject replacement");
            expect((ctx.fns as any).demo.a).toBe(wrapper);
            expect(await (ctx.fns as any).demo.a()).toBe("old-a");
            expect((ctx.fns as any).demo.b).toBe(wrapperB);
            expect((ctx.state as any).functionSources).toBeUndefined();
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("rejects an accessor that lacks a reversible wrapper identity during bootstrap publication", async () => {
        const fixture = `.test-tmp/load-fns-irreversible-accessor-${crypto.randomUUID()}`;
        const source = resolve(fixture, "src/demo/value.ts");
        await mkdir(resolve(fixture, "src/demo"), { recursive: true });
        await Bun.write(source, 'export default async () => "new";\n');
        const oldValue = async () => "old";
        const demo: any = {};
        Object.defineProperty(demo, "value", {
            configurable: true,
            get: () => oldValue,
            set: () => {},
        });
        const ctx = {
            state: {}, routes: {},
            fns: {
                project: {
                    scan: async () => [{
                        kind: "fn", moduleDir: "demo", runtimeName: "value",
                        root: "src", rel: "demo/value.ts", abs: source,
                    }],
                },
                demo,
            },
        } as unknown as Context;

        try {
            await expect(loadFns(ctx)).rejects.toThrow(
                "cannot publish demo.value: accessor is not reversible",
            );
            expect((ctx.fns as any).demo.value).toBe(oldValue);
            expect((ctx.state as any).functionSources).toBeUndefined();
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });
});
