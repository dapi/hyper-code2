import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discover, fixtures, invokeObserved, stableJson, variants, writeProjection, writeSubstrate, type FamilyId } from "./r031-offline-lib";

describe("R-031 offline contract projections", () => {
    test("all variants discover and invoke the same ordinary callables", async () => {
        const root = await mkdtemp(join(tmpdir(), "r031-test-"));
        await writeSubstrate(root);
        for (const variant of variants) {
            await writeProjection(root, variant);
            for (const family of Object.keys(fixtures) as FamilyId[]) {
                const capability = await discover(root, variant, family);
                const observed = await invokeObserved(root, variant, capability, fixtures[family].input);
                expect(stableJson(observed.result)).toBe(stableJson(fixtures[family].golden));
                expect(observed.trace.adapterBoundaryCrossed).toBe(variant === "V3");
                expect(observed.trace.invocationPath).toBe(variant === "V3" ? "descriptor-adapter" : "ordinary-direct");
            }
        }
    });

    test("V3 adapter rejects a descriptor that points outside the admitted ordinary callable", async () => {
        const root = await mkdtemp(join(tmpdir(), "r031-v3-tamper-test-"));
        await writeSubstrate(root);
        await writeProjection(root, "V3");
        const path = join(root, "projections/V3/descriptors.json");
        const catalog = JSON.parse(await readFile(path, "utf8"));
        catalog.descriptors[0].source = "capabilities/not-admitted.mjs";
        await writeFile(path, JSON.stringify(catalog));
        const capability = await discover(root, "V3", "tag-normalization");
        expect(invokeObserved(root, "V3", capability, fixtures["tag-normalization"].input)).rejects.toThrow("Expected values to be strictly equal");
    });
});
