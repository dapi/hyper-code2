import { describe, expect, test } from "bun:test";

import { CANDIDATE_IDS, LAYERS, durableSpy } from "./contracts";
import { SENTINEL_FORMS, secretBearingCycle } from "./fixtures";
import { candidates, fixturePlan, runPrecollectionControls } from "./instrument";

describe("R-033 V4 pre-collection controls", () => {
  test("freezes five separate candidate modules and a symmetric layer-control plan", () => {
    expect(candidates.map(candidate => candidate.id)).toEqual([...CANDIDATE_IDS]);
    const expected = 2 * CANDIDATE_IDS.length * LAYERS.length * SENTINEL_FORMS.reduce((count, form) => count + form.values.length, 0);
    expect(fixturePlan.layerControls).toHaveLength(expected);
    expect(new Set(fixturePlan.layerControls.map(cell => `${cell.candidate}:${cell.layer}:${cell.form}:${cell.valueIndex}:${cell.mode}`)).size).toBe(expected);
    expect(fixturePlan.layerNegatives).toHaveLength(CANDIDATE_IDS.length * LAYERS.length);
  });

  test("runs detector controls and secret-bearing cyclic serialization fail-before-durable controls only", () => {
    expect(runPrecollectionControls()).toMatchObject({ candidates: 5, layers: 8, cyclicDurabilityControls: 5, cc10SecretSuccessControls: 5, cc10SecretThrowControls: 5, frozenCcRows: 70 });
    for (const candidate of candidates) {
      const durable = durableSpy();
      expect(() => candidate.serializeBeforeDurableWrite(secretBearingCycle(), durable)).toThrow("SERIALIZATION_REJECTED");
      expect(durable.calls).toBe(0);
    }
  });
});
