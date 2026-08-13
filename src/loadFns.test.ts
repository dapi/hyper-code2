import { test, expect, describe } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import loadFns from "./loadFns";
import roots from "./project/roots";
import scan from "./project/scan";

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
        expect(receipt[identity]).toBe((ctx.fns as any).db.connect);
        expect(Object.getOwnPropertyDescriptor(receipt, identity)?.enumerable).toBe(false);
        expect(Object.getOwnPropertySymbols(JSON.parse(JSON.stringify(receipt)))).toEqual([]);
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
});
