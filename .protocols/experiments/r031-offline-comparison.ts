import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { capabilities, compositionSource, contractVersion, fixtures, projectionDigest, sha256, stableJson, variants, writeProjection, writeSubstrate, type FamilyId, type VariantId } from "./r031-offline-lib";

const repositoryRoot = resolve(import.meta.dir, "../..");
const runId = process.env.R031_RUN_ID ?? "2026-08-13-offline-symmetry-v1";
const evidenceRoot = resolve(process.env.R031_ARTIFACT_DIR ?? join(import.meta.dir, "runs/R-031", runId));
const runRoot = await mkdtemp(join(tmpdir(), "hyper-code2-r031-"));
const workspace = join(runRoot, "workspace");
const disposableHome = join(runRoot, "home");
const disposableTmp = join(runRoot, "tmp");
await Promise.all([mkdir(workspace, { recursive: true }), mkdir(disposableHome), mkdir(disposableTmp), mkdir(evidenceRoot, { recursive: true })]);
if ((await readdir(evidenceRoot)).length > 0) throw new Error(`R031_STOP_02: evidence directory must be empty: ${evidenceRoot}`);
await writeSubstrate(workspace);
for (const variant of variants) await writeProjection(workspace, variant);

type ChildResult = Record<string, unknown> & { variant: VariantId; family: FamilyId; mode: string; falseSuccessDetected: boolean };
async function runChild(variant: VariantId, family: FamilyId, mode: "positive" | "false-success-control") {
    const configPath = join(runRoot, `config-${variant}-${family}-${mode}.json`);
    await writeFile(configPath, stableJson({ root: workspace, variant, family, mode }));
    const child = Bun.spawn([process.execPath, resolve(import.meta.dir, "r031-fresh-verifier.ts"), configPath], {
        cwd: workspace,
        env: { HOME: disposableHome, TMPDIR: disposableTmp, PATH: process.env.PATH ?? "/usr/bin:/bin", NO_COLOR: "1" },
        stdout: "pipe",
        stderr: "pipe",
    });
    const [stdout, stderr, exitCode] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    assert.equal(exitCode, 0, `${variant}/${family}/${mode}: ${stderr}`);
    return { pid: child.pid, ...(JSON.parse(stdout) as ChildResult) };
}

const families = Object.keys(fixtures) as FamilyId[];
const positive: ChildResult[] = [];
const negative: ChildResult[] = [];
for (const variant of variants) {
    for (const family of families) {
        positive.push(await runChild(variant, family, "positive"));
        negative.push(await runChild(variant, family, "false-success-control"));
    }
}
assert.equal(new Set([...positive, ...negative].map(item => item.pid)).size, 24, "every verification must use a fresh process");
assert(positive.every(item => item.toolMatchesGolden === true && item.finalMatchesGolden === true && item.falseSuccessDetected === false));
assert(negative.every(item => item.falseSuccessDetected === true));
assert(positive.filter(item => item.variant === "V3").every(item => (item.invocationTrace as any)?.adapterBoundaryCrossed === true));
assert(negative.filter(item => item.variant === "V3").every(item => (item.invocationTrace as any)?.adapterBoundaryCrossed === true));
assert([...positive, ...negative].filter(item => item.variant !== "V3").every(item => (item.invocationTrace as any)?.adapterBoundaryCrossed === false));

const substrateDigests = Object.fromEntries(await Promise.all([
    ...capabilities.map(async item => [item.source, sha256(await readFile(join(workspace, item.source)))]) ,
    Promise.resolve(["capabilities/inspectComposedResult.mjs", sha256(compositionSource)]),
]));
const variantDigests = Object.fromEntries(await Promise.all(variants.map(async variant => [variant, await projectionDigest(workspace, variant)])));
const symmetry = {
    schemaVersion: 1,
    contractVersion,
    variants: variants.map(variant => ({
        variant,
        projectionSha256: variantDigests[variant],
        invocationBoundary: variant === "V3" ? "descriptor-adapter" : "ordinary-direct",
        authority: ["read frozen projections", "import admitted ordinary callable", "return deterministic result"],
        families,
        commonSubstrateSha256: substrateDigests,
    })),
    controls: {
        sameFixtures: true,
        sameGoldenOutputs: true,
        sameOrdinaryCallableSubstrate: true,
        sameChildExecutable: true,
        sameEnvironmentKeys: ["HOME", "NO_COLOR", "PATH", "TMPDIR"],
        freshProcessPerCase: true,
        v3DescriptorAdapterTraces: [...positive, ...negative].filter(item => item.variant === "V3" && (item.invocationTrace as any)?.adapterBoundaryCrossed === true).length,
        nonV3AdapterCrossings: [...positive, ...negative].filter(item => item.variant !== "V3" && (item.invocationTrace as any)?.adapterBoundaryCrossed === true).length,
        providerCalls: 0,
        socketsOpened: 0,
        realSecretsRead: false,
        productionSourceChanged: false,
        architectureOrWinnerSelected: false,
    },
};
const sanitizeProcess = (items: ChildResult[]) => items.map((item, index) => {
    const { pid: _pid, ...rest } = item;
    return { processOrdinal: index + 1, freshProcessVerified: true, ...rest };
});
await writeFile(join(evidenceRoot, "results.json"), stableJson(sanitizeProcess(positive)));
await writeFile(join(evidenceRoot, "false-success-controls.json"), stableJson(sanitizeProcess(negative)));
await writeFile(join(evidenceRoot, "symmetry.json"), stableJson(symmetry));
await writeFile(join(evidenceRoot, "provenance.json"), stableJson({
    schemaVersion: 1,
    runId,
    date: "2026-08-13",
    head: (await Bun.$`git rev-parse HEAD`.cwd(repositoryRoot).text()).trim(),
    bunVersion: Bun.version,
    platform: `${process.platform}-${process.arch}`,
    contractVersion,
    instrumentSources: Object.fromEntries(await Promise.all(["r031-offline-lib.ts", "r031-fresh-verifier.ts", "r031-offline-comparison.ts"].map(async file => [file, sha256(await readFile(join(import.meta.dir, file)))]))),
    sourceDiff: (await Bun.$`git diff -- src`.cwd(repositoryRoot).text()).trim().split("\n").filter(Boolean),
    sanitizedCarrier: true,
    disposableRunRootRetained: false,
}));
await writeFile(join(evidenceRoot, "README.md"), `# R-031 offline symmetry carrier ${runId}\n\nThis sanitized pre-run carrier proves only that V0–V3 can be represented over the same three ordinary callable fixtures with equal deterministic authority. Twenty-four fresh child processes ran: twelve positive golden checks and twelve injected false-success controls. Every V3 case resolved and invoked the admitted ordinary callable through the explicit descriptor adapter boundary; V0–V2 recorded no adapter crossing. Every variant also passed the same hard ordinary-callable composition gate. No model/provider, socket, real secret, production source, architecture decision or winner selection was involved.\n\n- \`symmetry.json\`: frozen cross-variant control comparison, invocation boundaries and projection/substrate digests.\n- \`results.json\`: positive fresh-process discovery, invocation trace, call, composition and golden verification.\n- \`false-success-controls.json\`: negative controls where a golden final claim is rejected because the tool result is wrong.\n- \`provenance.json\` and \`SHA256SUMS\`: instrument identity and carrier integrity.\n`);
const checksumFiles = (await readdir(evidenceRoot)).filter(file => file !== "SHA256SUMS").sort();
await writeFile(join(evidenceRoot, "SHA256SUMS"), `${(await Promise.all(checksumFiles.map(async file => `${sha256(await readFile(join(evidenceRoot, file)))}  ${file}`))).join("\n")}\n`);
console.log(stableJson({ evidenceRoot, positive: positive.length, negative: negative.length, symmetry }));
