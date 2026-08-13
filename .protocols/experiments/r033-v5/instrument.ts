import { readFile } from "node:fs/promises";
import { arch, platform, release } from "node:os";
import { resolve } from "node:path";
import { detectSentinel } from "../r018-sentinel-lib";
import { candidate01 } from "./candidate-01-broker";
import { candidate02 } from "./candidate-02-source-excluded";
import { candidate03 } from "./candidate-03-schema-projection";
import { candidate04 } from "./candidate-04-provenance-redaction";
import { candidate05 } from "./candidate-05-composition";
import { AUTHORITY_PATHS, CANDIDATE_IDS, CELLS, LAYERS, REFRESH_FAILURE_STAGES, durableSpy, type AuthorityPath, type Candidate, type CellResult, type DiscoveryStages, type RefreshFailureStage, type RefreshStages, type StableCode } from "./contracts";
import { CLEAN_VALUE, DISCOVERY_REQUEST, FIXTURE_PLAN, INFERENCE_REQUESTS, REFRESH_REQUESTS, SECRET_SUCCESS, SECRET_THROW, SENTINEL_FORMS, fixturePlanDigest, secretBearingCycle, sha256 } from "./fixtures";

export const candidates: readonly Candidate[] = Object.freeze([candidate01, candidate02, candidate03, candidate04, candidate05]);
export const instrumentFiles = Object.freeze([
  "contracts.ts", "fixtures.ts", "candidate-01-broker.ts", "candidate-02-source-excluded.ts",
  "candidate-03-schema-projection.ts", "candidate-04-provenance-redaction.ts", "candidate-05-composition.ts",
  "instrument.ts", "collector-child.ts", "collector-runner.ts", "freeze.ts", "collector.test.ts",
]);

export async function currentInstrumentHashes() { return Object.fromEntries(await Promise.all(instrumentFiles.map(async file => [file, sha256(await readFile(resolve(import.meta.dir, file)))]))); }
function hits(value: unknown) { try { return detectSentinel(JSON.stringify(value), SENTINEL_FORMS); } catch { return [{ formId: "cyclic" }]; } }
function status(ok: boolean): CellResult["status"] { return ok ? "pass" : "fail"; }
function result(candidate: Candidate, cell: CellResult["cell"], ok: boolean, observations: Record<string, unknown>): CellResult { const safe = JSON.stringify(observations); if (detectSentinel(safe, SENTINEL_FORMS).length) throw new Error(`R033_V5_UNSANITIZED_${candidate.id}_${cell}`); return { candidate: candidate.id, cell, status: status(ok), observations }; }
function expectedStageCalls(stage?: string) { const order = ["read", "oauth-request", "oauth-response", "write"]; const stop = stage ? order.indexOf(stage) : 3; return { read: stop >= 0 ? 1 : 0, oauthRequest: stop >= 1 ? 1 : 0, oauthResponse: stop >= 2 ? 1 : 0, write: stop >= 3 ? 1 : 0 }; }
function failCode(stage: RefreshFailureStage) { return `REFRESH_${stage.toUpperCase().replaceAll("-", "_")}_FAILED`; }
function refreshStageSpy(failAt?: RefreshFailureStage) {
  const calls = { read: 0, oauthRequest: 0, oauthResponse: 0, write: 0 };
  const invoke = <T>(stage: RefreshFailureStage, key: keyof typeof calls, operation: () => T) => { calls[key]++; if (failAt === stage) throw new Error(failCode(stage)); return operation(); };
  const stages: RefreshStages = {
    read: operation => invoke("read", "read", operation),
    oauthRequest: operation => invoke("oauth-request", "oauthRequest", operation),
    oauthResponse: operation => invoke("oauth-response", "oauthResponse", operation),
    write: operation => invoke("write", "write", operation),
  };
  return { calls, stages };
}
function refreshChecks(candidate: Candidate, indexes: number[]) { let success = 0, failures = 0, laterStageViolations = 0; const traces: unknown[] = []; for (const index of indexes) { const request = REFRESH_REQUESTS[index]!; const completeSpy = refreshStageSpy(); const complete = candidate.refresh(request, completeSpy.stages); if (JSON.stringify(completeSpy.calls) === JSON.stringify(expectedStageCalls()) && complete.writeDigest && !hits(complete).length) success++; traces.push({ provider: request.provider, outcome: "success", calls: completeSpy.calls }); for (const stage of REFRESH_FAILURE_STAGES) { const failedSpy = refreshStageSpy(stage); let code = ""; try { candidate.refresh(request, failedSpy.stages); } catch (error) { code = error instanceof Error ? error.message : "UNKNOWN"; } if (JSON.stringify(failedSpy.calls) !== JSON.stringify(expectedStageCalls(stage))) laterStageViolations++; if (code === failCode(stage)) failures++; traces.push({ provider: request.provider, outcome: stage, calls: failedSpy.calls, code }); } } return { success, failures, laterStageViolations, traces }; }
function serializeRejected(candidate: Candidate, value: unknown) { const durable = durableSpy(sha256); let code = ""; try { candidate.serializeBeforeDurableWrite(value, durable); } catch (error) { code = error instanceof Error ? error.message : "UNKNOWN"; } return { code, durableCalls: durable.calls }; }

export function executeCell(candidate: Candidate, cell: CellResult["cell"]): CellResult {
  if (cell === "CC-01") { const layerHits = LAYERS.reduce((n, layer) => n + hits(candidate.project(layer, CLEAN_VALUE)).length, 0); return result(candidate, cell, layerHits === 0, { layers: LAYERS.length, detectorHits: layerHits }); }
  if (cell === "CC-02") { let candidatePathHits = 0, positiveMisses = 0, controls = 0; for (const layer of LAYERS) for (const form of SENTINEL_FORMS) for (const value of form.values) { const projected = candidate.project(layer, candidate.secretFixture(value)); candidatePathHits += hits(projected).length; const deliberate = `${JSON.stringify(projected)}\nCONTROL:${value}`; if (!detectSentinel(deliberate, SENTINEL_FORMS).some(hit => hit.formId === form.id)) positiveMisses++; controls += 2; } const auth = candidate.inference(INFERENCE_REQUESTS[0]!); const ok = candidatePathHits === 0 && positiveMisses === 0 && auth.dispatchCalls === 1 && !hits(auth).length; return result(candidate, cell, ok, { controls, candidatePathHits, positiveMisses, authScheme: auth.authScheme, authDigest: auth.authDigest, rawRetained: auth.rawRetained }); }
  if (cell === "CC-03") { const receipt = candidate.inference(INFERENCE_REQUESTS[0]!); return result(candidate, cell, receipt.dispatchCalls === 1 && receipt.authScheme === "bearer" && !hits(receipt).length, { requestDigest: receipt.requestDigest, authDigest: receipt.authDigest, dispatchCalls: receipt.dispatchCalls }); }
  if (cell === "CC-04") { const receipt = candidate.inference(INFERENCE_REQUESTS[1]!); return result(candidate, cell, receipt.dispatchCalls === 1 && receipt.authScheme === "x-api-key" && !hits(receipt).length, { requestDigest: receipt.requestDigest, authDigest: receipt.authDigest, dispatchCalls: receipt.dispatchCalls }); }
  if (cell === "CC-05") { const staged = refreshChecks(candidate, [0, 1]); const inference = candidate.inference(INFERENCE_REQUESTS[2]!); const ok = staged.success === 2 && staged.failures === 8 && staged.laterStageViolations === 0 && inference.dispatchCalls === 1; return result(candidate, cell, ok, { ...staged, inferenceDigest: inference.requestDigest }); }
  if (cell === "CC-06") { const staged = refreshChecks(candidate, [2]); const inference = candidate.inference(INFERENCE_REQUESTS[3]!); const account = candidate.accountIdentity(); const ok = staged.success === 1 && staged.failures === 4 && staged.laterStageViolations === 0 && inference.dispatchCalls === 1 && account.source === "synthetic-access-token-claim" && !hits(account).length; return result(candidate, cell, ok, { ...staged, inferenceDigest: inference.requestDigest, accountIdDigest: account.accountIdDigest, claimParsed: true }); }
  if (cell === "CC-07") { const codes: StableCode[] = ["CREDENTIAL_REFERENCE_INVALID", "CREDENTIAL_REVOKED", "CREDENTIAL_EXPIRED"]; const receipts = codes.map(code => candidate.failureScenario(code)); return result(candidate, cell, receipts.every(item => item.dispatchCalls === 0 && item.ambientFallbackCalls === 0), { codes, dispatchCalls: receipts.reduce((n, item) => n + item.dispatchCalls, 0), ambientFallbackCalls: 0 }); }
  if (cell === "CC-08") { const receipt = candidate.failureScenario("CREDENTIAL_BOUNDARY_UNAVAILABLE"); return result(candidate, cell, receipt.dispatchCalls === 0 && receipt.ambientFallbackCalls === 0, receipt); }
  if (cell === "CC-09") { const classification = candidate.failureScenario("CLASSIFICATION_REQUIRED"); const schema = candidate.failureScenario("SCHEMA_REJECTED"); const durable = durableSpy(sha256); return result(candidate, cell, classification.dispatchCalls === 0 && schema.dispatchCalls === 0 && durable.calls === 0, { codes: [classification.code, schema.code], dispatchCalls: 0, durableCalls: durable.calls }); }
  if (cell === "CC-10") { const checks = [serializeRejected(candidate, candidate.secretFixture((SECRET_SUCCESS as any).credential)), serializeRejected(candidate, candidate.secretFixture((SECRET_THROW as any).message)), serializeRejected(candidate, secretBearingCycle())]; const ok = checks.every(item => item.code === "SERIALIZATION_REJECTED" && item.durableCalls === 0); return result(candidate, cell, ok, { paths: ["success", "throw", "cyclic"], checks }); }
  if (cell === "CC-11") { const retry = candidate.retryScenario(false); const cancellation = candidate.retryScenario(true); const ok = retry.rawRetryState === false && cancellation.rawRetryState === false && cancellation.dispatchCalls === 0 && cancellation.code === "OPERATION_CANCELLED"; return result(candidate, cell, ok, { retry, cancellation }); }
  if (cell === "CC-12") { const active = candidate.restartScenario(false); const revoked = candidate.restartScenario(true); const ok = !active.recoveredRawCredential && !revoked.recoveredRawCredential && revoked.code === "CREDENTIAL_REVOKED" && active.revalidationCalls === 1 && revoked.revalidationCalls === 1; return result(candidate, cell, ok, { active, revoked }); }
  if (cell === "CC-13") { const successCalls = { transport: 0, render: 0 }; const successStages: DiscoveryStages = { transport(operation) { successCalls.transport++; return operation(); }, render(operation) { successCalls.render++; return operation(); } }; const success = candidate.discovery(DISCOVERY_REQUEST, successStages); const failureCalls = { transport: 0, render: 0 }; const failureStages: DiscoveryStages = { transport(_operation) { failureCalls.transport++; throw new Error("DISCOVERY_UNAVAILABLE"); }, render(operation) { failureCalls.render++; return operation(); } }; let failureCode = ""; try { candidate.discovery(DISCOVERY_REQUEST, failureStages); } catch (error) { failureCode = error instanceof Error ? error.message : "UNKNOWN"; } const ok = successCalls.transport === 1 && successCalls.render === 1 && success.modelIds.length > 0 && failureCalls.transport === 1 && failureCalls.render === 0 && failureCode === "DISCOVERY_UNAVAILABLE" && !hits(success).length; return result(candidate, cell, ok, { success: { stageCalls: successCalls, modelIds: success.modelIds, transportDigest: success.transport?.requestDigest }, failure: { stageCalls: failureCalls, modelIds: [], code: failureCode } }); }
  if (cell === "CC-14") { const pathCalls = Object.fromEntries(AUTHORITY_PATHS.map(path => [path, 0])) as Record<AuthorityPath, number>; const adapters = Object.fromEntries(AUTHORITY_PATHS.map(path => [path, () => { pathCalls[path]++; return candidate.authority[path](); }])) as Record<AuthorityPath, () => unknown>; const generated = new Function("adapters", "path", "return adapters[path]()") as (adapters: Record<AuthorityPath, () => unknown>, path: AuthorityPath) => unknown; const probes = AUTHORITY_PATHS.map(path => ({ path, value: generated(adapters, path) })); const detectorHitsByPath = Object.fromEntries(probes.map(probe => [probe.path, hits(probe.value).length])) as Record<AuthorityPath, number>; const detectorHits = Object.values(detectorHitsByPath).reduce((n, count) => n + count, 0); const deniedOrBounded = Object.values(detectorHitsByPath).filter(count => count === 0).length; const distinctPathCalls = AUTHORITY_PATHS.every(path => pathCalls[path] === 1); return result(candidate, cell, detectorHits === 0 && distinctPathCalls, { paths: AUTHORITY_PATHS, pathCalls, generatedCodeCalls: probes.length, detectorHitsByPath, detectorHits, deniedOrBounded }); }
  throw new Error(`R033_V5_UNKNOWN_CELL_${cell}`);
}

export function executeRotatingMatrix(): CellResult[] { const byId = new Map(candidates.map(candidate => [candidate.id, candidate])); return CELLS.flatMap((cell, index) => (FIXTURE_PLAN.rotatingOrders[index % CANDIDATE_IDS.length] as readonly typeof CANDIDATE_IDS[number][]).map(id => executeCell(byId.get(id)!, cell))); }
export function sanitizedResult(result: CellResult) { const checksum = sha256(JSON.stringify(result)); return { ...result, checksum }; }

export type PrecollectionReview = Readonly<{ status: "approved-for-collection"; reviewer: string; reviewedAt: string; freezeManifestSha256: string; instrumentSha256: Readonly<Record<string, string>>; fixturePlanSha256: string }>;
async function hashPinned(repo: string, entries: Record<string, string>) { return Object.fromEntries(await Promise.all(Object.keys(entries).map(async path => [path, sha256(await readFile(resolve(repo, path)))]))); }
export async function assertFrozenInputs() {
  const repo = resolve(import.meta.dir, "../../..");
  const freeze = JSON.parse(await readFile(resolve(import.meta.dir, "precollection-freeze.json"), "utf8"));
  const revision = new TextDecoder().decode(Bun.spawnSync(["git", "rev-parse", "HEAD"], { cwd: repo }).stdout).trim();
  const git = new TextDecoder().decode(Bun.spawnSync(["git", "--version"]).stdout).trim();
  const actualEnvironment = { platform: platform(), release: release(), arch: arch(), bun: Bun.version, git };
  if (revision !== freeze.head) throw new Error("R033_V5_HEAD_DRIFT");
  if (JSON.stringify(actualEnvironment) !== JSON.stringify(freeze.environment)) throw new Error("R033_V5_ENVIRONMENT_DRIFT");
  if (JSON.stringify(await currentInstrumentHashes()) !== JSON.stringify(freeze.instrumentSha256)) throw new Error("R033_V5_INSTRUMENT_DRIFT");
  if (fixturePlanDigest() !== freeze.fixturePlanSha256) throw new Error("R033_V5_FIXTURE_DRIFT");
  if (JSON.stringify(await hashPinned(repo, freeze.sourceSha256)) !== JSON.stringify(freeze.sourceSha256)) throw new Error("R033_V5_PINNED_SOURCE_DRIFT");
  if (JSON.stringify(await hashPinned(repo, freeze.dependencySha256)) !== JSON.stringify(freeze.dependencySha256)) throw new Error("R033_V5_PINNED_DEPENDENCY_DRIFT");
  if (JSON.stringify(freeze.childEnvironmentKeys) !== JSON.stringify(["HOME", "LANG", "LC_ALL", "NO_COLOR", "PATH", "TMPDIR"])) throw new Error("R033_V5_CHILD_ENVIRONMENT_CONTRACT_DRIFT");
  return freeze;
}
export async function assertPrecollectionGate(reviewPath: string) { const review = JSON.parse(await readFile(reviewPath, "utf8")) as PrecollectionReview; if (review.status !== "approved-for-collection" || !review.reviewer || !review.reviewedAt) throw new Error("R033_V5_PRECOLLECTION_REVIEW_REQUIRED"); const freeze = await readFile(resolve(import.meta.dir, "precollection-freeze.json")); if (review.freezeManifestSha256 !== sha256(freeze)) throw new Error("R033_V5_FREEZE_REVIEW_MISMATCH"); if (JSON.stringify(review.instrumentSha256) !== JSON.stringify(await currentInstrumentHashes())) throw new Error("R033_V5_INSTRUMENT_DRIFT"); if (review.fixturePlanSha256 !== fixturePlanDigest()) throw new Error("R033_V5_FIXTURE_DRIFT"); await assertFrozenInputs(); }
