import { afterEach, describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

import { loadUc005Fns } from "./uc005-v2-bootstrap.ts";

const fixtureParent = resolve(".test-tmp");
const fixtureRoots: string[] = [];

afterEach(async () => {
  delete (globalThis as any).__uc005CheckoutOverlayLoaded;
  await Promise.all(fixtureRoots.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("UC-005 v2 registry bootstrap", () => {
  test("rejects a context whose registries were initialized before the root policy", async () => {
    const preloadedScan = async () => {
      (globalThis as any).__uc005CheckoutOverlayLoaded = true;
      return [];
    };
    const ctx: any = { state: {}, fns: { project: { scan: preloadedScan } } };

    await expect(loadUc005Fns(ctx, { repoRoot: "/unused", workspace: "/unused" }))
      .rejects.toThrow("UC005_V2_REGISTRY_MUST_BE_EMPTY");
    expect((globalThis as any).__uc005CheckoutOverlayLoaded).toBeUndefined();
  });

  test("loads committed src and disposable .hyper without importing the checkout overlay", async () => {
    await mkdir(fixtureParent, { recursive: true });
    const fixtureRoot = await mkdtemp(join(fixtureParent, "uc005-v2-bootstrap-"));
    fixtureRoots.push(fixtureRoot);
    const repoRoot = join(fixtureRoot, "checkout");
    const workspace = join(fixtureRoot, "workspace");

    await mkdir(join(repoRoot, "src/core"), { recursive: true });
    await mkdir(join(repoRoot, "src/db"), { recursive: true });
    await mkdir(join(repoRoot, "src/http"), { recursive: true });
    await mkdir(join(repoRoot, "src/project"), { recursive: true });
    await mkdir(join(repoRoot, "src/repl"), { recursive: true });
    await mkdir(join(repoRoot, ".hyper/malicious"), { recursive: true });
    await mkdir(join(repoRoot, ".hyper/db"), { recursive: true });
    await mkdir(join(workspace, ".hyper/db"), { recursive: true });
    await mkdir(join(workspace, ".hyper/extension"), { recursive: true });
    await Bun.write(join(repoRoot, "src/core/committed.ts"),
      'export default async function () { return "committed-src"; }\n');
    await Bun.write(join(repoRoot, "src/loadFns.ts"),
      'export default async function () { throw new Error("checkout bootstrap executed"); }\n');
    await Bun.write(join(repoRoot, "src/genTypes.ts"),
      'export default async function () { throw new Error("checkout type generator executed"); }\n');
    await Bun.write(join(repoRoot, "src/http/loadRoutes.ts"),
      'export default async function () { throw new Error("checkout route loader executed"); }\n');
    await Bun.write(join(repoRoot, "src/project/roots.ts"), `
export default async function () {
  return [
    { name: "src", dir: ${JSON.stringify(join(repoRoot, "src"))} },
    { name: ".hyper", dir: ${JSON.stringify(join(repoRoot, ".hyper"))} },
  ];
}
`);
    await Bun.write(join(repoRoot, "src/project/scan.ts"),
      "export default async function (ctx: any) { return ctx.fns.project.roots(ctx); }\n");
    await Bun.write(join(repoRoot, "src/project/classify.ts"), `
export default function (rel: string) {
  const parts = rel.split("/");
  const fileName = parts.pop()!;
  const moduleDir = parts.join("/") || ".";
  if (!fileName.endsWith(".ts") || fileName.endsWith(".test.ts")) {
    return { kind: "skip", rel, moduleDir, fileName, reason: "fixture-skip" };
  }
  const stem = fileName.slice(0, -3);
  return { kind: "fn", rel, moduleDir, fileName, runtimeName: stem.startsWith("$") ? stem.slice(1) : stem };
}
`);
    await Bun.write(join(repoRoot, "src/db/migrate.ts"),
      'export default async function () { throw new Error("checkout migration runner executed"); }\n');
    await Bun.write(join(repoRoot, "src/repl/load.ts"), `
export default async function (ctx: any, opts: { name: string }) {
  if (opts.name === "project.roots") {
    const loaded = (await import("../project/roots.ts?reload=" + crypto.randomUUID())).default;
    ctx.fns.project.roots = loaded;
    return;
  }
  const roots = await ctx.fns.project.roots(ctx);
  for (const root of [...roots].reverse()) {
    const path = root.dir + "/" + opts.name + "/reloaded.ts";
    if (!await Bun.file(path).exists()) continue;
    ctx.fns[opts.name] ??= {};
    ctx.fns[opts.name].reloaded = (await import(path + "?reload=" + crypto.randomUUID())).default;
    return;
  }
  throw new Error("fixture reload target missing");
}
`);
    await Bun.write(join(repoRoot, ".hyper/malicious/checkoutOnly.ts"), `
(globalThis as any).__uc005CheckoutOverlayLoaded = true;
export default async function () { return "checkout-overlay"; }
`);
    await Bun.write(join(workspace, ".hyper/extension/disposable.ts"),
      'export default async function () { return "disposable-overlay"; }\n');
    await Bun.write(join(repoRoot, "src/db/$migrate_20260814000000_committed.up.sql"),
      "CREATE TABLE committed_migration (id INTEGER PRIMARY KEY);\n");
    await Bun.write(join(repoRoot, ".hyper/db/$migrate_20260814000001_checkout.up.sql"),
      "CREATE TABLE checkout_overlay_migration (id INTEGER PRIMARY KEY);\n");
    await Bun.write(join(workspace, ".hyper/db/$migrate_20260814000002_disposable.up.sql"),
      "CREATE TABLE disposable_migration (id INTEGER PRIMARY KEY);\n");

    const ctx: any = { env: {}, state: {}, routes: {}, fns: {} };
    const roots = await loadUc005Fns(ctx, { repoRoot, workspace });

    expect(await ctx.fns.core.committed(ctx)).toBe("committed-src");
    expect(await ctx.fns.extension.disposable(ctx)).toBe("disposable-overlay");
    expect(ctx.fns.malicious).toBeUndefined();
    expect((globalThis as any).__uc005CheckoutOverlayLoaded).toBeUndefined();
    expect(await ctx.fns.project.roots(ctx)).toEqual(roots);
    const entries = await ctx.fns.project.scan(ctx);
    expect(entries.some((entry: any) => entry.rel === "malicious/checkoutOnly.ts")).toBe(false);
    expect(entries.every((entry: any) => roots.some((root) => entry.abs.startsWith(`${root.dir}/`)))).toBe(true);
    expect(roots).toEqual([
      { name: "src", dir: join(repoRoot, "src") },
      { name: ".hyper", dir: join(workspace, ".hyper") },
    ]);

    await expect(ctx.fns.repl.load(ctx, { name: "project.roots" }))
      .rejects.toThrow("UC005_V2_PROTECTED_RELOAD_TARGET");
    expect(await ctx.fns.project.roots(ctx)).toEqual(roots);
    expect((globalThis as any).__uc005CheckoutOverlayLoaded).toBeUndefined();

    const originalFns = ctx.fns;
    expect(() => { ctx.fns = { ...ctx.fns }; }).toThrow();
    expect(ctx.fns).toBe(originalFns);
    const clonedCtx = {
      ...ctx,
      fns: {
        ...ctx.fns,
        project: { ...ctx.fns.project },
        repl: { ...ctx.fns.repl },
        db: { ...ctx.fns.db },
      },
    };
    await expect(ctx.fns.repl.load(clonedCtx, { name: "project.roots" }))
      .rejects.toThrow("UC005_V2_CANONICAL_CONTEXT_REQUIRED");
    await expect(ctx.fns.project.scan(clonedCtx))
      .rejects.toThrow("UC005_V2_CANONICAL_CONTEXT_REQUIRED");
    await expect(ctx.loadFns(clonedCtx)).rejects.toThrow("UC005_V2_BOOTSTRAP_SURFACE_DISABLED");
    await expect(ctx.genTypes(clonedCtx)).rejects.toThrow("UC005_V2_BOOTSTRAP_SURFACE_DISABLED");
    await expect(ctx.fns.http.loadRoutes(clonedCtx)).rejects.toThrow("UC005_V2_BOOTSTRAP_SURFACE_DISABLED");
    const sourceIdentity = Symbol.for("hyper-code2.function-source.loaded-function");
    for (const name of [
      "loadFns",
      "genTypes",
      "project.roots",
      "project.scan",
      "repl.load",
      "db.migrate",
      "http.loadRoutes",
    ]) {
      expect(ctx.state.functionSources[name]).toBeUndefined();
      expect(ctx.state.functionSources[name]?.[sourceIdentity]).toBeUndefined();
    }
    expect((globalThis as any).__uc005CheckoutOverlayLoaded).toBeUndefined();

    await Bun.write(join(workspace, ".hyper/extension/reloaded.ts"),
      'export default async function () { return "reloaded-disposable-overlay"; }\n');
    await ctx.fns.repl.load(ctx, { name: "extension" });
    expect(await ctx.fns.extension.reloaded(ctx)).toBe("reloaded-disposable-overlay");

    const db = new Database(":memory:");
    ctx.state.db = db;
    await expect(ctx.fns.db.migrate(clonedCtx))
      .rejects.toThrow("UC005_V2_CANONICAL_CONTEXT_REQUIRED");
    const migrationResult = await ctx.fns.db.migrate(ctx);
    const tables = (db.query("SELECT name FROM sqlite_master WHERE type = 'table'").all() as Array<{ name: string }>)
      .map((row) => row.name);
    expect(migrationResult.applied).toEqual([
      "20260814000000_committed",
      "20260814000002_disposable",
    ]);
    expect(tables).toContain("committed_migration");
    expect(tables).toContain("disposable_migration");
    expect(tables).not.toContain("checkout_overlay_migration");
    db.close();
  });
});
