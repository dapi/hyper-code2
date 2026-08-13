import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CANDIDATE_IDS, CELLS } from "./contracts";
import { fixturePlanDigest, sha256 } from "./fixtures";
import { assertFrozenInputs, assertPrecollectionGate, currentInstrumentHashes, executeRotatingMatrix, sanitizedResult } from "./instrument";

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

  test("freeze pins every collector file and fixture plan", async () => {
    const freeze = JSON.parse(await readFile(resolve(import.meta.dir, "precollection-freeze.json"), "utf8"));
    expect(freeze.collectionAuthorized).toBeFalse();
    expect(freeze.candidateResultsCollected).toBeFalse();
    expect(freeze.fixturePlanSha256).toBe(fixturePlanDigest());
    expect(freeze.instrumentSha256).toEqual(await currentInstrumentHashes());
    await expect(assertFrozenInputs()).resolves.toMatchObject({ schemaVersion: "5.2", collectionAuthorized: false });
  });

  test("STOP gate rejects collection without an exact independent approval", async () => {
    await expect(assertPrecollectionGate(resolve(import.meta.dir, "missing-review.json"))).rejects.toThrow();
  });
});
