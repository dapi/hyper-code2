import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { sentinelForms } from "../r018-sentinel-lib";
import { detectSerializedForms } from "../r032-v6_3-runtime/validator";

const repo = resolve(import.meta.dir, "../../..");
const freezeFile = resolve(import.meta.dir, "freeze.json");
const sha = (v: Uint8Array | string) =>
  createHash("sha256").update(v).digest("hex");
const MAX = 64 * 1024,
  DEADLINE = 4000;

async function outerGate(reviewFile?: string) {
  const freeze = JSON.parse(await readFile(freezeFile, "utf8"));
  assert.deepEqual(Object.keys(freeze).sort(), [
    "carrierArtifacts",
    "classification",
    "collection",
    "compiledBrokerSha256",
    "componentHashes",
    "componentReviews",
    "environment",
    "gateOrder",
    "head",
    "instrumentHashes",
    "limitations",
    "matrix",
    "operatorHomePath",
    "rejectedFreezeHistory",
    "schemaVersion",
    "sourcePaths",
    "sourceSetDigest",
    "version",
  ]);
  assert.equal(freeze.collection.authorized, false);
  assert.equal(await resolveHead(repo), freeze.head);
  const sourceEntries = [];
  for (const path of freeze.sourcePaths)
    sourceEntries.push({
      path,
      sha256: sha(await readFile(resolve(repo, path))),
    });
  assert.equal(
    sha(JSON.stringify(sourceEntries)),
    freeze.sourceSetDigest,
    "source set drift",
  );
  for (const group of ["instrumentHashes", "componentHashes"])
    for (const [path, digest] of Object.entries(freeze[group]))
      assert.equal(
        sha(await readFile(resolve(repo, path))),
        digest,
        `drift ${path}`,
      );
  const runDir = resolve(repo, freeze.collection.runDirectory);
  assert(
    runDir.startsWith(resolve(repo, ".protocols/experiments/runs/R-032") + "/"),
  );
  await assertAbsent(runDir);
  const freezeSha256 = sha(await readFile(freezeFile));
  let review = null;
  if (reviewFile) {
    review = JSON.parse(await readFile(reviewFile, "utf8"));
    assert.deepEqual(Object.keys(review).sort(), [
      "freezeSha256",
      "reviewId",
      "schemaVersion",
      "status",
    ]);
    assert.equal(review.schemaVersion, 1);
    assert.equal(review.status, "accepted-precollection");
    assert.equal(review.freezeSha256, freezeSha256);
    assert.match(review.reviewId, /^[A-Za-z0-9._-]+$/);
  }
  return {
    freeze,
    freezeSha256,
    review,
    statusReceipt: {
      method: "exact-relevant-path-hashes-no-subprocess",
      paths:
        freeze.sourcePaths.length +
        Object.keys(freeze.instrumentHashes).length +
        Object.keys(freeze.componentHashes).length,
    },
  };
}

function profile(root: string, binary: string, operatorHome: string) {
  const e = (v: string) => v.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  return `(version 1)\n(deny default)\n(allow sysctl-read)\n(allow file-read-metadata (require-not (subpath "${e(operatorHome)}")))\n(allow file-read-metadata (literal "${e(binary)}"))\n(allow file-read* (literal "/") (literal "${e(binary)}") (literal "/usr/lib/system/libsystem_sandbox.dylib") (subpath "/System/Volumes/Preboot/Cryptexes/OS") (literal "/dev/null") (literal "/dev/dtracehelper") (subpath "/private/var/db/timezone"))\n(allow file-write* (subpath "${e(root)}"))\n(allow process-exec (literal "${e(binary)}"))\n(deny network*)`;
}

class SandboxBroker {
  receipts: any[] = [];
  constructor(
    readonly binary: string,
    readonly root: string,
    readonly operatorHome: string,
    readonly outsideRead: string,
  ) {}
  async authorize(input: any) {
    const request = {
      candidate: input.candidate,
      caseId: input.caseId,
      phase: input.phase,
      principalLabel: input.state.principal ? "present" : "missing",
      scope: input.state.scope,
      generation: input.state.generation,
      expectedGeneration: input.state.expectedGeneration,
      expiresAt: input.state.expiresAt,
      now: input.state.now,
      revoked: input.state.revoked,
      replayed: input.state.replayed,
      brokerAvailable: input.state.brokerAvailable,
    };
    const wire = {
      schema: "r032-broker-request-v1",
      request,
      outsideWrite: resolve(dirname(this.outsideRead), "outside-write"),
      outsideRead: this.outsideRead,
      operatorHomePath: resolve(this.operatorHome, ".zshrc"),
      keychainPath: resolve(
        this.operatorHome,
        "Library/Keychains/login.keychain-db",
      ),
      selfExecutable: this.binary,
    };
    const childEnv = {
      PATH: "/usr/bin:/bin",
      HOME: resolve(this.root, "home"),
      TMPDIR: resolve(this.root, "tmp"),
      R032_V63_CHILD: "1",
    };
    const out = await bounded(
      [
        "/usr/bin/sandbox-exec",
        "-p",
        profile(this.root, this.binary, this.operatorHome),
        this.binary,
      ],
      { cwd: "/", env: childEnv, stdin: JSON.stringify(wire) },
      DEADLINE,
    );
    assert.equal(out.exitCode, 0, `broker stderr ${out.stderrSha}`);
    const parsed = JSON.parse(out.stdout);
    assert.deepEqual(
      Object.keys(parsed).sort(),
      parsed.rootReceipt
        ? ["containment", "response", "rootReceipt", "schema"]
        : ["containment", "response", "schema"],
    );
    assert.equal(parsed.schema, "r032-broker-response-v1");
    assert.deepEqual(Object.keys(parsed.containment).sort(), [
      "childCwd",
      "childEnvKeys",
      "passedBeforeRoot",
      "probes",
      "rootCalls",
      "schema",
    ]);
    assert.deepEqual(
      parsed.containment.childEnvKeys,
      Object.keys(childEnv).sort(),
    );
    assert.equal(parsed.containment.childCwd, "/");
    assert.equal(parsed.containment.passedBeforeRoot, true);
    this.receipts.push({
      schema: "r032-contained-broker-receipt-v1",
      candidate: input.candidate,
      caseId: input.caseId,
      phase: input.phase,
      profileSha256: sha(profile(this.root, this.binary, this.operatorHome)),
      stdoutBytes: out.stdoutBytes,
      stdoutSha256: out.stdoutSha,
      stderrBytes: out.stderrBytes,
      stderrSha256: out.stderrSha,
      ...parsed.containment,
    });
    const response = parsed.response;
    const exchange = {
      schema: "r032-broker-exchange-v1" as const,
      request,
      response,
      requestDigest: sha(JSON.stringify(request)),
      responseDigest: sha(JSON.stringify(response)),
      ...(parsed.rootReceipt ? { rootReceipt: parsed.rootReceipt } : {}),
    };
    return {
      allow: response.allow,
      reason: response.reason,
      rootReceipt: parsed.rootReceipt,
      rootCalls: parsed.rootReceipt ? 1 : 0,
      owner: "broker-transport" as const,
      exchange,
    };
  }
}

async function parentRun(gate: any, writeRun = false) {
  const {
    runRuntimeMatrix,
    detectorControlReceipts,
    validateDetectorControlReceipts,
    sanitizeRowsForCarrier,
  } = await import("../r032-v6_3-runtime/runtime");
  const { validateRuntimeRows } =
    await import("../r032-v6_3-runtime/validator");
  const root = await realpath(
    await mkdtemp(resolve(tmpdir(), "r032-v63-whole-")),
  );
  const build = await realpath(
    await mkdtemp(resolve(tmpdir(), "r032-v63-build-")),
  );
  const denied = await realpath(
    await mkdtemp(resolve(tmpdir(), "r032-v63-denied-")),
  );
  try {
    await mkdir(resolve(root, "home"));
    await mkdir(resolve(root, "tmp"));
    const outsideRead = resolve(denied, "outside-read");
    await writeFile(outsideRead, "synthetic");
    const binary = resolve(build, "broker-child");
    const buildReceipt = await bounded(
      [
        process.execPath,
        "build",
        "--compile",
        resolve(import.meta.dir, "broker-child.js"),
        "--outfile",
        binary,
      ],
      {
        cwd: repo,
        env: {
          PATH: "/usr/bin:/bin",
          HOME: resolve(root, "home"),
          TMPDIR: resolve(root, "tmp"),
          R032_V63_PARENT: "1",
        },
      },
      20000,
    );
    assert.equal(buildReceipt.exitCode, 0);
    assert.equal(sha(await readFile(binary)), gate.freeze.compiledBrokerSha256);
    await assertLogCaptureTamperNegatives(gate.freeze.operatorHomePath);
    const broker = new SandboxBroker(
      binary,
      root,
      gate.freeze.operatorHomePath,
      outsideRead,
    );
    const captured = await captureProductionLogs(
      () => runRuntimeMatrix(broker),
      gate.freeze.operatorHomePath,
    );
    const rows = captured.value;
    const logReceipt = captured.receipt;
    assert(logReceipt.count > 0);
    const validated = validateRuntimeRows(rows);
    const controls = detectorControlReceipts();
    validateDetectorControlReceipts(controls);
    const sanitized = sanitizeRowsForCarrier(validated);
    assert(
      broker.receipts.some((r) => r.candidate === "CAN-06") &&
        broker.receipts.some((r) => r.candidate === "COM-03"),
    );
    const approval = gate.review
      ? {
          schemaVersion: gate.review.schemaVersion,
          status: gate.review.status,
          reviewId: gate.review.reviewId,
          reviewPathLabel: "explicit-reviewed-file",
          reviewFileSha256: sha(
            await readFile(process.env.R032_V63_REVIEW_FILE!),
          ),
          freezeSha256: gate.review.freezeSha256,
        }
      : null;
    const containment = {
      schemaVersion: 1,
      brokerReceipts: broker.receipts,
      build: {
        binarySha256: gate.freeze.compiledBrokerSha256,
        stdoutBytes: buildReceipt.stdoutBytes,
        stdoutSha256: buildReceipt.stdoutSha,
        stderrBytes: buildReceipt.stderrBytes,
        stderrSha256: buildReceipt.stderrSha,
      },
    };
    const provenance = {
      schemaVersion: 1,
      head: gate.freeze.head,
      freezeSha256: gate.freezeSha256,
      approval,
      statusReceipt: gate.statusReceipt,
      environment: {
        keys: Object.keys(process.env).sort(),
        bun: process.versions.bun,
      },
      limitations: gate.freeze.limitations,
      productionLogs: logReceipt,
    };
    const manifest: any = {
      schemaVersion: 1,
      rows: 144,
      matrix: "9x16",
      validated: true,
      sanitizedSha256: sanitized.sha256,
      artifactList: gate.freeze.carrierArtifacts,
      approval,
    };
    const artifacts: any = {
      "results.json": sanitized.rows,
      "controls.json": controls,
      "containment.json": containment,
      "execution.json": {
        schemaVersion: 1,
        rows: 144,
        productionLogs: logReceipt,
      },
      "provenance.json": provenance,
      "manifest.json": manifest,
    };
    artifacts["row-hashes.json"] = sanitized.rows.map((row: any) => ({
      key: `${row.candidate}/${row.caseId}`,
      sha256: sha(JSON.stringify(row)),
    }));
    artifacts["summary.json"] = {
      schemaVersion: 1,
      rows: 144,
      candidates: 9,
      cases: 16,
      brokerReceipts: broker.receipts.length,
    };
    manifest.executionDigest = sha(
      JSON.stringify({
        rowHashes: artifacts["row-hashes.json"],
        containment,
        provenance,
        execution: artifacts["execution.json"],
        summary: artifacts["summary.json"],
      }),
    );
    manifest.containmentDigest = sha(JSON.stringify(containment));
    artifacts["manifest.json"] = manifest;
    manifest.bundleDigest = canonicalBundleDigest(artifacts);
    validateArtifacts(artifacts, gate.freeze, controls);
    assertArtifactTamperNegatives(artifacts, gate.freeze, controls);
    const finalBundle = await bundleArtifacts(artifacts);
    validateBundle(finalBundle, artifacts);
    if (writeRun) {
      const runDir = resolve(repo, gate.freeze.collection.runDirectory);
      await atomicWrite(runDir, finalBundle);
    }
    return {
      passed: true,
      rows: 144,
      brokerReceipts: broker.receipts.length,
      bundleDigest: finalBundle.digest,
      productionLogs: logReceipt,
    };
  } finally {
    await Promise.all([
      rm(root, { recursive: true, force: true }),
      rm(build, { recursive: true, force: true }),
      rm(denied, { recursive: true, force: true }),
    ]);
  }
}

type LogLevel = "log" | "warn" | "error";
type ProductionLogReceipt = {
  schemaVersion: 1;
  count: number;
  levels: Record<LogLevel, number>;
  bytes: number;
  sha256: string;
  rawIncluded: false;
};

function validateProductionLogReceipt(
  value: any,
): asserts value is ProductionLogReceipt {
  assert.deepEqual(Object.keys(value).sort(), [
    "bytes",
    "count",
    "levels",
    "rawIncluded",
    "schemaVersion",
    "sha256",
  ]);
  assert.deepEqual(Object.keys(value.levels).sort(), ["error", "log", "warn"]);
  assert.equal(value.schemaVersion, 1);
  assert.equal(value.rawIncluded, false);
  assert(Number.isSafeInteger(value.count) && value.count > 0);
  assert(
    Number.isSafeInteger(value.bytes) && value.bytes > 0 && value.bytes <= MAX,
  );
  for (const level of ["log", "warn", "error"] as const)
    assert(
      Number.isSafeInteger(value.levels[level]) && value.levels[level] >= 0,
    );
  assert.equal(
    value.count,
    value.levels.log + value.levels.warn + value.levels.error,
  );
  assert.match(value.sha256, /^[a-f0-9]{64}$/);
}

async function captureProductionLogs<T>(
  run: () => Promise<T>,
  operatorHome: string,
): Promise<{ value: T; receipt: ProductionLogReceipt }> {
  const original = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };
  const frames: string[] = [];
  const levels: Record<LogLevel, number> = { log: 0, warn: 0, error: 0 };
  let bytes = 0;
  const forbidden = [
    "R018-NONSECRET",
    operatorHome,
    "/Users/",
    ".ssh",
    "Keychains",
    "login.keychain",
  ];
  const encode = (value: unknown) => {
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };
  const capture =
    (level: LogLevel) =>
    (...args: unknown[]) => {
      const encodedArgs = args.map(encode);
      for (const encoded of encodedArgs)
        assert.deepEqual(
          detectSerializedForms(encoded, sentinelForms()),
          [],
          "governed R018 sentinel form in production log argument",
        );
      const raw = encodedArgs.join(" ");
      for (const token of forbidden)
        assert(
          !raw.includes(token),
          `forbidden production log token: ${token}`,
        );
      const frame =
        JSON.stringify({
          level,
          argumentCount: args.length,
          messageBytes: Buffer.byteLength(raw),
          messageSha256: sha(raw),
        }) + "\n";
      bytes += Buffer.byteLength(frame);
      assert(bytes <= MAX, "production log cap exceeded");
      frames.push(frame);
      levels[level]++;
    };
  console.log = capture("log");
  console.warn = capture("warn");
  console.error = capture("error");
  try {
    const value = await run();
    const receipt: ProductionLogReceipt = {
      schemaVersion: 1,
      count: frames.length,
      levels,
      bytes,
      sha256: sha(frames.join("")),
      rawIncluded: false,
    };
    validateProductionLogReceipt(receipt);
    return { value, receipt };
  } finally {
    console.log = original.log;
    console.warn = original.warn;
    console.error = original.error;
  }
}

async function assertLogCaptureTamperNegatives(operatorHome: string) {
  for (const form of sentinelForms())
    for (const value of form.values)
      await assert.rejects(
        captureProductionLogs(async () => console.log(value), operatorHome),
        /governed R018 sentinel form/,
      );
  await assert.rejects(
    captureProductionLogs(async () => console.warn(operatorHome), operatorHome),
    /forbidden production log token/,
  );
}

function exactKeys(value: any, keys: string[]) {
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort());
}
function hex(value: unknown) {
  assert.equal(typeof value, "string");
  assert.match(value as string, /^[a-f0-9]{64}$/);
}
function canonicalBundleDigest(a: any) {
  const copy = structuredClone(a);
  delete copy["manifest.json"].bundleDigest;
  return sha(
    Object.keys(copy)
      .sort()
      .map((name) => `${name}:${sha(JSON.stringify(copy[name]))}`)
      .join("\n"),
  );
}

function validateArtifacts(a: any, freeze: any, expectedControls: any) {
  assert.deepEqual(Object.keys(a).sort(), [
    "containment.json",
    "controls.json",
    "execution.json",
    "manifest.json",
    "provenance.json",
    "results.json",
    "row-hashes.json",
    "summary.json",
  ]);
  assert.deepEqual(Object.keys(a["summary.json"]).sort(), [
    "brokerReceipts",
    "candidates",
    "cases",
    "rows",
    "schemaVersion",
  ]);
  assert.equal(a["summary.json"].schemaVersion, 1);
  assert.equal(a["summary.json"].rows, 144);
  assert.equal(a["summary.json"].candidates, 9);
  assert.equal(a["summary.json"].cases, 16);
  assert.equal(
    a["summary.json"].brokerReceipts,
    a["containment.json"].brokerReceipts.length,
  );
  assert(Array.isArray(a["results.json"]));
  assert.equal(a["results.json"].length, 144);
  assert.equal(a["row-hashes.json"].length, 144);
  for (let i = 0; i < 144; i++) {
    const row = a["results.json"][i];
    const receipt = a["row-hashes.json"][i];
    exactKeys(receipt, ["key", "sha256"]);
    assert.equal(receipt.key, `${row.candidate}/${row.caseId}`);
    assert.equal(receipt.sha256, sha(JSON.stringify(row)));
  }
  assert.equal(new Set(a["row-hashes.json"].map((r: any) => r.key)).size, 144);
  assert.deepEqual(a["controls.json"], expectedControls);
  exactKeys(a["controls.json"], ["schema", "positives"]);
  assert.equal(a["controls.json"].schema, "r032-form-sink-controls-v1");
  assert(Array.isArray(a["controls.json"].positives));
  for (const control of a["controls.json"].positives) {
    exactKeys(control, [
      "detected",
      "form",
      "sinkId",
      "valueDigest",
      "variantIndex",
    ]);
    assert.equal(control.detected, true);
    hex(control.valueDigest);
  }
  assert.deepEqual(Object.keys(a["containment.json"]).sort(), [
    "brokerReceipts",
    "build",
    "schemaVersion",
  ]);
  assert.equal(a["containment.json"].schemaVersion, 1);
  const build = a["containment.json"].build;
  exactKeys(build, [
    "binarySha256",
    "stderrBytes",
    "stderrSha256",
    "stdoutBytes",
    "stdoutSha256",
  ]);
  assert.equal(build.binarySha256, freeze.compiledBrokerSha256);
  hex(build.binarySha256);
  hex(build.stderrSha256);
  hex(build.stdoutSha256);
  assert(
    Number.isSafeInteger(build.stderrBytes) &&
      build.stderrBytes >= 0 &&
      build.stderrBytes <= MAX,
  );
  assert(
    Number.isSafeInteger(build.stdoutBytes) &&
      build.stdoutBytes >= 0 &&
      build.stdoutBytes <= MAX,
  );
  assert(Array.isArray(a["containment.json"].brokerReceipts));
  assert(a["containment.json"].brokerReceipts.length > 0);
  for (const receipt of a["containment.json"].brokerReceipts) {
    exactKeys(receipt, [
      "candidate",
      "caseId",
      "childCwd",
      "childEnvKeys",
      "passedBeforeRoot",
      "phase",
      "probes",
      "profileSha256",
      "rootCalls",
      "schema",
      "stderrBytes",
      "stderrSha256",
      "stdoutBytes",
      "stdoutSha256",
    ]);
    assert.equal(receipt.schema, "r032-broker-containment-v1");
    assert(["CAN-06", "COM-03"].includes(receipt.candidate));
    assert(["enqueue", "use"].includes(receipt.phase));
    assert.equal(receipt.childCwd, "/");
    assert.deepEqual(receipt.childEnvKeys, [
      "HOME",
      "PATH",
      "R032_V63_CHILD",
      "TMPDIR",
    ]);
    assert.equal(receipt.passedBeforeRoot, true);
    assert([0, 1].includes(receipt.rootCalls));
    hex(receipt.profileSha256);
    hex(receipt.stderrSha256);
    hex(receipt.stdoutSha256);
    assert(receipt.stderrBytes >= 0 && receipt.stderrBytes <= MAX);
    assert(receipt.stdoutBytes > 0 && receipt.stdoutBytes <= MAX);
    exactKeys(receipt.probes, [
      "fork",
      "keychainRead",
      "networkBind",
      "networkOutbound",
      "nonBinaryExec",
      "operatorHomeRead",
      "outsideRead",
      "outsideWrite",
      "securityd",
      "securitydXpc",
    ]);
    for (const name of [
      "fork",
      "networkBind",
      "networkOutbound",
      "nonBinaryExec",
      "outsideRead",
      "outsideWrite",
    ]) {
      exactKeys(receipt.probes[name], ["behaviorSucceeded", "policyDenied"]);
      assert.equal(receipt.probes[name].policyDenied, true);
      assert.equal(receipt.probes[name].behaviorSucceeded, false);
    }
    for (const name of [
      "keychainRead",
      "operatorHomeRead",
      "securityd",
      "securitydXpc",
    ]) {
      exactKeys(receipt.probes[name], ["behaviorAttempted", "policyDenied"]);
      assert.equal(receipt.probes[name].policyDenied, true);
      assert.equal(receipt.probes[name].behaviorAttempted, false);
    }
  }
  assert.deepEqual(Object.keys(a["provenance.json"]).sort(), [
    "approval",
    "environment",
    "freezeSha256",
    "head",
    "limitations",
    "productionLogs",
    "schemaVersion",
    "statusReceipt",
  ]);
  assert.deepEqual(Object.keys(a["execution.json"]).sort(), [
    "productionLogs",
    "rows",
    "schemaVersion",
  ]);
  assert.equal(a["execution.json"].schemaVersion, 1);
  assert.equal(a["execution.json"].rows, 144);
  validateProductionLogReceipt(a["execution.json"].productionLogs);
  validateProductionLogReceipt(a["provenance.json"].productionLogs);
  assert.deepEqual(
    a["execution.json"].productionLogs,
    a["provenance.json"].productionLogs,
  );
  const provenance = a["provenance.json"];
  assert.equal(provenance.schemaVersion, 1);
  assert.equal(provenance.head, freeze.head);
  hex(provenance.freezeSha256);
  assert.deepEqual(provenance.limitations, freeze.limitations);
  exactKeys(provenance.statusReceipt, ["method", "paths"]);
  assert.equal(
    provenance.statusReceipt.method,
    "exact-relevant-path-hashes-no-subprocess",
  );
  assert.equal(
    provenance.statusReceipt.paths,
    freeze.sourcePaths.length +
      Object.keys(freeze.instrumentHashes).length +
      Object.keys(freeze.componentHashes).length,
  );
  exactKeys(provenance.environment, ["bun", "keys"]);
  assert.equal(typeof provenance.environment.bun, "string");
  assert.deepEqual(
    provenance.environment.keys,
    provenance.approval
      ? [
          "HOME",
          "PATH",
          "R032_V63_PARENT",
          "R032_V63_RECEIPT_FILE",
          "R032_V63_REVIEW_FILE",
          "TMPDIR",
        ]
      : ["HOME", "PATH", "R032_V63_PARENT", "R032_V63_RECEIPT_FILE", "TMPDIR"],
  );
  if (provenance.approval === null)
    assert.equal(a["manifest.json"].approval, null);
  else {
    exactKeys(provenance.approval, [
      "freezeSha256",
      "reviewFileSha256",
      "reviewId",
      "reviewPathLabel",
      "schemaVersion",
      "status",
    ]);
    assert.equal(provenance.approval.schemaVersion, 1);
    assert.equal(provenance.approval.status, "accepted-precollection");
    hex(provenance.approval.freezeSha256);
    hex(provenance.approval.reviewFileSha256);
    assert.deepEqual(a["manifest.json"].approval, provenance.approval);
  }
  const manifest = a["manifest.json"];
  exactKeys(manifest, [
    "approval",
    "artifactList",
    "bundleDigest",
    "containmentDigest",
    "executionDigest",
    "matrix",
    "rows",
    "sanitizedSha256",
    "schemaVersion",
    "validated",
  ]);
  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.rows, 144);
  assert.equal(manifest.matrix, "9x16");
  assert.equal(manifest.validated, true);
  assert.deepEqual(
    [...manifest.artifactList].sort(),
    [...freeze.carrierArtifacts].sort(),
  );
  assert.deepEqual(
    [...manifest.artifactList].sort(),
    [...Object.keys(a), "SHA256SUMS"].sort(),
  );
  assert.equal(
    manifest.sanitizedSha256,
    sha(JSON.stringify(a["results.json"]) + "\n"),
  );
  assert.equal(
    manifest.containmentDigest,
    sha(JSON.stringify(a["containment.json"])),
  );
  assert.equal(
    manifest.executionDigest,
    sha(
      JSON.stringify({
        rowHashes: a["row-hashes.json"],
        containment: a["containment.json"],
        provenance: a["provenance.json"],
        execution: a["execution.json"],
        summary: a["summary.json"],
      }),
    ),
  );
  assert.equal(manifest.bundleDigest, canonicalBundleDigest(a));
}

function assertArtifactTamperNegatives(a: any, freeze: any, controls: any) {
  const cases = [
    (x: any) => {
      x["row-hashes.json"][0].sha256 = "0".repeat(64);
    },
    (x: any) => {
      x[
        "containment.json"
      ].brokerReceipts[0].probes.networkOutbound.policyDenied = false;
    },
    (x: any) => {
      x["execution.json"].productionLogs.count++;
    },
    (x: any) => {
      x["manifest.json"].bundleDigest = "0".repeat(64);
    },
    (x: any) => {
      x["controls.json"].positives[0].detected = false;
    },
  ];
  for (const mutate of cases) {
    const copy = structuredClone(a);
    mutate(copy);
    assert.throws(() => validateArtifacts(copy, freeze, controls));
  }
}

async function bundleArtifacts(artifacts: any) {
  const files: any = {};
  for (const [name, value] of Object.entries(artifacts))
    files[name] = JSON.stringify(value, null, 2) + "\n";
  const sums =
    Object.keys(files)
      .sort()
      .map((name) => `${sha(files[name])}  ${name}`)
      .join("\n") + "\n";
  files.SHA256SUMS = sums;
  return {
    files,
    digest: canonicalBundleDigest(artifacts),
  };
}
function validateBundle(bundle: any, artifacts: any) {
  exactKeys(bundle, ["digest", "files"]);
  assert.equal(bundle.digest, artifacts["manifest.json"].bundleDigest);
  assert.deepEqual(
    Object.keys(bundle.files).sort(),
    [...Object.keys(artifacts), "SHA256SUMS"].sort(),
  );
  const expected =
    Object.keys(artifacts)
      .sort()
      .map((name) => `${sha(bundle.files[name])}  ${name}`)
      .join("\n") + "\n";
  assert.equal(bundle.files.SHA256SUMS, expected);
  for (const name of Object.keys(artifacts))
    assert.equal(
      bundle.files[name],
      JSON.stringify(artifacts[name], null, 2) + "\n",
    );
}
async function atomicWrite(runDir: string, bundle: any) {
  const canonicalRoot = resolve(repo, ".protocols/experiments/runs/R-032");
  assert.equal(dirname(runDir), canonicalRoot);
  await assertAbsent(runDir);
  const stage = await mkdtemp(resolve(canonicalRoot, ".r032-v63-stage-"));
  try {
    for (const [name, bytes] of Object.entries(bundle.files))
      await writeFile(resolve(stage, name), bytes as string, { flag: "wx" });
    await assertAbsent(runDir);
    await rename(stage, runDir);
  } catch (e) {
    await rm(stage, { recursive: true, force: true });
    throw e;
  }
}
async function assertAbsent(path: string) {
  try {
    await lstat(path);
    assert.fail(`target exists: ${path}`);
  } catch (e: any) {
    assert.equal(e?.code, "ENOENT");
  }
}
async function bounded(argv: string[], o: any, deadline: number) {
  const p = Bun.spawn(argv, {
    cwd: o.cwd,
    env: o.env,
    stdin: o.stdin ? "pipe" : "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });
  if (o.stdin) {
    p.stdin.write(o.stdin);
    p.stdin.end();
  }
  let timeout = false;
  const t = setTimeout(() => {
    timeout = true;
    p.kill("SIGKILL");
  }, deadline);
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
    p.exited,
  ]);
  clearTimeout(t);
  assert(!timeout);
  const stdoutBytes = Buffer.byteLength(stdout),
    stderrBytes = Buffer.byteLength(stderr);
  assert(stdoutBytes <= MAX && stderrBytes <= MAX);
  return {
    stdout,
    stdoutBytes,
    stdoutSha: sha(stdout),
    stderrBytes,
    stderrSha: sha(stderr),
    exitCode,
  };
}
async function resolveHead(worktree: string) {
  const dot = resolve(worktree, ".git");
  const s = await Bun.file(dot).stat();
  const gd = s.isDirectory()
    ? dot
    : resolve(worktree, (await readFile(dot, "utf8")).trim().slice(8));
  const h = (await readFile(resolve(gd, "HEAD"), "utf8")).trim();
  if (!h.startsWith("ref: ")) return h;
  const ref = h.slice(5);
  const common = (await Bun.file(resolve(gd, "commondir")).exists())
    ? resolve(gd, (await readFile(resolve(gd, "commondir"), "utf8")).trim())
    : gd;
  for (const base of [gd, common])
    try {
      return (await readFile(resolve(base, ref), "utf8")).trim();
    } catch {}
  const packed = await readFile(resolve(common, "packed-refs"), "utf8");
  return packed
    .split("\n")
    .find((x) => x.endsWith(` ${ref}`))
    ?.split(" ")[0];
}

if (import.meta.main) {
  const mode = process.argv[2] ?? "--self-test";
  const reviewArg =
    mode === "--collect"
      ? process.argv[3]
      : mode === "--parent-collect"
        ? process.env.R032_V63_REVIEW_FILE
        : undefined;
  const gate = await outerGate(reviewArg);
  if (mode === "--parent-self-test" || mode === "--parent-collect") {
    assert.equal(process.env.R032_V63_PARENT, "1");
    assert.deepEqual(
      Object.keys(process.env).sort(),
      mode === "--parent-collect"
        ? [
            "HOME",
            "PATH",
            "R032_V63_PARENT",
            "R032_V63_RECEIPT_FILE",
            "R032_V63_REVIEW_FILE",
            "TMPDIR",
          ]
        : [
            "HOME",
            "PATH",
            "R032_V63_PARENT",
            "R032_V63_RECEIPT_FILE",
            "TMPDIR",
          ],
    );
    const receiptFile = process.env.R032_V63_RECEIPT_FILE;
    assert(receiptFile && receiptFile.startsWith(process.env.TMPDIR!));
    const result = await parentRun(gate, mode === "--parent-collect");
    await writeFile(
      receiptFile,
      JSON.stringify({ schema: "r032-v63-parent-receipt-v1", ...result }) +
        "\n",
      { flag: "wx" },
    );
  } else {
    if (mode === "--collect") assert(gate.review);
    const launch = await realpath(
      await mkdtemp(resolve(tmpdir(), "r032-v63-launch-")),
    );
    try {
      await mkdir(resolve(launch, "home"));
      await mkdir(resolve(launch, "tmp"));
      const receiptFile = resolve(launch, "tmp", "parent-receipt.json");
      const env: any = {
        PATH: "/usr/bin:/bin",
        HOME: resolve(launch, "home"),
        TMPDIR: resolve(launch, "tmp"),
        R032_V63_PARENT: "1",
        R032_V63_RECEIPT_FILE: receiptFile,
      };
      if (mode === "--collect")
        env.R032_V63_REVIEW_FILE = await realpath(process.argv[3]!);
      const child = await bounded(
        [
          process.execPath,
          import.meta.path,
          mode === "--collect" ? "--parent-collect" : "--parent-self-test",
        ],
        { cwd: repo, env },
        30000,
      );
      assert.equal(child.exitCode, 0);
      const result = JSON.parse(await readFile(receiptFile, "utf8"));
      assert.deepEqual(Object.keys(result).sort(), [
        "brokerReceipts",
        "bundleDigest",
        "passed",
        "productionLogs",
        "rows",
        "schema",
      ]);
      assert.equal(result.schema, "r032-v63-parent-receipt-v1");
      validateProductionLogReceipt(result.productionLogs);
      assert(result.productionLogs.count > 0);
      assert.match(result.productionLogs.sha256, /^[a-f0-9]{64}$/);
      console.log(
        JSON.stringify({
          status:
            mode === "--collect"
              ? "collected-after-exact-review"
              : "precollection-self-test-only",
          collectionAuthorized: mode === "--collect",
          head: gate.freeze.head,
          parentLogs: {
            stdoutBytes: child.stdoutBytes,
            stdoutSha256: child.stdoutSha,
            stderrBytes: child.stderrBytes,
            stderrSha256: child.stderrSha,
            rawIncluded: false,
          },
          result,
        }),
      );
    } finally {
      await rm(launch, { recursive: true, force: true });
    }
  }
}
