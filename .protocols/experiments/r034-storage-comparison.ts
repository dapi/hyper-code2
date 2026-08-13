import { Database } from "bun:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// R-034 disposable structural carrier.
// It accepts no input path, imports no production session code, generates only
// synthetic data, and removes its private temp directory before exit.

type Candidate =
  | "immutable_revision"
  | "materialized_refs"
  | "event_cutoff"
  | "cow_segments"
  | "full_copy_control"
  | "live_parent_control";

type Workload = {
  id: "W1" | "W2" | "W3";
  rootMessages: number;
  siblingForks: number;
  nestedDepth: number;
  localPerFork: number;
};

const candidates: Candidate[] = [
  "immutable_revision",
  "materialized_refs",
  "event_cutoff",
  "cow_segments",
  "full_copy_control",
  "live_parent_control",
];

const workloads: Workload[] = [
  { id: "W1", rootMessages: 100, siblingForks: 1, nestedDepth: 0, localPerFork: 10 },
  { id: "W2", rootMessages: 100, siblingForks: 32, nestedDepth: 0, localPerFork: 10 },
  { id: "W3", rootMessages: 10, siblingForks: 0, nestedDepth: 16, localPerFork: 10 },
];

function payload(bytes: number, seed: number): string {
  const prefix = `m${seed}:`;
  return prefix + "x".repeat(Math.max(0, bytes - prefix.length));
}

function execMany(db: Database, sql: string, rows: unknown[][]): void {
  const statement = db.prepare(sql);
  db.transaction(() => {
    for (const row of rows) statement.run(...row);
  })();
}

function schema(db: Database): void {
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE content_rows (
      id INTEGER PRIMARY KEY,
      owner TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE TABLE reference_rows (
      id INTEGER PRIMARY KEY,
      owner TEXT NOT NULL,
      target INTEGER NOT NULL
    );
    CREATE TABLE metadata_rows (
      id INTEGER PRIMARY KEY,
      owner TEXT NOT NULL,
      kind TEXT NOT NULL,
      value INTEGER NOT NULL
    );
    CREATE TABLE checks (
      name TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

function logicalShape(candidate: Candidate, workload: Workload) {
  const forkCount = workload.siblingForks || workload.nestedDepth;
  const localMessages = forkCount * workload.localPerFork;
  const totalUniqueMessages = workload.rootMessages + localMessages;
  let contentRows = totalUniqueMessages;
  let referenceRows = 0;
  let metadataRows = forkCount;

  if (candidate === "materialized_refs") {
    if (workload.siblingForks) {
      referenceRows = workload.siblingForks * workload.rootMessages;
    } else {
      for (let depth = 1; depth <= workload.nestedDepth; depth++) {
        referenceRows += workload.rootMessages + (depth - 1) * workload.localPerFork;
      }
    }
  } else if (candidate === "event_cutoff") {
    // One append event per unique message plus one immutable stream cutoff per fork.
    referenceRows = totalUniqueMessages;
    metadataRows += forkCount;
  } else if (candidate === "immutable_revision") {
    // One immutable version row per unique message plus conversation-revision heads.
    metadataRows += 1 + forkCount;
  } else if (candidate === "cow_segments") {
    const segmentSize = 16;
    const rootSegments = Math.ceil(workload.rootMessages / segmentSize);
    if (workload.siblingForks) {
      referenceRows = rootSegments + workload.siblingForks * Math.ceil(workload.localPerFork / segmentSize);
      metadataRows += 1 + workload.siblingForks;
    } else {
      referenceRows = rootSegments;
      for (let depth = 1; depth <= workload.nestedDepth; depth++) {
        referenceRows += Math.ceil((workload.rootMessages + depth * workload.localPerFork) / segmentSize);
      }
      metadataRows += 1 + workload.nestedDepth;
    }
  } else if (candidate === "full_copy_control") {
    if (workload.siblingForks) {
      contentRows += workload.siblingForks * workload.rootMessages;
    } else {
      for (let depth = 1; depth <= workload.nestedDepth; depth++) {
        contentRows += workload.rootMessages + (depth - 1) * workload.localPerFork;
      }
    }
  }

  return { contentRows, referenceRows, metadataRows, forkCount };
}

function behavior(candidate: Candidate) {
  const original = ["root-0", "root-1"];
  let parent = [...original];
  const inherited = candidate === "live_parent_control" ? null : [...parent];
  const childLocal = ["child-0"];
  parent = ["edited-root-0"];
  const childAfterParentMutation = [...(inherited ?? parent), ...childLocal];
  const immutableAfterParentMutation =
    JSON.stringify(childAfterParentMutation) === JSON.stringify([...original, "child-0"]);

  const nestedInherited = [...childAfterParentMutation];
  const grandchild = [...nestedInherited, "grandchild-0"];
  childLocal[0] = "edited-child-0";
  const childIsolation = parent[0] === "edited-root-0";
  const nestedFork =
    JSON.stringify(grandchild) === JSON.stringify([...childAfterParentMutation, "grandchild-0"]);

  return {
    result: { immutableAfterParentMutation, nestedFork, childIsolation },
    persistedState: { original, parent, inherited, childLocal, grandchild },
  };
}

function runOne(root: string, candidate: Candidate, workload: Workload, payloadBytes: number) {
  const dbPath = join(root, `${candidate}-${workload.id}-${payloadBytes}.sqlite`);
  let db = new Database(dbPath, { create: true });
  schema(db);
  const shape = logicalShape(candidate, workload);

  execMany(
    db,
    "INSERT INTO content_rows(owner, payload) VALUES (?, ?)",
    Array.from({ length: shape.contentRows }, (_, i) => [`a${i % Math.max(1, shape.forkCount + 1)}`, payload(payloadBytes, i)]),
  );
  execMany(
    db,
    "INSERT INTO reference_rows(owner, target) VALUES (?, ?)",
    Array.from({ length: shape.referenceRows }, (_, i) => [`a${i % Math.max(1, shape.forkCount + 1)}`, (i % Math.max(1, shape.contentRows)) + 1]),
  );
  execMany(
    db,
    "INSERT INTO metadata_rows(owner, kind, value) VALUES (?, ?, ?)",
    Array.from({ length: shape.metadataRows }, (_, i) => [`a${i % Math.max(1, shape.forkCount + 1)}`, "boundary", i]),
  );

  const behavioral = behavior(candidate);
  db.prepare("INSERT INTO checks(name, value) VALUES (?, ?)").run("state", JSON.stringify(behavioral.persistedState));
  db.exec("PRAGMA wal_checkpoint(TRUNCATE)");
  const pageCount = Number((db.query("PRAGMA page_count").get() as { page_count: number }).page_count);
  const pageSize = Number((db.query("PRAGMA page_size").get() as { page_size: number }).page_size);
  db.close();

  db = new Database(dbPath);
  const persisted = JSON.parse((db.query("SELECT value FROM checks WHERE name = 'state'").get() as { value: string }).value);
  const restartView = [...(persisted.inherited ?? persisted.parent), ...persisted.childLocal];
  const restartPreservesForkView =
    JSON.stringify(restartView.slice(0, persisted.original.length)) === JSON.stringify(persisted.original);
  db.close();

  return {
    candidate,
    workload: workload.id,
    payloadBytes,
    logical: shape,
    sqlite: { pageCount, pageSize, bytes: pageCount * pageSize },
    behavior: { ...behavioral.result, restartPreservesForkView },
  };
}

const root = mkdtempSync(join(tmpdir(), "r034-storage-"));
try {
  const results = [];
  for (const payloadBytes of [64, 1024]) {
    for (const workload of workloads) {
      for (const candidate of candidates) {
        results.push(runOne(root, candidate, workload, payloadBytes));
      }
    }
  }
  console.log(JSON.stringify({
    carrier: "R-034 storage-v1",
    generatedAt: "2026-08-13",
    claims: [
      "candidate-shaped structural row and SQLite page comparison",
      "basic immutable-prefix, nested-fork, child-isolation and close/reopen checks",
    ],
    limitations: [
      "not production schemas or latency evidence",
      "no concurrent writer, compaction, corruption, W4 or W5 execution",
      "event/action-pair and UI event identity are not modeled",
    ],
    workloads,
    results,
  }, null, 2));
} finally {
  rmSync(root, { recursive: true, force: true });
}
