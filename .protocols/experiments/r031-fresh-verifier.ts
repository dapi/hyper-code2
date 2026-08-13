import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { discover, fixtures, invokeObserved, sha256, stableJson, type FamilyId, type VariantId } from "./r031-offline-lib";

const configPath = process.argv[2];
assert(configPath, "config path required");
const config = JSON.parse(await readFile(configPath, "utf8")) as {
    root: string;
    variant: VariantId;
    family: FamilyId;
    mode: "positive" | "false-success-control";
};
const fixture = fixtures[config.family];
const capability = await discover(config.root, config.variant, config.family);
const input = config.mode === "positive" ? fixture.input : fixture.invalidInput;
const observed = await invokeObserved(config.root, config.variant, capability, input);
const toolResult = observed.result;
const directResult = (await invokeObserved(config.root, "V0", capability, input)).result;
assert.equal(stableJson(toolResult), stableJson(directResult), "projection invocation must preserve ordinary direct-call result");
if (config.variant === "V3") {
    assert.equal(observed.trace.invocationPath, "descriptor-adapter");
    assert.equal(observed.trace.descriptorResolved, true);
    assert.equal(observed.trace.adapterBoundaryCrossed, true);
} else {
    assert.equal(observed.trace.invocationPath, "ordinary-direct");
    assert.equal(observed.trace.descriptorResolved, false);
    assert.equal(observed.trace.adapterBoundaryCrossed, false);
}
const composer = await import(`${Bun.pathToFileURL(join(config.root, "capabilities/inspectComposedResult.mjs")).href}?fresh=${crypto.randomUUID()}`);
const composedResult = await composer.default({}, { value: toolResult });
assert.equal(composedResult.json, JSON.stringify(toolResult), "ordinary callable composition must preserve result");
const claimedFinal = config.mode === "positive" ? toolResult : fixture.golden;
const toolMatchesGolden = stableJson(toolResult) === stableJson(fixture.golden);
const finalMatchesGolden = stableJson(claimedFinal) === stableJson(fixture.golden);
const falseSuccessDetected = finalMatchesGolden && !toolMatchesGolden;

if (config.mode === "positive") {
    assert(toolMatchesGolden, "positive tool output must match golden");
    assert(finalMatchesGolden, "positive final output must match golden");
    assert(!falseSuccessDetected, "positive case cannot be false success");
} else {
    assert(falseSuccessDetected, "negative control must detect false success");
}

process.stdout.write(stableJson({
    schemaVersion: 1,
    variant: config.variant,
    family: config.family,
    mode: config.mode,
    discovered: capability.name,
    source: capability.source,
    signatureSha256: sha256(capability.signature),
    inputSha256: sha256(stableJson(input)),
    goldenSha256: sha256(stableJson(fixture.golden)),
    toolResultSha256: sha256(stableJson(toolResult)),
    finalResultSha256: sha256(stableJson(claimedFinal)),
    toolMatchesGolden,
    finalMatchesGolden,
    falseSuccessDetected,
    ordinaryDirectCallMatches: true,
    ordinaryCompositionCheck: true,
    invocationTrace: observed.trace,
    composedResultSha256: sha256(stableJson(composedResult)),
    duplicateCreated: false,
    modelContinuations: 0,
}));
