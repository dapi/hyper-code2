import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CANDIDATE_IDS, CELLS } from "./contracts";
import { fixturePlanDigest, sha256 } from "./fixtures";
import { assertFrozenInputs, assertPrecollectionGate, currentInstrumentHashes, executeRotatingMatrix, instrumentFiles, sanitizedResult } from "./instrument";

const repo = resolve(import.meta.dir, "../../..");
const carrierRoot = resolve(import.meta.dir, "../runs/R-033/v5-collection-2026-08-13-36705a74");
// The freeze records the source HEAD; the frozen instrument and accepted carrier first entered git in this child commit.
const frozenArtifactRevision = "70c46596b081cb61d16d544999f6140089b984ef";

function hasRevision(revision: string): boolean {
  return Bun.spawnSync(["git", "cat-file", "-e", `${revision}^{commit}`], { cwd: repo, stdout: "ignore", stderr: "ignore" }).exitCode === 0;
}

function readCommitted(revision: string, path: string): Uint8Array {
  const result = Bun.spawnSync(["git", "show", `${revision}:${path}`], { cwd: repo });
  if (result.exitCode !== 0) throw new Error(`R033_V5_COMMITTED_BLOB_UNAVAILABLE_${path}`);
  return result.stdout;
}

function committedHashes(revision: string, paths: readonly string[]) {
  return Object.fromEntries(paths.map(path => [path, sha256(readCommitted(revision, path))]));
}

describe("R-033 V5 staged collector", () => {
  test("executes a rotating CC-01..14 x CAND-01..05 matrix without persisting a carrier", () => {
    const results = executeRotatingMatrix();
    expect(results).toHaveLength(70);
    for (const cell of CELLS) expect(results.filter(result => result.cell === cell).map(result => result.candidate).sort()).toEqual([...CANDIDATE_IDS].sort());
    for (const [index, cell] of CELLS.entries()) expect(results.filter(result => result.cell === cell).map(result => result.candidate)).toEqual(Array.from({ length: 5 }, (_, offset) => CANDIDATE_IDS[(index + offset) % 5]));
    expect(results.filter(result => result.cell === "CC-05").every(result => result.observations.success === 2 && result.observations.failures === 8 && result.observations.laterStageViolations === 0)).toBeTrue();
    expect(results.filter(result => result.cell === "CC-06").every(result => result.observations.success === 1 && result.observations.failures === 4 && result.observations.claimParsed === true)).toBeTrue();
    expect(results.filter(result => result.cell === "CC-10").every(result => result.status === "pass" && (result.observations.checks as any[]).every(item => item.durableCalls === 0))).toBeTrue();
    expect(results.filter(result => result.cell === "CC-05" || result.cell === "CC-06").every(result => (result.observations.traces as any[]).every(trace => Object.values(trace.calls as Record<string, number>).reduce((n, value) => n + value, 0) >= 1))).toBeTrue();
    expect(results.filter(result => result.cell === "CC-13").every(result => (result.observations.failure as any).stageCalls.render === 0 && (result.observations.failure as any).stageCalls.transport === 1)).toBeTrue();
    expect(results.filter(result => result.cell === "CC-14").every(result => Object.values(result.observations.pathCalls as Record<string, number>).every(value => value === 1))).toBeTrue();
    expect(results.find(result => result.cell === "CC-14" && result.candidate === "CAND-04")?.status).toBe("fail");
    expect(results.find(result => result.cell === "CC-14" && result.candidate === "CAND-04")?.observations.deniedOrBounded).toBe(0);
    expect(results.filter(result => result.cell === "CC-14" && result.candidate !== "CAND-04").every(result => result.status === "pass")).toBeTrue();
    expect(results.filter(result => result.cell === "CC-14" && result.candidate !== "CAND-04").every(result => result.observations.deniedOrBounded === 7)).toBeTrue();
    for (const item of results.map(sanitizedResult)) { const { checksum, ...payload } = item; expect(checksum).toBe(sha256(JSON.stringify(payload))); }
  });

  test("freeze pins the historical collector and rejects collection from a later HEAD", async () => {
    const freezeBytes = await readFile(resolve(import.meta.dir, "precollection-freeze.json"));
    const freeze = JSON.parse(freezeBytes.toString());
    const results = JSON.parse(await readFile(resolve(carrierRoot, "results.json"), "utf8"));
    const containment = JSON.parse(await readFile(resolve(carrierRoot, "containment.json"), "utf8"));
    const provenance = JSON.parse(await readFile(resolve(carrierRoot, "provenance.json"), "utf8"));
    const controls = JSON.parse(await readFile(resolve(carrierRoot, "cross-candidate-controls.json"), "utf8"));
    expect(freeze.collectionAuthorized).toBeFalse();
    expect(freeze.candidateResultsCollected).toBeFalse();
    expect(freeze.fixturePlanSha256).toBe(fixturePlanDigest());
    // Full checkouts verify the frozen blobs directly; shallow CI clones retain the carrier checks below.
    if (hasRevision(frozenArtifactRevision)) expect(committedHashes(frozenArtifactRevision, instrumentFiles.map(file => `.protocols/experiments/r033-v5/${file}`))).toEqual(Object.fromEntries(Object.entries(freeze.instrumentSha256).map(([file, digest]) => [`.protocols/experiments/r033-v5/${file}`, digest])));
    if (hasRevision(freeze.head)) {
      expect(committedHashes(freeze.head, Object.keys(freeze.sourceSha256))).toEqual(freeze.sourceSha256);
      expect(committedHashes(freeze.head, Object.keys(freeze.dependencySha256))).toEqual(freeze.dependencySha256);
    }
    const currentInstrument = await currentInstrumentHashes();
    for (const file of instrumentFiles.filter(file => file !== "collector.test.ts")) expect(currentInstrument[file]).toBe(freeze.instrumentSha256[file]);
    expect(results.results).toEqual(executeRotatingMatrix().map(sanitizedResult));
    const containmentDigest = sha256(JSON.stringify(containment));
    const executionDigest = sha256(JSON.stringify(results.results));
    expect(provenance).toMatchObject({ revision: freeze.head, freezeManifestSha256: sha256(freezeBytes), sourceSha256: freeze.sourceSha256, dependencySha256: freeze.dependencySha256, instrumentSha256: freeze.instrumentSha256, containmentDigest, executionDigest });
    expect(controls).toMatchObject({ matrixRows: 70, containmentDigest, executionDigest, postCollectionReviewRequired: true });
    for (const line of (await readFile(resolve(carrierRoot, "SHA256SUMS"), "utf8")).trim().split("\n")) {
      const [digest, file] = line.split("  ");
      expect(sha256(await readFile(resolve(carrierRoot, file)))).toBe(digest);
    }
    await expect(assertFrozenInputs()).rejects.toThrow("R033_V5_HEAD_DRIFT");
  });

  test("STOP gate rejects collection without an exact independent approval", async () => {
    await expect(assertPrecollectionGate(resolve(import.meta.dir, "missing-review.json"))).rejects.toThrow();
  });
});
