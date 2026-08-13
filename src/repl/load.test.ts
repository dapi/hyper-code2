import { test, expect, describe } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import load from "./load";
import roots from "../project/roots";
import scan from "../project/scan";

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

            const result = await load(ctx, { name: "demo" });
            expect(result).toEqual({
                reloaded: "demo",
                count: 3,
                fns: ["value", "coreOnly", "overlayOnly"],
            });
            expect(await (ctx.fns as any).demo.value()).toBe("overlay");
            expect(await (ctx.fns as any).demo.coreOnly()).toBe("core-only");
            expect(await (ctx.fns as any).demo.overlayOnly()).toBe("overlay-only");
        } finally {
            await rm(fixture, { recursive: true, force: true });
        }
    });
});
