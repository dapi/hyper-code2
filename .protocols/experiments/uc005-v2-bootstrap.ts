import { Glob } from "bun";
import { realpath } from "node:fs/promises";
import { basename, resolve } from "node:path";

type Root = { name: "src" | ".hyper"; dir: string };

export async function loadUc005Fns(
  ctx: any,
  config: { repoRoot: string; workspace: string },
): Promise<Root[]> {
  const state = (ctx.state ??= {});
  if (Object.keys(ctx.fns ?? {}).length > 0
    || Object.hasOwn(state, "settingsRegistry")
    || Object.hasOwn(state, "functionSources")) {
    throw new Error("UC005_V2_REGISTRY_MUST_BE_EMPTY");
  }

  const roots: Root[] = await Promise.all([
    { name: "src" as const, dir: resolve(config.repoRoot, "src") },
    { name: ".hyper" as const, dir: resolve(config.workspace, ".hyper") },
  ].map(async (root) => ({ ...root, dir: await realpath(root.dir) })));
  const assertCanonicalContext = (innerCtx: any) => {
    if (innerCtx !== ctx) throw new Error("UC005_V2_CANONICAL_CONTEXT_REQUIRED");
  };
  const experimentRoots = async (innerCtx: any) => {
    assertCanonicalContext(innerCtx);
    return roots.map((root) => ({ ...root }));
  };

  // loadFns bootstraps project.scan by importing it directly. Seed the root
  // registry before that import so its first scan cannot see the checkout's
  // per-user .hyper overlay. Core project.roots is itself loaded during the
  // scan, so restore the experiment root policy before any later reload.
  ctx.fns = { project: { roots: experimentRoots } };
  const { default: loadFns } = await import("../../src/loadFns.ts");
  await loadFns(ctx);

  const classify = ctx.fns.project?.classify;
  if (typeof classify !== "function") throw new Error("UC005_V2_CLASSIFIER_REGISTRY_MISSING");
  const originalReload = ctx.fns.repl?.load;
  if (typeof originalReload !== "function") throw new Error("UC005_V2_RELOAD_REGISTRY_MISSING");
  const experimentScan = async (innerCtx: any) => {
    assertCanonicalContext(innerCtx);
    return scanRoots(roots, classify);
  };
  const experimentLoad = async (innerCtx: any, opts: { name: string }) => {
    assertCanonicalContext(innerCtx);
    const topLevel = opts?.name?.split(".")[0];
    if (!topLevel || ["project", "repl", "db"].includes(topLevel)) {
      throw new Error(`UC005_V2_PROTECTED_RELOAD_TARGET:${opts?.name ?? ""}`);
    }
    return originalReload(ctx, opts);
  };

  // Generated code may reload disposable capabilities, but registry discovery,
  // reload and migrations remain bound to this process's canonical context and
  // allowlisted roots. Pin the top-level registry so §eval cannot replace it
  // with a clone that recovers the checkout-anchored shipped implementations.
  Object.defineProperty(ctx.fns.project, "roots", {
    value: experimentRoots,
    enumerable: true,
    writable: false,
    configurable: false,
  });
  Object.defineProperty(ctx.fns.project, "scan", {
    value: experimentScan,
    enumerable: true,
    writable: false,
    configurable: false,
  });
  Object.freeze(ctx.fns.project);

  Object.defineProperty(ctx.fns.repl, "load", {
    value: experimentLoad,
    enumerable: true,
    writable: false,
    configurable: false,
  });
  Object.freeze(ctx.fns.repl);

  if (typeof ctx.fns.db?.migrate !== "function") {
    throw new Error("UC005_V2_MIGRATION_REGISTRY_MISSING");
  }
  Object.defineProperty(ctx.fns.db, "migrate", {
    value: async (innerCtx: any) => {
      assertCanonicalContext(innerCtx);
      return migrateFromRoots(ctx, roots);
    },
    enumerable: true,
    writable: false,
    configurable: false,
  });

  const disabledBootstrapSurface = async () => {
    throw new Error("UC005_V2_BOOTSTRAP_SURFACE_DISABLED");
  };
  for (const name of ["loadFns", "genTypes"]) {
    if (typeof ctx[name] !== "function") continue;
    Object.defineProperty(ctx, name, {
      value: disabledBootstrapSurface,
      enumerable: true,
      writable: false,
      configurable: false,
    });
  }
  if (typeof ctx.fns.http?.loadRoutes === "function") {
    Object.defineProperty(ctx.fns.http, "loadRoutes", {
      value: disabledBootstrapSurface,
      enumerable: true,
      writable: false,
      configurable: false,
    });
  }

  for (const name of ["project", "repl", "db"]) {
    Object.defineProperty(ctx.fns, name, {
      value: ctx.fns[name],
      enumerable: true,
      writable: false,
      configurable: false,
    });
  }
  Object.defineProperty(ctx, "fns", {
    value: ctx.fns,
    enumerable: true,
    writable: false,
    configurable: false,
  });

  // Loader receipts intentionally carry a non-enumerable function identity.
  // Remove the replaced infrastructure receipts so generated eval cannot use
  // Symbol.for(...) to recover the original checkout-anchored implementations.
  for (const name of [
    "loadFns",
    "genTypes",
    "project.roots",
    "project.scan",
    "repl.load",
    "db.migrate",
    "http.loadRoutes",
  ]) {
    delete state.functionSources?.[name];
  }

  return roots.map((root) => ({ ...root }));
}

const IGNORED_SEGMENT = /^(_runtime|_test_.*|_tmp_.*|tmp_.*)$/;

async function scanRoots(roots: Root[], classify: (rel: string) => any) {
  const entries: any[] = [];
  for (const root of roots) {
    const glob = new Glob("**/*");
    for await (const rel of glob.scan(root.dir)) {
      if (rel.split("/").some((segment) => IGNORED_SEGMENT.test(segment))) continue;
      entries.push({
        ...classify(rel),
        root: root.name,
        rootDir: root.dir,
        abs: resolve(root.dir, rel),
      });
    }
  }
  return entries;
}

async function migrateFromRoots(ctx: any, roots: Root[]): Promise<{ applied: string[] }> {
  const db = ctx.state?.db;
  if (!db) throw new Error("db not connected — call ctx.fns.db.connect first");

  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at INTEGER NOT NULL
  )`);
  const already = new Set(
    (db.query("SELECT name FROM _migrations").all() as any[]).map((row) => row.name),
  );
  const found: Array<{ name: string; path: string }> = [];
  for (const root of roots) {
    const exists = await Bun.file(root.dir).stat().then(() => true).catch(() => false);
    if (!exists) continue;
    const glob = new Glob("**/$migrate_*.up.sql");
    for await (const file of glob.scan(root.dir)) {
      const name = basename(file, ".up.sql").slice("$migrate_".length);
      if (name) found.push({ name, path: resolve(root.dir, file) });
    }
  }
  found.sort((left, right) => left.name.localeCompare(right.name));

  const applied: string[] = [];
  const insert = db.prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)");
  for (const migration of found) {
    if (already.has(migration.name)) continue;
    const migrationPath = await realpath(migration.path);
    if (!roots.some((root) => isWithin(root.dir, migrationPath))) {
      throw new Error("UC005_V2_MIGRATION_OUTSIDE_ROOT");
    }
    const sql = await Bun.file(migrationPath).text();
    db.transaction(() => {
      db.exec(sql);
      insert.run(migration.name, Date.now());
    })();
    applied.push(migration.name);
    console.log(`[migrate] applied ${migration.name}`);
  }
  return { applied };
}

function isWithin(root: string, path: string) {
  return path === root || path.startsWith(root.endsWith("/") ? root : `${root}/`);
}
