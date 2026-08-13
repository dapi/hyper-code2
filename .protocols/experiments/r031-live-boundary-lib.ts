import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { contractVersion, fixtures, sha256, stableJson, type FamilyId, type VariantId } from "./r031-offline-lib";

export type Phase = "baseline" | "retain-control" | "fresh-reuse";
export const phases: Phase[] = ["baseline", "retain-control", "fresh-reuse"];
export const maxModelContinuations = 6;
export const commonAuthority = [
    "read frozen task/context and one variant projection",
    "read and invoke admitted ordinary callables in disposable workspace",
    "write only inside disposable workspace",
    "exchange serialized model requests with filesystem broker",
] as const;

const systemPrompt = [
    `R-031 controlled comparison ${contractVersion}.`,
    "Use ordinary callable capabilities and inspect their contract before calling.",
    "Do not inspect environment variables, credentials, or files outside the disposable workspace.",
    "Do not use network, shell, git, or production state.",
    "Report tool and final results separately; never claim success when the tool result differs from the golden contract.",
].join("\n");

const tasks: Record<FamilyId, Record<Phase, string>> = {
    "tag-normalization": {
        baseline: "Complete the tag-normalization fixture without retaining a new capability.",
        "retain-control": "Complete the tag-normalization fixture and make any retained ordinary callable explicit and inspectable.",
        "fresh-reuse": "In a fresh process, discover and call the retained ordinary callable for the tag-normalization fixture; do not create a duplicate.",
    },
    "repository-evidence": {
        baseline: "Complete the repository-evidence fixture without retaining a new capability.",
        "retain-control": "Complete the repository-evidence fixture and make any retained ordinary callable explicit and inspectable.",
        "fresh-reuse": "In a fresh process, discover and call the retained ordinary callable for the repository-evidence fixture; do not create a duplicate.",
    },
    "saved-json-transform": {
        baseline: "Complete the saved-json-transform fixture without retaining a new capability.",
        "retain-control": "Complete the saved-json-transform fixture and make any retained ordinary callable explicit and inspectable.",
        "fresh-reuse": "In a fresh process, discover and call the retained ordinary callable for the saved-json-transform fixture; do not create a duplicate.",
    },
};

export async function readProjection(root: string, variant: VariantId) {
    const directory = join(root, "projections", variant);
    const files = (await readdir(directory)).sort();
    assert.equal(files.length, 1, `${variant} must expose exactly one frozen projection artifact`);
    const file = files[0]!;
    const content = await readFile(join(directory, file), "utf8");
    return { variant, file: `projections/${variant}/${file}`, content, sha256: sha256(content) };
}

export function commonContext(family: FamilyId, phase: Phase) {
    return {
        schemaVersion: 1,
        contractVersion,
        systemPrompt,
        task: tasks[family][phase],
        family,
        phase,
        fixture: fixtures[family].input,
        golden: fixtures[family].golden,
        maxModelContinuations,
        modelAlias: "mock:r031-live-boundary-v1",
        authority: commonAuthority,
        modelRequestOwner: "credential-owning-broker-only",
    };
}

export function comparisonEnvelope(family: FamilyId, phase: Phase, projection: Awaited<ReturnType<typeof readProjection>>) {
    const common = commonContext(family, phase);
    return {
        schemaVersion: 1,
        common,
        commonSha256: sha256(stableJson(common)),
        projection,
    };
}
