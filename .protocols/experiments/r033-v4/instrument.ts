import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { detectSentinel } from "../r018-sentinel-lib";
import { candidate01 } from "./candidate-01-broker";
import { candidate02 } from "./candidate-02-source-excluded";
import { candidate03 } from "./candidate-03-schema-projection";
import { candidate04 } from "./candidate-04-provenance-redaction";
import { candidate05 } from "./candidate-05-composition";
import { CANDIDATE_IDS, LAYERS, durableSpy, type Candidate } from "./contracts";
import { CC_PLAN, CLEAN_VALUE, DISCOVERY_REQUEST, INFERENCE_REQUESTS, REFRESH_REQUESTS, SECRET_SUCCESS, SECRET_THROW, SENTINEL_FORMS, secretBearingCycle, sha256 } from "./fixtures";

export const candidates: readonly Candidate[] = Object.freeze([candidate01, candidate02, candidate03, candidate04, candidate05]);
export const fixturePlan = Object.freeze({
  inference: INFERENCE_REQUESTS,
  refresh: REFRESH_REQUESTS,
  discovery: DISCOVERY_REQUEST,
  ccPlan: CC_PLAN,
  symmetricCells: Object.freeze(CANDIDATE_IDS.flatMap(candidate => CC_PLAN.map(cell => Object.freeze({ candidate, cell: cell.cell, cases: cell.cases })))),
  layerControls: Object.freeze(
    CANDIDATE_IDS.flatMap(candidate =>
      LAYERS.flatMap(layer =>
        SENTINEL_FORMS.flatMap(form =>
          form.values.flatMap((_, valueIndex) => [
            Object.freeze({ candidate, layer, form: form.id, valueIndex, mode: "candidate-path" as const }),
            Object.freeze({ candidate, layer, form: form.id, valueIndex, mode: "transformed-positive-leak" as const }),
          ]),
        ),
      ),
    ),
  ),
  layerNegatives: Object.freeze(CANDIDATE_IDS.flatMap(candidate => LAYERS.map(layer => Object.freeze({ candidate, layer })))),
  cyclicSerialization: Object.freeze(CANDIDATE_IDS.map(candidate => Object.freeze({ candidate, outcome: "secret-bearing-cycle", requiredStableCode: "SERIALIZATION_REJECTED", requiredDurableCalls: 0 }))),
});

export const instrumentFiles = Object.freeze([
  "contracts.ts", "fixtures.ts", "candidate-01-broker.ts", "candidate-02-source-excluded.ts",
  "candidate-03-schema-projection.ts", "candidate-04-provenance-redaction.ts",
  "candidate-05-composition.ts", "instrument.ts", "precollection-child.ts",
  "precollection-runner.ts", "precollection.test.ts",
]);

export type PrecollectionReview = Readonly<{
  status: "approved-for-collection";
  reviewer: string;
  reviewedAt: string;
  freezeManifestSha256: string;
  instrumentSha256: Readonly<Record<string, string>>;
  fixturePlanSha256: string;
}>;

export async function currentInstrumentHashes(): Promise<Record<string, string>> {
  return Object.fromEntries(await Promise.all(instrumentFiles.map(async file => [file, sha256(await readFile(resolve(import.meta.dir, file)))])));
}

export function fixturePlanDigest(): string { return sha256(JSON.stringify(fixturePlan)); }

export function executeLayerProbe(candidate: Candidate, layer: typeof LAYERS[number], formId: string | null, valueIndex: number | null, mode: "candidate-path" | "transformed-positive-leak" | "clean-negative") {
  if (mode === "clean-negative") return { candidate: candidate.id, layer, mode, projected: candidate.project(layer, CLEAN_VALUE) };
  const form = SENTINEL_FORMS.find(item => item.id === formId);
  const value = form?.values[valueIndex ?? -1];
  if (!form || value === undefined) throw new Error("R033_V4_CONTROL_FIXTURE_INVALID");
  const projected = candidate.project(layer, mode === "candidate-path" ? candidate.secretFixture(value) : CLEAN_VALUE);
  return mode === "candidate-path"
    ? { candidate: candidate.id, layer, form: form.id, valueIndex, mode, projected }
    : { candidate: candidate.id, layer, form: form.id, valueIndex, mode, projected, deliberateSinkLeak: value };
}

export async function assertPrecollectionGate(reviewPath: string): Promise<void> {
  const review = JSON.parse(await readFile(reviewPath, "utf8")) as PrecollectionReview;
  if (review.status !== "approved-for-collection" || !review.reviewer || !review.reviewedAt) throw new Error("R033_V4_PRECOLLECTION_REVIEW_REQUIRED");
  const freezeManifest = await readFile(resolve(import.meta.dir, "precollection-freeze.json"));
  if (review.freezeManifestSha256 !== sha256(freezeManifest)) throw new Error("R033_V4_FREEZE_REVIEW_MISMATCH");
  const current = await currentInstrumentHashes();
  if (JSON.stringify(review.instrumentSha256) !== JSON.stringify(current)) throw new Error("R033_V4_INSTRUMENT_DRIFT");
  if (review.fixturePlanSha256 !== fixturePlanDigest()) throw new Error("R033_V4_FIXTURE_DRIFT");
}

export function runPrecollectionControls() {
  if (candidates.map(candidate => candidate.id).join(",") !== CANDIDATE_IDS.join(",")) throw new Error("R033_V4_CANDIDATE_SET");
  const expectedControls = 2 * CANDIDATE_IDS.length * LAYERS.length * SENTINEL_FORMS.reduce((count, form) => count + form.values.length, 0);
  if (fixturePlan.layerControls.length !== expectedControls) throw new Error("R033_V4_LAYER_SYMMETRY");
  for (const form of SENTINEL_FORMS) for (const value of form.values) if (!detectSentinel(value, SENTINEL_FORMS).some(hit => hit.formId === form.id)) throw new Error(`R033_V4_DETECTOR_${form.id}`);
  if (detectSentinel(JSON.stringify(CLEAN_VALUE), SENTINEL_FORMS).length) throw new Error("R033_V4_NEGATIVE_CONTROL");
  for (const candidate of candidates) {
    for (const layer of LAYERS) {
      const negative = executeLayerProbe(candidate, layer, null, null, "clean-negative");
      if (detectSentinel(JSON.stringify(negative), SENTINEL_FORMS).length) throw new Error(`R033_V4_LAYER_NEGATIVE_${candidate.id}_${layer}`);
      for (const form of SENTINEL_FORMS) for (const [valueIndex] of form.values.entries()) {
        const candidatePath = executeLayerProbe(candidate, layer, form.id, valueIndex, "candidate-path");
        if (detectSentinel(JSON.stringify(candidatePath), SENTINEL_FORMS).length) throw new Error(`R033_V4_CANDIDATE_PATH_${candidate.id}_${layer}_${form.id}_${valueIndex}`);
        const positive = executeLayerProbe(candidate, layer, form.id, valueIndex, "transformed-positive-leak");
        const sinkCapture = `${JSON.stringify(positive.projected)}\nCONTROL:${positive.deliberateSinkLeak}`;
        if (!detectSentinel(sinkCapture, SENTINEL_FORMS).some(hit => hit.formId === form.id)) throw new Error(`R033_V4_LAYER_POSITIVE_${candidate.id}_${layer}_${form.id}_${valueIndex}`);
      }
    }
    const success = candidate.project("action-result", candidate.secretFixture(SECRET_SUCCESS.credential));
    const thrown = candidate.project("diagnostic", candidate.secretFixture(SECRET_THROW.message));
    if (detectSentinel(JSON.stringify(success), SENTINEL_FORMS).length) throw new Error(`R033_V4_CC10_SUCCESS_${candidate.id}`);
    if (detectSentinel(JSON.stringify(thrown), SENTINEL_FORMS).length) throw new Error(`R033_V4_CC10_THROW_${candidate.id}`);
    const durable = durableSpy();
    let code = "";
    try { candidate.serializeBeforeDurableWrite(secretBearingCycle(), durable); }
    catch (error) { code = error instanceof Error ? error.message : "UNKNOWN"; }
    if (code !== "SERIALIZATION_REJECTED" || durable.calls !== 0) throw new Error(`R033_V4_DURABILITY_${candidate.id}`);
  }
  return {
    candidates: candidates.length,
    layers: LAYERS.length,
    forms: SENTINEL_FORMS.map(form => form.id),
    candidatePathControls: fixturePlan.layerControls.filter(cell => cell.mode === "candidate-path").length,
    transformedPositiveLeakControls: fixturePlan.layerControls.filter(cell => cell.mode === "transformed-positive-leak").length,
    cleanLayerControls: fixturePlan.layerNegatives.length,
    cyclicDurabilityControls: fixturePlan.cyclicSerialization.length,
    cc10SecretSuccessControls: candidates.length,
    cc10SecretThrowControls: candidates.length,
    frozenCcRows: fixturePlan.symmetricCells.length,
  };
}

export async function collectV4(_reviewPath: string): Promise<never> {
  await assertPrecollectionGate(_reviewPath);
  throw new Error("R033_V4_COLLECTION_NOT_IMPLEMENTED_UNTIL_REVIEW_HANDOFF");
}
