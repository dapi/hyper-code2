import { describe, expect, test } from "bun:test";
import { mkdir, rm, symlink, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import load from "./load";
import invoke from "./invoke";

function fixtureCtx(entries: any[], srcDir: string) {
    return {
        state: {},
        fns: {
            project: {
                roots: async () => [{ name: "src", dir: srcDir }],
                scan: async () => entries,
            },
        },
    } as unknown as Context;
}

function entry(srcDir: string, runtimeName: string) {
    return {
        kind: "fn",
        moduleDir: "demo",
        runtimeName,
        root: "src",
        rel: `demo/${runtimeName}.ts`,
        abs: resolve(srcDir, "demo", `${runtimeName}.ts`),
    };
}

describe("generation-owned lifecycle", () => {
    test("forwards opts through the managed boundary and preserves runtime wrappers", async () => {
        const implementation = async (_ctx: Context, opts: any) => `value:${opts.value}`;
        let wrapperCalls = 0;
        const wrapper = async (ctx: Context, opts: any) => {
            wrapperCalls += 1;
            return implementation(ctx, opts);
        };
        Object.defineProperty(
            wrapper,
            Symbol.for("hyper-code2.function-source.wrapped-function"),
            { get: () => implementation },
        );
        const ctx = {
            state: {
                functionSources: { "demo.value": { generation: 1 } },
                functionLifecycle: {
                    active: { "demo.value": { generation: 1, fn: implementation } },
                    retired: {}, unavailable: {}, disposalErrors: [],
                },
            },
            fns: { demo: { value: wrapper } },
        } as unknown as Context;

        expect(await invoke(ctx, { name: "demo.value", opts: { value: "ok" } })).toBe("value:ok");
        expect(wrapperCalls).toBe(1);
        expect((ctx.state as any).functionLifecycle.active["demo.value"].leases).toBe(0);
    });

    test("adopts a validated legacy receipt before managed invocation", async () => {
        const implementation = async () => "legacy";
        const receipt: any = { generation: 7 };
        Object.defineProperty(receipt, Symbol.for("hyper-code2.function-source.loaded-function"), {
            value: implementation,
        });
        const ctx = {
            state: { functionSources: { "demo.value": receipt } },
            fns: { demo: { value: implementation } },
        } as unknown as Context;

        expect(await invoke(ctx, { name: "demo.value" })).toBe("legacy");
        expect((ctx.state as any).functionLifecycle.active["demo.value"]).toMatchObject({
            generation: 7,
            fn: implementation,
        });
    });

    test("resolves a managed root procedure from ctx", async () => {
        const implementation = async () => "root";
        const receipt: any = { generation: 3 };
        Object.defineProperty(receipt, Symbol.for("hyper-code2.function-source.loaded-function"), {
            value: implementation,
        });
        const ctx = {
            state: { functionSources: { rootProcedure: receipt } },
            fns: {},
            rootProcedure: implementation,
        } as unknown as Context;

        expect(await invoke(ctx, { name: "rootProcedure" })).toBe("root");
        expect((ctx.state as any).functionLifecycle.active.rootProcedure).toMatchObject({
            generation: 3,
            fn: implementation,
        });
    });

    test("seeds a legacy active record before replacing it", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-legacy-reload-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const disposed = resolve(fixture, "disposed");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(resolve(srcDir, "demo", "value.ts"), 'export default async () => "replacement";\n');
        const legacy = async () => "legacy";
        (legacy as any).dispose = async () => Bun.write(disposed, "disposed");
        const receipt: any = { generation: 7, root: "src", rel: "demo/value.ts" };
        Object.defineProperty(receipt, Symbol.for("hyper-code2.function-source.loaded-function"), {
            value: legacy,
        });
        const ctx = fixtureCtx([entry(srcDir, "value")], srcDir);
        (ctx.state as any).functionSources = { "demo.value": receipt };
        (ctx.fns as any).demo = { value: legacy };

        try {
            await load(ctx, { name: "demo.value" });
            expect((ctx.state as any).functionLifecycle.retired["demo.value@7"]).toMatchObject({ fn: legacy });
            expect(await Bun.file(disposed).text()).toBe("disposed");
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("seeds a legacy active record before removing a missing dotted procedure", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-legacy-remove-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const disposed = resolve(fixture, "disposed");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        const legacy = async () => "legacy";
        (legacy as any).dispose = async () => Bun.write(disposed, "disposed");
        const receipt: any = { generation: 7, root: "src", rel: "demo/value.ts" };
        Object.defineProperty(receipt, Symbol.for("hyper-code2.function-source.loaded-function"), {
            value: legacy,
        });
        const ctx = fixtureCtx([], srcDir);
        (ctx.state as any).functionSources = { "demo.value": receipt };
        (ctx.fns as any).demo = { value: legacy };

        try {
            await expect(load(ctx, { name: "demo.value" })).rejects.toThrow("no file for demo/value");
            expect((ctx.fns as any).demo.value).toBeUndefined();
            expect(await Bun.file(disposed).text()).toBe("disposed");
            expect((ctx.state as any).functionLifecycle.unavailable["demo.value"]).toMatchObject({
                reason: "no-current-candidate",
            });
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("stages a namespace before publishing and preserves the old set on import failure", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-atomic-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(resolve(srcDir, "demo", "a.ts"), `export default async () => "new-a";\n`);
        await Bun.write(resolve(srcDir, "demo", "b.ts"), `throw new Error("broken-b");\n`);
        const previousA = async () => "old-a";
        const previousB = async () => "old-b";
        const entries = [entry(srcDir, "a"), entry(srcDir, "b")];
        const ctx = fixtureCtx(entries, srcDir);
        (ctx.fns as any).demo = { a: previousA, b: previousB };

        try {
            await expect(load(ctx, { name: "demo" })).rejects.toThrow("broken-b");
            expect((ctx.fns as any).demo.a).toBe(previousA);
            expect((ctx.fns as any).demo.b).toBe(previousB);
            expect((ctx.state as any).functionSources).toBeUndefined();
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("disposes successfully staged implementations when a namespace reload aborts", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-staged-disposal-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const disposed = resolve(fixture, "disposed");
        const singletonKey = `__replLifecycleAbortedStaging_${crypto.randomUUID().replaceAll("-", "")}`;
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        const singletonSource = `export default globalThis[${JSON.stringify(singletonKey)}];\n`;
        const singleton = async () => "new-a";
        (singleton as any).dispose = async () => Bun.write(disposed, "disposed");
        (globalThis as any)[singletonKey] = singleton;
        await Bun.write(resolve(srcDir, "demo", "a.ts"), singletonSource);
        await Bun.write(resolve(srcDir, "demo", "b.ts"), 'throw new Error("broken-b");\n');
        const ctx = fixtureCtx([entry(srcDir, "a"), entry(srcDir, "b")], srcDir);
        (ctx.fns as any).demo = { a: async () => "old-a", b: async () => "old-b" };

        try {
            await expect(load(ctx, { name: "demo" })).rejects.toThrow("broken-b");
            expect(await Bun.file(disposed).text()).toBe("disposed");
            await Bun.write(resolve(srcDir, "demo", "b.ts"), 'export default async () => "new-b";\n');
            await expect(load(ctx, { name: "demo" })).rejects.toThrow(
                "function demo.a: retired identity cannot be reactivated",
            );
        } finally {
            delete (globalThis as any)[singletonKey];
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("disposes an implementation when its own post-import validation fails", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-stage-validation-disposal-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const source = resolve(srcDir, "demo", "value.ts");
        const disposed = resolve(fixture, "disposed");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(source, [
            'const fn = async () => "staged";',
            `fn.dispose = async () => Bun.write(${JSON.stringify(disposed)}, "disposed");`,
            `await Bun.write(${JSON.stringify(source)}, 'export default async () => "replacement";\\n');`,
            'export default fn;',
            '',
        ].join('\n'));
        const ctx = fixtureCtx([entry(srcDir, "value")], srcDir);

        try {
            await expect(load(ctx, { name: "demo.value" })).rejects.toThrow(
                "src/demo/value.ts: source changed while loading",
            );
            expect(await Bun.file(disposed).text()).toBe("disposed");
            expect((ctx.state as any).functionSources).toBeUndefined();
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("preserves lifecycle metadata when a later removal cannot be committed", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-removal-rollback-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const a = resolve(srcDir, "demo", "a.ts");
        const stale = resolve(srcDir, "demo", "stale.ts");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(a, 'export default async () => "old-a";\n');
        await Bun.write(stale, 'export default async () => "old-stale";\n');
        let entries = [entry(srcDir, "a"), entry(srcDir, "stale")];
        const ctx = fixtureCtx(entries, srcDir);

        try {
            await load(ctx, { name: "demo" });
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
            entries.splice(0, entries.length, entry(srcDir, "a"));

            await expect(load(ctx, { name: "demo" })).rejects.toThrow(
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

    test("restores receipts and lifecycle records when a later settings write rejects", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-metadata-rollback-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const source = resolve(srcDir, "demo", "value.ts");
        const stale = resolve(srcDir, "demo", "stale.ts");
        const setting = resolve(srcDir, "demo", "$setting_enabled.ts");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(source, 'export default async () => "old";\n');
        await Bun.write(stale, 'export default async () => "old-stale";\n');
        await Bun.write(setting, 'export default { type: "boolean" };\n');
        const entries: any[] = [entry(srcDir, "value"), entry(srcDir, "stale")];
        const ctx = fixtureCtx(entries, srcDir);

        try {
            await load(ctx, { name: "demo" });
            const oldFn = (ctx.fns as any).demo.value;
            const oldStale = (ctx.fns as any).demo.stale;
            const oldReceipt = (ctx.state as any).functionSources["demo.value"];
            const oldActive = (ctx.state as any).functionLifecycle.active["demo.value"];
            const registry = new Map<string, any>();
            registry.set = function (key, value) {
                Map.prototype.set.call(this, key, value);
                throw new Error("settings write rejected");
            };
            (ctx.state as any).settingsRegistry = registry;
            await Bun.write(source, 'export default async () => "new";\n');
            await rm(stale);
            entries.splice(0, entries.length, entry(srcDir, "value"), {
                kind: "setting", settingModule: "demo", settingKey: "enabled",
                root: "src", rel: "demo/$setting_enabled.ts", abs: setting,
            });

            await expect(load(ctx, { name: "demo" })).rejects.toThrow("settings write rejected");
            expect((ctx.fns as any).demo.value).toBe(oldFn);
            expect((ctx.fns as any).demo.stale).toBe(oldStale);
            expect((ctx.state as any).functionSources["demo.value"]).toBe(oldReceipt);
            expect((ctx.state as any).functionLifecycle.active["demo.value"]).toBe(oldActive);
            expect(registry.has("demo.enabled")).toBe(false);
            expect(await invoke(ctx, { name: "demo.value" })).toBe("old");
            expect(await invoke(ctx, { name: "demo.stale" })).toBe("old-stale");
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("preflights a namespace so an unwritable later member cannot partially publish", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-publication-preflight-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(resolve(srcDir, "demo", "a.ts"), 'export default async () => "new-a";\n');
        await Bun.write(resolve(srcDir, "demo", "b.ts"), 'export default async () => "new-b";\n');
        const oldA = async () => "old-a";
        const oldB = async () => "old-b";
        const ctx = fixtureCtx([entry(srcDir, "a"), entry(srcDir, "b")], srcDir);
        (ctx.fns as any).demo = Object.freeze({ a: oldA, b: oldB });

        try {
            await expect(load(ctx, { name: "demo" })).rejects.toThrow("cannot publish demo.a");
            expect((ctx.fns as any).demo.a).toBe(oldA);
            expect((ctx.fns as any).demo.b).toBe(oldB);
            expect((ctx.state as any).functionSources).toBeUndefined();
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("rolls back earlier assignments when a later namespace setter rejects publication", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-publication-rollback-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(resolve(srcDir, "demo", "a.ts"), 'export default async () => "new-a";\n');
        await Bun.write(resolve(srcDir, "demo", "b.ts"), 'export default async () => "new-b";\n');
        const oldA = async () => "old-a";
        const oldB = async () => "old-b";
        let implementationB = oldB;
        const wrapperB = async () => implementationB();
        Object.defineProperty(wrapperB, Symbol.for("hyper-code2.function-source.wrapped-function"), {
            get: () => implementationB,
        });
        const ctx = fixtureCtx([entry(srcDir, "a"), entry(srcDir, "b")], srcDir);
        const demo: any = { a: oldA };
        Object.defineProperty(demo, "b", {
            configurable: true,
            get: () => wrapperB,
            set: (next: any) => {
                implementationB = next;
                if (next !== oldB) throw new Error("reject replacement");
            },
        });
        (ctx.fns as any).demo = demo;

        try {
            await expect(load(ctx, { name: "demo" })).rejects.toThrow("reject replacement");
            expect((ctx.fns as any).demo.a).toBe(oldA);
            expect((ctx.fns as any).demo.b).toBe(wrapperB);
            expect((ctx.state as any).functionSources).toBeUndefined();
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("restores an accessor-backed implementation when a later setter rejects publication", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-accessor-rollback-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(resolve(srcDir, "demo", "a.ts"), 'export default async () => "new-a";\n');
        await Bun.write(resolve(srcDir, "demo", "b.ts"), 'export default async () => "new-b";\n');
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
        const ctx = fixtureCtx([entry(srcDir, "a"), entry(srcDir, "b")], srcDir);
        (ctx.fns as any).demo = demo;

        try {
            await expect(load(ctx, { name: "demo" })).rejects.toThrow("reject replacement");
            expect((ctx.fns as any).demo.a).toBe(wrapper);
            expect(await (ctx.fns as any).demo.a()).toBe("old-a");
            expect((ctx.fns as any).demo.b).toBe(wrapperB);
            expect((ctx.state as any).functionSources).toBeUndefined();
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("rejects an accessor that lacks a reversible wrapper identity", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-irreversible-accessor-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(resolve(srcDir, "demo", "value.ts"), 'export default async () => "new";\n');
        const oldValue = async () => "old";
        const demo: any = {};
        Object.defineProperty(demo, "value", {
            configurable: true,
            get: () => oldValue,
            set: () => {},
        });
        const ctx = fixtureCtx([entry(srcDir, "value")], srcDir);
        (ctx.fns as any).demo = demo;

        try {
            await expect(load(ctx, { name: "demo" })).rejects.toThrow(
                "cannot publish demo.value: accessor is not reversible",
            );
            expect((ctx.fns as any).demo.value).toBe(oldValue);
            expect((ctx.state as any).functionSources).toBeUndefined();
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("revalidates every staged source after a later top-level await", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-staged-race-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const sourceA = resolve(srcDir, "demo", "a.ts");
        const started = resolve(fixture, "b-started");
        const release = resolve(fixture, "release-b");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(sourceA, `export default async () => "new-a";\n`);
        await Bun.write(resolve(srcDir, "demo", "b.ts"), [
            `await Bun.write(${JSON.stringify(started)}, "started");`,
            `while (!(await Bun.file(${JSON.stringify(release)}).exists())) await Bun.sleep(2);`,
            'export default async () => "new-b";',
            '',
        ].join("\n"));
        const previousA = async () => "old-a";
        const previousB = async () => "old-b";
        const ctx = fixtureCtx([entry(srcDir, "a"), entry(srcDir, "b")], srcDir);
        (ctx.fns as any).demo = { a: previousA, b: previousB };

        try {
            const loading = load(ctx, { name: "demo" });
            await waitForFile(started);
            await Bun.write(sourceA, `export default async () => "changed-a";\n`);
            await Bun.write(release, "release");

            await expect(loading).rejects.toThrow("src/demo/a.ts: source changed while loading");
            expect((ctx.fns as any).demo.a).toBe(previousA);
            expect((ctx.fns as any).demo.b).toBe(previousB);
            expect((ctx.state as any).functionSources).toBeUndefined();
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("rechecks the complete source vector after one member validates early", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-source-vector-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const sourceA = resolve(srcDir, "demo", "a.ts");
        const rootsWaiting = resolve(fixture, "roots-waiting");
        let rootCalls = 0;
        let releaseRoots!: () => void;
        const rootsReleased = new Promise<void>((release) => { releaseRoots = release; });
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(sourceA, 'export default async () => "staged-a";\n');
        await Bun.write(resolve(srcDir, "demo", "b.ts"), 'export default async () => "staged-b";\n');
        const previousA = async () => "previous-a";
        const previousB = async () => "previous-b";
        const ctx = {
            state: {},
            fns: {
                project: {
                    roots: async () => {
                        rootCalls += 1;
                        // stage a, stage b, canonical roots, validate a,
                        // validate b: keep b pending after a has validated.
                        if (rootCalls === 5) {
                            await Bun.write(rootsWaiting, "waiting");
                            await rootsReleased;
                        }
                        return [{ name: "src", dir: srcDir }];
                    },
                    scan: async () => [entry(srcDir, "a"), entry(srcDir, "b")],
                },
                demo: { a: previousA, b: previousB },
            },
        } as unknown as Context;

        try {
            const loading = load(ctx, { name: "demo" });
            await waitForFile(rootsWaiting);
            await Bun.write(sourceA, 'export default async () => "rewritten-a";\n');
            releaseRoots();

            await expect(loading).rejects.toThrow("src/demo/a.ts: source changed while loading");
            expect((ctx.fns as any).demo.a).toBe(previousA);
            expect((ctx.fns as any).demo.b).toBe(previousB);
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("revalidates staged sources after the final namespace scan", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-final-scan-race-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const source = resolve(srcDir, "demo", "value.ts");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(source, 'export default async () => "staged";\n');
        const previous = async () => "previous";
        const entries = [entry(srcDir, "value")];
        let scanCount = 0;
        const ctx = {
            state: {},
            fns: {
                project: {
                    roots: async () => [{ name: "src", dir: srcDir }],
                    scan: async () => {
                        scanCount += 1;
                        if (scanCount === 2) {
                            await Bun.write(source, 'export default async () => "rewritten";\n');
                        }
                        return entries;
                    },
                },
                demo: { value: previous },
            },
        } as unknown as Context;

        try {
            await expect(load(ctx, { name: "demo" })).rejects.toThrow("src/demo/value.ts: source changed while loading");
            expect((ctx.fns as any).demo.value).toBe(previous);
            expect((ctx.state as any).functionSources).toBeUndefined();
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("stages settings until the namespace reload can publish atomically", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-settings-atomic-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const settingSource = resolve(srcDir, "demo", "$setting_mode.ts");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(settingSource, 'export default { type: "string", default: "new" };\n');
        await Bun.write(resolve(srcDir, "demo", "broken.ts"), 'throw new Error("broken-function");\n');
        const previous = { type: "string", default: "old" };
        const previousFn = async () => "old";
        const ctx = fixtureCtx([
            {
                kind: "setting", settingModule: "demo", settingKey: "mode",
                abs: settingSource,
            },
            entry(srcDir, "broken"),
        ], srcDir);
        (ctx.state as any).settingsRegistry = new Map([["demo.mode", previous]]);
        (ctx.fns as any).demo = { broken: previousFn };

        try {
            await expect(load(ctx, { name: "demo" })).rejects.toThrow("broken-function");
            expect((ctx.state as any).settingsRegistry.get("demo.mode")).toBe(previous);
            expect((ctx.fns as any).demo.broken).toBe(previousFn);
            expect((ctx.state as any).functionSources).toBeUndefined();
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("aborts a namespace reload when a staged setting disappears before commit", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-setting-membership-race-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const settingSource = resolve(srcDir, "demo", "$setting_mode.ts");
        const source = resolve(srcDir, "demo", "value.ts");
        const started = resolve(fixture, "started");
        const release = resolve(fixture, "release");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(settingSource, 'export default { type: "string", default: "staged" };\n');
        await Bun.write(source, [
            `await Bun.write(${JSON.stringify(started)}, "started");`,
            `while (!(await Bun.file(${JSON.stringify(release)}).exists())) await Bun.sleep(2);`,
            'export default async () => "staged";',
            '',
        ].join("\n"));
        const previous = { type: "string", default: "previous" };
        let entries: any[] = [
            { kind: "setting", settingModule: "demo", settingKey: "mode", root: "src", rel: "demo/$setting_mode.ts", abs: settingSource },
            entry(srcDir, "value"),
        ];
        const ctx = fixtureCtx(entries, srcDir);
        (ctx.state as any).settingsRegistry = new Map([["demo.mode", previous]]);
        (ctx.fns as any).project.scan = async () => entries;

        try {
            const loading = load(ctx, { name: "demo" });
            await waitForFile(started);
            entries = [entry(srcDir, "value")];
            await Bun.write(release, "release");

            await expect(loading).rejects.toThrow("namespace demo: membership changed while loading");
            expect((ctx.state as any).settingsRegistry.get("demo.mode")).toBe(previous);
        } finally {
            await Bun.write(release, "release");
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("aborts namespace publication when an absent member reappears before commit", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-membership-race-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const source = resolve(srcDir, "demo", "value.ts");
        const rootsWaiting = resolve(fixture, "roots-waiting");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(source, 'export default async () => "v1";\n');
        let entries = [entry(srcDir, "value")];
        let blockRoots = false;
        let releaseRoots!: () => void;
        const rootsReleased = new Promise<void>((resolveRelease) => { releaseRoots = resolveRelease; });
        const ctx = {
            state: {},
            fns: {
                project: {
                    roots: async () => {
                        if (blockRoots) {
                            await Bun.write(rootsWaiting, "waiting");
                            await rootsReleased;
                        }
                        return [{ name: "src", dir: srcDir }];
                    },
                    scan: async () => entries,
                },
            },
        } as unknown as Context;

        try {
            await load(ctx, { name: "demo" });
            const previous = (ctx.fns as any).demo.value;
            const receipt = (ctx.state as any).functionSources["demo.value"];

            await rm(source);
            entries = [];
            blockRoots = true;
            const loading = load(ctx, { name: "demo" });
            await waitForFile(rootsWaiting);
            await Bun.write(source, 'export default async () => "v2";\n');
            entries = [entry(srcDir, "value")];
            blockRoots = false;
            releaseRoots();

            await expect(loading).rejects.toThrow("namespace demo: membership changed while loading");
            expect((ctx.fns as any).demo.value).toBe(previous);
            expect((ctx.state as any).functionSources["demo.value"]).toBe(receipt);
            expect(await (ctx.fns as any).demo.value()).toBe("v1");
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("does not remove a member restored during staged validation", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-removal-validation-race-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const value = resolve(srcDir, "demo", "value.ts");
        const stale = resolve(srcDir, "demo", "stale.ts");
        const rootsWaiting = resolve(fixture, "roots-waiting");
        let entries = [entry(srcDir, "value"), entry(srcDir, "stale")];
        let rootCalls = 0;
        let blockValidation = false;
        let releaseRoots!: () => void;
        const rootsReleased = new Promise<void>((release) => { releaseRoots = release; });
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(value, 'export default async () => "value";\n');
        await Bun.write(stale, 'export default async () => "stale-v1";\n');
        const ctx = {
            state: {},
            fns: {
                project: {
                    roots: async () => {
                        rootCalls += 1;
                        // In the second reload: stage value, canonical roots,
                        // then validate value. Restore stale in that final step.
                        if (blockValidation && rootCalls === 3) {
                            await Bun.write(rootsWaiting, "waiting");
                            await rootsReleased;
                        }
                        return [{ name: "src", dir: srcDir }];
                    },
                    scan: async () => entries,
                },
            },
        } as unknown as Context;

        try {
            await load(ctx, { name: "demo" });
            const previousStale = (ctx.fns as any).demo.stale;
            const receipt = (ctx.state as any).functionSources["demo.stale"];

            await rm(stale);
            entries = [entry(srcDir, "value")];
            rootCalls = 0;
            blockValidation = true;
            const loading = load(ctx, { name: "demo" });
            await waitForFile(rootsWaiting);
            await Bun.write(stale, 'export default async () => "stale-v2";\n');
            entries = [entry(srcDir, "value"), entry(srcDir, "stale")];
            releaseRoots();

            await expect(loading).rejects.toThrow("namespace demo: membership changed while loading");
            expect((ctx.fns as any).demo.stale).toBe(previousStale);
            expect((ctx.state as any).functionSources["demo.stale"]).toBe(receipt);
            expect(await (ctx.fns as any).demo.stale()).toBe("stale-v1");
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("does not publish a staged source after its logical root remaps", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-logical-root-race-${crypto.randomUUID()}`);
        const firstSrc = resolve(fixture, "first", "src");
        const secondSrc = resolve(fixture, "second", "src");
        const linkedSrc = resolve(fixture, "active-src");
        const started = resolve(fixture, "started");
        const release = resolve(fixture, "release");
        const firstSource = resolve(firstSrc, "demo", "value.ts");
        await mkdir(resolve(firstSrc, "demo"), { recursive: true });
        await mkdir(resolve(secondSrc, "demo"), { recursive: true });
        await Bun.write(firstSource, [
            `await Bun.write(${JSON.stringify(started)}, "started");`,
            `while (!(await Bun.file(${JSON.stringify(release)}).exists())) await Bun.sleep(2);`,
            'export default async () => "first";',
            "",
        ].join("\n"));
        await Bun.write(resolve(secondSrc, "demo", "value.ts"), 'export default async () => "second";\n');
        await symlink(firstSrc, linkedSrc, "dir");
        const previous = async () => "previous";
        const ctx = fixtureCtx([entry(linkedSrc, "value")], linkedSrc);
        (ctx.fns as any).demo = { value: previous };

        try {
            const loading = load(ctx, { name: "demo.value" });
            await waitForFile(started);
            await unlink(linkedSrc);
            await symlink(secondSrc, linkedSrc, "dir");
            await Bun.write(release, "release");

            await expect(loading).rejects.toThrow("src/demo/value.ts: source changed while loading");
            expect((ctx.fns as any).demo.value).toBe(previous);
            expect((ctx.state as any).functionSources).toBeUndefined();
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("falls back to the base candidate and removes names with no candidate", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-fallback-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const overlayDir = resolve(fixture, ".hyper");
        const source = resolve(srcDir, "demo", "value.ts");
        const overlay = resolve(overlayDir, "demo", "value.ts");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await mkdir(resolve(overlayDir, "demo"), { recursive: true });
        await Bun.write(source, `export default async () => "base";\n`);
        await Bun.write(overlay, `export default async () => "overlay";\n`);
        let entries = [
            { ...entry(srcDir, "value"), root: "src", abs: source },
            { ...entry(overlayDir, "value"), root: ".hyper", abs: overlay },
        ];
        const ctx = {
            state: {},
            fns: {
                project: {
                    roots: async () => [
                        { name: "src", dir: srcDir },
                        { name: ".hyper", dir: overlayDir },
                    ],
                    scan: async () => entries,
                },
            },
        } as unknown as Context;

        try {
            await load(ctx, { name: "demo" });
            expect(await (ctx.fns as any).demo.value()).toBe("overlay");
            await Bun.write(overlay, `export default async () => "removed";\n`);
            await rm(overlay);
            entries = [{ ...entry(srcDir, "value"), root: "src", abs: source }];
            await load(ctx, { name: "demo" });
            expect(await (ctx.fns as any).demo.value()).toBe("base");

            await rm(source);
            entries = [];
            await load(ctx, { name: "demo" });
            expect((ctx.fns as any).demo.value).toBeUndefined();
            expect((ctx.state as any).functionLifecycle.unavailable["demo.value"]).toMatchObject({
                reason: "no-current-candidate",
            });
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("allows an undisposed singleton to fall back from an overlay", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-singleton-fallback-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const overlayDir = resolve(fixture, ".hyper");
        const source = resolve(srcDir, "demo", "value.ts");
        const overlay = resolve(overlayDir, "demo", "value.ts");
        const singletonKey = `__replLifecycleFallback_${crypto.randomUUID().replaceAll("-", "")}`;
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await mkdir(resolve(overlayDir, "demo"), { recursive: true });
        await Bun.write(source, `export default globalThis[${JSON.stringify(singletonKey)}];\n`);
        (globalThis as any)[singletonKey] = async () => "base";
        let entries = [{ ...entry(srcDir, "value"), root: "src", abs: source }];
        const ctx = {
            state: {},
            fns: {
                project: {
                    roots: async () => [
                        { name: "src", dir: srcDir },
                        { name: ".hyper", dir: overlayDir },
                    ],
                    scan: async () => entries,
                },
            },
        } as unknown as Context;

        try {
            await load(ctx, { name: "demo" });
            await Bun.write(overlay, 'export default async () => "overlay";\n');
            entries = [
                { ...entry(srcDir, "value"), root: "src", abs: source },
                { ...entry(overlayDir, "value"), root: ".hyper", abs: overlay },
            ];
            await load(ctx, { name: "demo" });
            expect(await (ctx.fns as any).demo.value()).toBe("overlay");

            await rm(overlay);
            entries = [{ ...entry(srcDir, "value"), root: "src", abs: source }];
            await load(ctx, { name: "demo" });
            expect(await (ctx.fns as any).demo.value()).toBe("base");
        } finally {
            delete (globalThis as any)[singletonKey];
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("marks a known dotted target unavailable when its final candidate is deleted", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-dotted-removal-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const source = resolve(srcDir, "demo", "value.ts");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(source, `export default async () => "v1";\n`);
        const ctx = fixtureCtx([entry(srcDir, "value")], srcDir);

        try {
            await load(ctx, { name: "demo.value" });
            await rm(source);
            await expect(load(ctx, { name: "demo.value" })).rejects.toThrow("no file for demo/value");
            expect((ctx.fns as any).demo.value).toBeUndefined();
            expect((ctx.state as any).functionSources["demo.value"]).toBeUndefined();
            expect((ctx.state as any).functionLifecycle.unavailable["demo.value"]).toMatchObject({
                reason: "no-current-candidate",
            });
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("preserves a dotted target when a candidate returns after a transient absence", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-dotted-absence-race-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const source = resolve(srcDir, "demo", "value.ts");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(source, 'export default async () => "v1";\n');
        let rootCalls = 0;
        let restoreCandidate = false;
        const ctx = {
            state: {},
            fns: {
                project: {
                    roots: async () => {
                        rootCalls += 1;
                        if (restoreCandidate && rootCalls === 2) {
                            await Bun.write(source, 'export default async () => "v2";\n');
                        }
                        return [{ name: "src", dir: srcDir }];
                    },
                    scan: async () => [entry(srcDir, "value")],
                },
            },
        } as unknown as Context;

        try {
            await load(ctx, { name: "demo.value" });
            const previous = (ctx.fns as any).demo.value;
            await rm(source);
            rootCalls = 0;
            restoreCandidate = true;

            await expect(load(ctx, { name: "demo.value" })).rejects.toThrow("no file for demo/value");
            expect((ctx.fns as any).demo.value).toBe(previous);
            expect((ctx.state as any).functionSources["demo.value"]).toBeDefined();
            expect(await (ctx.fns as any).demo.value()).toBe("v1");
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("reconciles an overlay-only removal after the overlay root appears", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-new-overlay-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const overlayDir = resolve(fixture, ".hyper");
        const base = resolve(srcDir, "demo", "base.ts");
        const overlayOnly = resolve(overlayDir, "demo", "overlayOnly.ts");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(base, `export default async () => "base";\n`);
        let roots = [{ name: "src", dir: srcDir }];
        let entries = [entry(srcDir, "base")];
        const ctx = {
            state: {},
            fns: {
                project: {
                    roots: async () => roots,
                    scan: async () => entries,
                },
            },
        } as unknown as Context;

        try {
            await load(ctx, { name: "demo" });
            await mkdir(resolve(overlayDir, "demo"), { recursive: true });
            await Bun.write(overlayOnly, `export default async () => "overlay";\n`);
            roots = [
                { name: "src", dir: srcDir },
                { name: ".hyper", dir: overlayDir },
            ];
            entries = [
                entry(srcDir, "base"),
                { ...entry(overlayDir, "overlayOnly"), root: ".hyper", abs: overlayOnly },
            ];
            await load(ctx, { name: "demo.overlayOnly" });
            expect(await (ctx.fns as any).demo.overlayOnly()).toBe("overlay");

            await rm(overlayOnly);
            entries = [entry(srcDir, "base")];
            await load(ctx, { name: "demo" });
            expect((ctx.fns as any).demo.overlayOnly).toBeUndefined();
            expect((ctx.state as any).functionSources["demo.overlayOnly"]).toBeUndefined();
            expect((ctx.state as any).functionLifecycle.unavailable["demo.overlayOnly"]).toMatchObject({
                reason: "no-current-candidate",
            });
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("reconciles receipts after an extension root disappears entirely", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-removed-root-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const overlayDir = resolve(fixture, ".hyper");
        const overlayOnly = resolve(overlayDir, "demo", "overlayOnly.ts");
        await mkdir(srcDir, { recursive: true });
        await mkdir(resolve(overlayDir, "demo"), { recursive: true });
        await Bun.write(overlayOnly, `export default async () => "overlay";\n`);
        let roots = [
            { name: "src", dir: srcDir },
            { name: ".hyper", dir: overlayDir },
        ];
        let entries = [{
            ...entry(overlayDir, "overlayOnly"), root: ".hyper", abs: overlayOnly,
        }];
        const ctx = {
            state: {},
            fns: { project: { roots: async () => roots, scan: async () => entries } },
        } as unknown as Context;

        try {
            await load(ctx, { name: "demo" });
            expect(await (ctx.fns as any).demo.overlayOnly()).toBe("overlay");

            await rm(overlayDir, { recursive: true, force: true });
            roots = [{ name: "src", dir: srcDir }];
            entries = [];
            await load(ctx, { name: "demo" });
            expect((ctx.fns as any).demo.overlayOnly).toBeUndefined();
            expect((ctx.state as any).functionSources["demo.overlayOnly"]).toBeUndefined();
            expect((ctx.state as any).functionLifecycle.unavailable["demo.overlayOnly"]).toMatchObject({
                reason: "no-current-candidate",
            });
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("relinquishes a symlinked overlay when its logical root disappears", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-removed-symlink-root-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const overlayTarget = resolve(fixture, "overlay-target");
        const overlayLink = resolve(fixture, ".hyper");
        const overlayOnly = resolve(overlayTarget, "demo", "overlayOnly.ts");
        await mkdir(srcDir, { recursive: true });
        await mkdir(resolve(overlayTarget, "demo"), { recursive: true });
        await Bun.write(overlayOnly, `export default async () => "overlay";\n`);
        await symlink(overlayTarget, overlayLink, "dir");
        let roots = [
            { name: "src", dir: srcDir },
            { name: ".hyper", dir: overlayLink },
        ];
        let entries = [{
            ...entry(overlayLink, "overlayOnly"), root: ".hyper", abs: resolve(overlayLink, "demo", "overlayOnly.ts"),
        }];
        const ctx = {
            state: {},
            fns: { project: { roots: async () => roots, scan: async () => entries } },
        } as unknown as Context;

        try {
            await load(ctx, { name: "demo" });
            expect(await (ctx.fns as any).demo.overlayOnly()).toBe("overlay");

            await unlink(overlayLink);
            roots = [{ name: "src", dir: srcDir }];
            entries = [];
            await load(ctx, { name: "demo" });

            expect((ctx.fns as any).demo.overlayOnly).toBeUndefined();
            expect((ctx.state as any).functionSources["demo.overlayOnly"]).toBeUndefined();
            expect((ctx.state as any).functionLifecycle.unavailable["demo.overlayOnly"]).toMatchObject({
                reason: "no-current-candidate",
            });
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("reconciles stale receipts when a logical root remaps", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-root-remap-${crypto.randomUUID()}`);
        const firstSrc = resolve(fixture, "first", "src");
        const secondSrc = resolve(fixture, "second", "src");
        const linkedSrc = resolve(fixture, "active-src");
        await mkdir(resolve(firstSrc, "demo"), { recursive: true });
        await mkdir(resolve(secondSrc, "demo"), { recursive: true });
        await Bun.write(resolve(firstSrc, "demo", "keep.ts"), `export default async () => "first";\n`);
        await Bun.write(resolve(firstSrc, "demo", "stale.ts"), `export default async () => "stale";\n`);
        await Bun.write(resolve(secondSrc, "demo", "keep.ts"), `export default async () => "second";\n`);
        await symlink(firstSrc, linkedSrc, "dir");
        let entries = [entry(firstSrc, "keep"), entry(firstSrc, "stale")];
        const ctx = {
            state: {},
            fns: {
                project: {
                    roots: async () => [{ name: "src", dir: linkedSrc }],
                    scan: async () => entries,
                },
            },
        } as unknown as Context;

        try {
            await load(ctx, { name: "demo" });
            expect(await (ctx.fns as any).demo.stale()).toBe("stale");

            await unlink(linkedSrc);
            await symlink(secondSrc, linkedSrc, "dir");
            entries = [entry(secondSrc, "keep")];
            await load(ctx, { name: "demo" });

            expect(await (ctx.fns as any).demo.keep()).toBe("second");
            expect((ctx.fns as any).demo.stale).toBeUndefined();
            expect((ctx.state as any).functionSources["demo.stale"]).toBeUndefined();
            expect((ctx.state as any).functionLifecycle.unavailable["demo.stale"]).toMatchObject({
                reason: "no-current-candidate",
            });
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("a parent namespace reload preserves loaded descendant procedures", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-nested-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const direct = resolve(srcDir, "foo", "direct.ts");
        const nested = resolve(srcDir, "foo", "child", "bar.ts");
        await mkdir(resolve(srcDir, "foo", "child"), { recursive: true });
        await Bun.write(direct, `export default async () => "direct";\n`);
        await Bun.write(nested, `export default async () => "nested";\n`);
        const entries = [
            {
                kind: "fn", moduleDir: "foo", runtimeName: "direct", root: "src",
                rel: "foo/direct.ts", abs: direct,
            },
            {
                kind: "fn", moduleDir: "foo/child", runtimeName: "bar", root: "src",
                rel: "foo/child/bar.ts", abs: nested,
            },
        ];
        const ctx = {
            state: {},
            fns: {
                project: {
                    roots: async () => [{ name: "src", dir: srcDir }],
                    scan: async () => entries,
                },
            },
        } as unknown as Context;

        try {
            await load(ctx, { name: "foo.child.bar" });
            const nestedFn = (ctx.fns as any).foo.child.bar;
            await load(ctx, { name: "foo" });
            expect((ctx.fns as any).foo.child.bar).toBe(nestedFn);
            expect(await (ctx.fns as any).foo.child.bar()).toBe("nested");
            expect((ctx.state as any).functionSources["foo.child.bar"]).toBeDefined();
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("reconciles a removed member in a slash-qualified nested namespace", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-nested-removal-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const nested = resolve(srcDir, "foo", "child", "bar.ts");
        await mkdir(resolve(srcDir, "foo", "child"), { recursive: true });
        await Bun.write(nested, 'export default async () => "nested";\n');
        let entries = [{
            kind: "fn", moduleDir: "foo/child", runtimeName: "bar", root: "src",
            rel: "foo/child/bar.ts", abs: nested,
        }];
        const ctx = {
            state: {},
            fns: {
                project: {
                    roots: async () => [{ name: "src", dir: srcDir }],
                    scan: async () => entries,
                },
            },
        } as unknown as Context;

        try {
            await load(ctx, { name: "foo/child" });
            await rm(nested);
            entries = [];
            await load(ctx, { name: "foo/child" });

            expect((ctx.fns as any).foo.child.bar).toBeUndefined();
            expect((ctx.state as any).functionSources["foo.child.bar"]).toBeUndefined();
            expect((ctx.state as any).functionLifecycle.unavailable["foo.child.bar"]).toMatchObject({
                reason: "no-current-candidate",
            });
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("keeps a retired generation alive until a managed invocation releases its lease", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-lease-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const started = resolve(fixture, "started");
        const release = resolve(fixture, "release");
        const disposed = resolve(fixture, "disposed");
        const source = resolve(srcDir, "demo", "value.ts");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        const writeModule = async (value: string) => Bun.write(source, [
            `await Bun.write(${JSON.stringify(started)}, "started");`,
            `const fn = async () => { while (!(await Bun.file(${JSON.stringify(release)}).exists())) await Bun.sleep(2); return ${JSON.stringify(value)}; };`,
            `fn.dispose = async () => Bun.write(${JSON.stringify(disposed)}, ${JSON.stringify(value)});`,
            "export default fn;",
            "",
        ].join("\n"));
        await writeModule("v1");
        const entries = [entry(srcDir, "value")];
        const ctx = fixtureCtx(entries, srcDir);

        try {
            await load(ctx, { name: "demo.value" });
            const running = invoke(ctx, { name: "demo.value" });
            await waitForFile(started);
            await writeModule("v2");
            await load(ctx, { name: "demo.value" });
            const retired = (ctx.state as any).functionLifecycle.retired;
            const old = Object.values(retired)[0] as any;
            expect(old.leases).toBe(1);
            expect(old.disposeStarted).toBe(false);
            expect(await Bun.file(disposed).exists()).toBe(false);

            await Bun.write(release, "release");
            expect(await running).toBe("v1");
            await waitForFile(disposed);
            expect(await Bun.file(disposed).text()).toBe("v1");
            expect((ctx.state as any).functionLifecycle.disposalErrors).toEqual([]);
            await waitFor(() => Object.keys((ctx.state as any).functionLifecycle.retired).length === 0);
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("does not dispose a shared identity while another name remains active", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-shared-identity-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const sourceA = resolve(srcDir, "demo", "a.ts");
        const sourceB = resolve(srcDir, "demo", "b.ts");
        const started = resolve(fixture, "started");
        const release = resolve(fixture, "release");
        const disposed = resolve(fixture, "disposed");
        const singletonKey = `__replLifecycleShared_${crypto.randomUUID().replaceAll("-", "")}`;
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        (globalThis as any)[singletonKey] = async () => {
            await Bun.write(started, "started");
            while (!(await Bun.file(release).exists())) await Bun.sleep(2);
            return "shared";
        };
        ((globalThis as any)[singletonKey] as any).dispose = async () => Bun.write(disposed, "disposed");
        const sharedExport = `export default globalThis[${JSON.stringify(singletonKey)}];\n`;
        await Bun.write(sourceA, sharedExport);
        await Bun.write(sourceB, sharedExport);
        const ctx = fixtureCtx([entry(srcDir, "a"), entry(srcDir, "b")], srcDir);

        try {
            await load(ctx, { name: "demo" });
            const running = invoke(ctx, { name: "demo.b" });
            await waitForFile(started);

            await Bun.write(sourceA, 'export default async () => "replacement-a";\n');
            await load(ctx, { name: "demo.a" });
            expect(await Bun.file(disposed).exists()).toBe(false);

            await Bun.write(release, "release");
            expect(await running).toBe("shared");
            await Bun.sleep(5);
            expect(await Bun.file(disposed).exists()).toBe(false);

            await Bun.write(sourceB, 'export default async () => "replacement-b";\n');
            await load(ctx, { name: "demo.b" });
            await waitForFile(disposed);
        } finally {
            delete (globalThis as any)[singletonKey];
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("preserves leases across a same-identity reload before a later replacement", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-same-identity-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const source = resolve(srcDir, "demo", "value.ts");
        const started = resolve(fixture, "started");
        const release = resolve(fixture, "release");
        const disposed = resolve(fixture, "disposed");
        const singletonKey = `__replLifecycleSingleton_${crypto.randomUUID().replaceAll("-", "")}`;
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        const stable = async () => {
            await Bun.write(started, "started");
            while (!(await Bun.file(release).exists())) await Bun.sleep(2);
            return "stable";
        };
        (stable as any).dispose = async () => Bun.write(disposed, "stable");
        (globalThis as any)[singletonKey] = stable;
        const sharedExport = (comment = "") => [
            comment,
            `export default globalThis[${JSON.stringify(singletonKey)}];`,
            "",
        ].join("\n");
        await Bun.write(source, sharedExport());
        const ctx = fixtureCtx([entry(srcDir, "value")], srcDir);

        try {
            await load(ctx, { name: "demo.value" });
            const active = (ctx.state as any).functionLifecycle.active["demo.value"];
            const running = invoke(ctx, { name: "demo.value" });
            await waitForFile(started);

            await Bun.write(source, sharedExport("// same singleton"));
            await load(ctx, { name: "demo.value" });
            expect((ctx.state as any).functionLifecycle.active["demo.value"]).toBe(active);
            expect((ctx.state as any).functionSources["demo.value"].generation).toBe(active.generation);

            await Bun.write(source, 'export default async () => "replacement";\n');
            await load(ctx, { name: "demo.value" });
            expect((ctx.state as any).functionLifecycle.retired[`demo.value@${active.generation}`]).toBe(active);
            expect(active.leases).toBe(1);
            expect(await Bun.file(disposed).exists()).toBe(false);

            await Bun.write(release, "release");
            expect(await running).toBe("stable");
            await waitForFile(disposed);
            expect(await Bun.file(disposed).text()).toBe("stable");
        } finally {
            delete (globalThis as any)[singletonKey];
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("rejects a retired singleton identity while its disposal is in progress", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-reactivation-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const source = resolve(srcDir, "demo", "value.ts");
        const disposeStarted = resolve(fixture, "dispose-started");
        const disposeRelease = resolve(fixture, "dispose-release");
        const singletonKey = `__replLifecycleReactivation_${crypto.randomUUID().replaceAll("-", "")}`;
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        const singleton = async () => "singleton";
        (singleton as any).dispose = async () => {
            await Bun.write(disposeStarted, "started");
            while (!(await Bun.file(disposeRelease).exists())) await Bun.sleep(2);
        };
        (globalThis as any)[singletonKey] = singleton;
        const singletonSource = `export default globalThis[${JSON.stringify(singletonKey)}];\n`;
        const ctx = fixtureCtx([entry(srcDir, "value")], srcDir);

        try {
            await Bun.write(source, singletonSource);
            await load(ctx, { name: "demo.value" });
            await Bun.write(source, 'export default async () => "replacement";\n');
            await load(ctx, { name: "demo.value" });
            await waitForFile(disposeStarted);

            await Bun.write(source, singletonSource);
            await expect(load(ctx, { name: "demo.value" })).rejects.toThrow(
                "function demo.value: retired identity cannot be reactivated",
            );
            expect(await (ctx.fns as any).demo.value()).toBe("replacement");
        } finally {
            await Bun.write(disposeRelease, "release");
            delete (globalThis as any)[singletonKey];
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("keeps a completed disposal identity blacklisted after a failed reload", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-completed-reactivation-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const source = resolve(srcDir, "demo", "value.ts");
        const disposed = resolve(fixture, "disposed");
        const singletonKey = `__replLifecycleCompleted_${crypto.randomUUID().replaceAll("-", "")}`;
        let disposeCalls = 0;
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        const singleton = async () => "singleton";
        (singleton as any).dispose = async () => {
            disposeCalls++;
            await Bun.write(disposed, "disposed");
        };
        (globalThis as any)[singletonKey] = singleton;
        const singletonSource = `export default globalThis[${JSON.stringify(singletonKey)}];\n`;
        const ctx = fixtureCtx([entry(srcDir, "value")], srcDir);

        try {
            await Bun.write(source, singletonSource);
            await load(ctx, { name: "demo.value" });
            await Bun.write(source, 'export default async () => "replacement";\n');
            await load(ctx, { name: "demo.value" });
            await waitForFile(disposed);
            await waitFor(() => !Object.values((ctx.state as any).functionLifecycle.retired)
                .some((record: any) => record.fn === singleton));

            await Bun.write(source, singletonSource);
            await expect(load(ctx, { name: "demo.value" })).rejects.toThrow(
                "function demo.value: retired identity cannot be reactivated",
            );
            await expect(load(ctx, { name: "demo.value" })).rejects.toThrow(
                "function demo.value: retired identity cannot be reactivated",
            );
            expect(disposeCalls).toBe(1);
            expect(await (ctx.fns as any).demo.value()).toBe("replacement");
        } finally {
            delete (globalThis as any)[singletonKey];
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("contains a throwing disposal accessor and releases its retired generation", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-dispose-getter-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const source = resolve(srcDir, "demo", "value.ts");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        const writeModule = async (value: string, throwingDispose = false) => Bun.write(source, [
            `const fn = async () => ${JSON.stringify(value)};`,
            ...(throwingDispose ? [
                'Object.defineProperty(fn, "dispose", { get() { throw new Error("dispose getter failed"); } });',
            ] : []),
            "export default fn;",
            "",
        ].join("\n"));
        await writeModule("v1", true);
        const ctx = fixtureCtx([entry(srcDir, "value")], srcDir);

        try {
            await load(ctx, { name: "demo.value" });
            await writeModule("v2");
            await expect(load(ctx, { name: "demo.value" })).resolves.toEqual({ reloaded: "demo.value" });

            await waitFor(() => (ctx.state as any).functionLifecycle.disposalErrors.length === 1);
            expect(await (ctx.fns as any).demo.value()).toBe("v2");
            expect((ctx.state as any).functionSources["demo.value"].generation).toBe(2);
            expect((ctx.state as any).functionLifecycle.active["demo.value"].fn)
                .toBe((ctx.fns as any).demo.value);
            expect((ctx.state as any).functionLifecycle.disposalErrors[0]).toMatchObject({
                message: "dispose getter failed",
            });
            await waitFor(() => Object.keys((ctx.state as any).functionLifecycle.retired).length === 0);
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("contains a throwing disposal accessor after a managed invocation releases its lease", async () => {
        const fixture = resolve(".test-tmp", `lifecycle-invoke-dispose-getter-${crypto.randomUUID()}`);
        const srcDir = resolve(fixture, "src");
        const source = resolve(srcDir, "demo", "value.ts");
        const started = resolve(fixture, "started");
        const release = resolve(fixture, "release");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(source, [
            `const fn = async () => { await Bun.write(${JSON.stringify(started)}, "started"); while (!(await Bun.file(${JSON.stringify(release)}).exists())) await Bun.sleep(2); return "v1"; };`,
            'Object.defineProperty(fn, "dispose", { get() { throw new Error("lease disposal getter failed"); } });',
            "export default fn;",
            "",
        ].join("\n"));
        const ctx = fixtureCtx([entry(srcDir, "value")], srcDir);

        try {
            await load(ctx, { name: "demo.value" });
            const running = invoke(ctx, { name: "demo.value" });
            await waitForFile(started);
            await Bun.write(source, 'export default async () => "v2";\n');
            await load(ctx, { name: "demo.value" });
            await Bun.write(release, "release");

            expect(await running).toBe("v1");
            await waitFor(() => (ctx.state as any).functionLifecycle.disposalErrors.length === 1);
            expect(await (ctx.fns as any).demo.value()).toBe("v2");
            expect((ctx.state as any).functionLifecycle.disposalErrors[0]).toMatchObject({
                message: "lease disposal getter failed",
            });
            await waitFor(() => Object.keys((ctx.state as any).functionLifecycle.retired).length === 0);
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("rejects inherited and unregistered functions at the managed boundary", async () => {
        const ctx = { state: {}, fns: {} } as unknown as Context;

        await expect(invoke(ctx, { name: "__proto__.constructor" })).rejects.toThrow(
            "function unavailable: __proto__.constructor",
        );
        expect((ctx.state as any).functionLifecycle).toBeUndefined();

        const unregistered = {
            state: { functionSources: { "demo.value": { generation: 1 } } },
            fns: { demo: { value: async () => "unregistered" } },
        } as unknown as Context;
        await expect(invoke(unregistered, { name: "demo.value" })).rejects.toThrow(
            "function unavailable: demo.value",
        );
        expect((unregistered.state as any).functionLifecycle.active).toEqual({});
    });
});

async function waitForFile(path: string) {
    for (let i = 0; i < 200; i++) {
        if (await Bun.file(path).exists()) return;
        await Bun.sleep(2);
    }
    throw new Error(`timed out waiting for ${path}`);
}

async function waitFor(condition: () => boolean) {
    for (let i = 0; i < 200; i++) {
        if (condition()) return;
        await Bun.sleep(2);
    }
    throw new Error("timed out waiting for condition");
}
