import { test, expect, describe } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import load from "./load";
import roots from "../project/roots";
import scan from "../project/scan";
import describeSelf from "../self/describe";

const mkCtx = () => ({ fns: { project: { roots, scan } } }) as unknown as Context;

describe("repl.load", () => {
    test("loads a single function by dotted path", async () => {
        const ctx = mkCtx();
        const result = await load(ctx, { name: "db.connect" });
        expect(result).toEqual({ reloaded: "db.connect" });
        expect((ctx.fns as any).db.connect).toBeTypeOf("function");
    });

    test("loads all functions in a folder", async () => {
        const ctx = mkCtx();
        const result = await load(ctx, { name: "db" });
        expect(result.reloaded).toBe("db");
        expect(result.count).toBeGreaterThanOrEqual(2);
        expect(result.fns).toContain("connect");
        expect(result.fns).toContain("migrate");
    });

    test("throws on missing specific file", async () => {
        const ctx = mkCtx();
        await expect(load(ctx, { name: "db.doesNotExist" })).rejects.toThrow("no file for db/doesNotExist");
    });

    test("non-existent folder yields zero count (no throw)", async () => {
        const ctx = mkCtx();
        const result = await load(ctx, { name: "nonexistent" });
        expect(result).toEqual({ reloaded: "nonexistent", count: 0, fns: [] });
    });

    test("uses the later overlay root for duplicate functions", async () => {
        const fixture = `.test-tmp/repl-load-overlay-${crypto.randomUUID()}`;
        const srcDir = `${fixture}/src`;
        const overlayDir = `${fixture}/.hyper`;
        await mkdir(`${srcDir}/demo`, { recursive: true });
        await mkdir(`${overlayDir}/demo`, { recursive: true });
        await Bun.write(`${srcDir}/demo/value.ts`, `export default async function () { return "src"; }\n`);
        await Bun.write(`${overlayDir}/demo/value.ts`, `export default async function () { return "overlay"; }\n`);
        await Bun.write(`${srcDir}/demo/coreOnly.ts`, `export default async function () { return "core-only"; }\n`);
        await Bun.write(`${overlayDir}/demo/overlayOnly.ts`, `export default async function () { return "overlay-only"; }\n`);

        const entries = [
            { kind: "fn", moduleDir: "demo", runtimeName: "value" },
            { kind: "fn", moduleDir: "demo", runtimeName: "coreOnly" },
            { kind: "fn", moduleDir: "demo", runtimeName: "value" },
            { kind: "fn", moduleDir: "demo", runtimeName: "overlayOnly" },
        ];
        const ctx = {
            fns: {
                project: {
                    roots: async () => [
                        { name: "src", dir: `${process.cwd()}/${srcDir}` },
                        { name: ".hyper", dir: `${process.cwd()}/${overlayDir}` },
                    ],
                    scan: async () => entries,
                },
            },
        } as unknown as Context;

        try {
            await load(ctx, { name: "demo.value" });
            expect(await (ctx.fns as any).demo.value()).toBe("overlay");
            expect((ctx.state as any).functionSources['demo.value']).toMatchObject({
                root: '.hyper',
                rel: 'demo/value.ts',
                loadedHash: expect.stringMatching(/^[a-f0-9]{64}$/),
            });
            const identity = Symbol.for('hyper-code2.function-source.loaded-function');
            expect((ctx.state as any).functionSources['demo.value'][identity]).toBe((ctx.fns as any).demo.value);
            expect(Object.getOwnPropertyDescriptor(
                (ctx.state as any).functionSources['demo.value'],
                identity,
            )?.enumerable).toBe(false);

            const result = await load(ctx, { name: "demo" });
            expect(result).toEqual({
                reloaded: "demo",
                count: 3,
                fns: ["value", "coreOnly", "overlayOnly"],
            });
            expect(await (ctx.fns as any).demo.value()).toBe("overlay");
            expect(await (ctx.fns as any).demo.coreOnly()).toBe("core-only");
            expect(await (ctx.fns as any).demo.overlayOnly()).toBe("overlay-only");
            expect((ctx.state as any).functionSources['demo.value'].root).toBe('.hyper');
            expect((ctx.state as any).functionSources['demo.value'][identity]).toBe((ctx.fns as any).demo.value);
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("reloads changed bytes even when Date.now does not advance", async () => {
        const fixture = `.test-tmp/repl-load-nonce-${crypto.randomUUID()}`;
        const srcDir = resolve(fixture, "src");
        const source = resolve(srcDir, "demo/value.ts");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(source, `export default async function () { return "v1"; }\n`);

        const originalNow = Date.now;
        (Date as any).now = () => 1_700_000_000_000;
        const entry = {
            kind: "fn", moduleDir: "demo", runtimeName: "value",
            root: "src", rel: "demo/value.ts", abs: source,
        };
        const ctx = {
            env: {},
            state: {},
            routes: {},
            fns: {
                project: {
                    roots: async () => [{ name: "src", dir: srcDir }],
                    scan: async () => [entry],
                },
            },
        } as unknown as Context;

        try {
            await load(ctx, { name: "demo.value" });
            expect(await (ctx.fns as any).demo.value()).toBe("v1");

            await Bun.write(source, `export default async function () { return "v2"; }\n`);
            await load(ctx, { name: "demo.value" });
            expect(await (ctx.fns as any).demo.value()).toBe("v2");

            const capability = (await describeSelf(ctx)).capabilities.find(
                (item) => item.name === "demo.value",
            );
            expect(capability?.effectiveSource).toMatchObject({
                status: "observed",
                freshness: "fresh",
                currentHash: (ctx.state as any).functionSources["demo.value"].loadedHash,
            });
        } finally {
            Date.now = originalNow;
            await rm(fixture, { recursive: true, force: true });
        }
    });

    test("rejects a source rewrite during import and preserves the previous registry entry", async () => {
        const fixture = `.test-tmp/repl-load-race-${crypto.randomUUID()}`;
        const srcDir = resolve(fixture, "src");
        const source = resolve(srcDir, "demo/value.ts");
        const started = resolve(fixture, "started");
        await mkdir(resolve(srcDir, "demo"), { recursive: true });
        await Bun.write(source, delayedModule(started, "v1"));

        const previous = async () => "previous";
        const ctx = {
            state: {},
            fns: {
                project: {
                    roots: async () => [{ name: "src", dir: srcDir }],
                    scan: async () => [],
                },
                demo: { value: previous },
            },
        } as unknown as Context;

        try {
            const loading = load(ctx, { name: "demo.value" });
            await waitForFile(started);
            await Bun.write(source, `export default async function () { return "v2"; }\n`);

            await expect(loading).rejects.toThrow("src/demo/value.ts: source changed while loading");
            expect((ctx.fns as any).demo.value).toBe(previous);
            expect((ctx.state as any).functionSources?.["demo.value"]).toBeUndefined();
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });
});

function delayedModule(started: string, value: string) {
    return [
        `await Bun.write(${JSON.stringify(started)}, "started");`,
        `await Bun.sleep(100);`,
        `export default async function () { return ${JSON.stringify(value)}; }`,
        "",
    ].join("\n");
}

async function waitForFile(path: string) {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (await Bun.file(path).exists()) return;
        await Bun.sleep(5);
    }
    throw new Error(`timed out waiting for ${path}`);
}
