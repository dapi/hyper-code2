import { describe, expect, test } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { comparisonEnvelope, phases, readProjection } from "./r031-live-boundary-lib";
import { fixtures, variants, writeProjection, writeSubstrate, type FamilyId } from "./r031-offline-lib";

describe("R-031 live-boundary envelope", () => {
    test("common context is byte-identical across variants and only projection differs", async () => {
        const root = await mkdtemp(join(tmpdir(), "r031-boundary-test-"));
        await writeSubstrate(root);
        for (const variant of variants) await writeProjection(root, variant);
        for (const phase of phases) for (const family of Object.keys(fixtures) as FamilyId[]) {
            const envelopes = await Promise.all(variants.map(async variant => comparisonEnvelope(family, phase, await readProjection(root, variant))));
            expect(new Set(envelopes.map(item => item.commonSha256)).size).toBe(1);
            expect(new Set(envelopes.map(item => item.projection.sha256)).size).toBe(4);
            expect(envelopes.every(item => item.common.maxModelContinuations === 6)).toBe(true);
            expect(envelopes.every(item => item.common.modelAlias === "mock:r031-live-boundary-v1")).toBe(true);
        }
    });
});
