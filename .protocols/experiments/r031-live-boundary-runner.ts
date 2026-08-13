import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { comparisonEnvelope, commonAuthority, maxModelContinuations, phases, readProjection } from "./r031-live-boundary-lib";
import { capabilities, fixtures, sha256, stableJson, variants, writeProjection, writeSubstrate, type FamilyId, type VariantId } from "./r031-offline-lib";

const repositoryRoot = resolve(import.meta.dir, "../..");
const runId = process.env.R031_BOUNDARY_RUN_ID ?? "2026-08-13-live-boundary-mock-v1";
const evidenceRoot = resolve(process.env.R031_BOUNDARY_ARTIFACT_DIR ?? join(import.meta.dir, "runs/R-031", runId));
const sandboxExec = Bun.which("sandbox-exec");
if (process.platform !== "darwin" || !sandboxExec) throw new Error("R031_STOP_02: macOS sandbox-exec is required for the live-boundary control");
await mkdir(evidenceRoot, { recursive: true });
if ((await readdir(evidenceRoot)).length > 0) throw new Error(`R031_STOP_02: evidence directory must be empty: ${evidenceRoot}`);

const runRoot = await realpath(await mkdtemp(join(tmpdir(), "hyper-code2-r031-boundary-")));
const mailboxRoot = join(runRoot, "lineages");
const cleanHome = join(runRoot, "home");
const cleanTmp = join(runRoot, "tmp");
await Promise.all([mkdir(mailboxRoot), mkdir(cleanHome), mkdir(cleanTmp)]);

const operatorHome = process.env.HOME;
assert(operatorHome, "parent HOME required only to define sandbox deny boundary");
const operatorHomeProbePath = join(operatorHome, ".zshrc");
assert(await Bun.file(operatorHomeProbePath).exists(), "non-secret operator HOME probe fixture required");
const bunExecutable = Bun.which("bun") ?? process.execPath;
const childScriptSource = resolve(import.meta.dir, "r031-live-boundary-child.ts");
const offlineLibrarySource = resolve(import.meta.dir, "r031-offline-lib.ts");
const escape = (value: string) => value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
const sandboxProfile = (lineageRoot: string) => `(version 1)\n(deny default)\n(allow process*)\n(deny process-exec (require-not (literal "${escape(bunExecutable)}")))\n(allow sysctl-read)\n(allow file-read* (require-not (subpath "${escape(operatorHome)}")))\n(allow file-read* (literal "${escape(bunExecutable)}") (subpath "${escape(lineageRoot)}"))\n(allow file-write* (subpath "${escape(lineageRoot)}"))`;

const outboundProbeServer = Bun.listen({
    hostname: "127.0.0.1",
    port: 0,
    socket: { data() {} },
});

const brokerConfigPath = join(runRoot, "broker.config.json");
await writeFile(brokerConfigPath, stableJson({ mailboxRoot, mode: "offline-mock" }));
const broker = Bun.spawn([bunExecutable, resolve(import.meta.dir, "r031-live-boundary-broker.ts"), brokerConfigPath], {
    cwd: runRoot,
    env: { HOME: cleanHome, TMPDIR: cleanTmp, PATH: process.env.PATH ?? "/usr/bin:/bin", LANG: "C.UTF-8", LC_ALL: "C.UTF-8", NO_COLOR: "1" },
    stdout: "pipe",
    stderr: "pipe",
});

const families = Object.keys(fixtures) as FamilyId[];
const results: any[] = [];
const workspaces = new Map<string, string>();
async function workspaceFor(phase: typeof phases[number], family: FamilyId, variant: VariantId) {
    const lineageRoot = join(mailboxRoot, family, variant);
    const workspaceKind = phase === "baseline" ? "baseline-workspace" : "retained-workspace";
    const key = `${family}/${variant}/${workspaceKind}`;
    let workspace = workspaces.get(key);
    if (!workspace) {
        const instrumentRoot = join(lineageRoot, "instrument");
        await mkdir(instrumentRoot, { recursive: true });
        await Promise.all([
            copyFile(childScriptSource, join(instrumentRoot, "r031-live-boundary-child.ts")),
            copyFile(offlineLibrarySource, join(instrumentRoot, "r031-offline-lib.ts")),
        ]);
        workspace = join(lineageRoot, workspaceKind);
        await mkdir(workspace, { recursive: true });
        await writeSubstrate(workspace);
        await writeProjection(workspace, variant);
        assert.deepEqual(await readdir(join(workspace, "projections")), [variant], `${key}: foreign projection visible`);
        workspaces.set(key, workspace);
    }
    return { lineageRoot, workspace, childScript: join(lineageRoot, "instrument", "r031-live-boundary-child.ts") };
}
try {
for (const phase of phases) {
    for (const family of families) {
        for (const variant of variants) {
            const caseId = `${phase}-${family}-${variant}`;
            const { lineageRoot, workspace, childScript } = await workspaceFor(phase, family, variant);
            const envelope = comparisonEnvelope(family, phase, await readProjection(workspace, variant));
            const phaseRoot = join(lineageRoot, "mailboxes", phase);
            await mkdir(phaseRoot, { recursive: true });
            const configPath = join(phaseRoot, "config.json");
            const requestPath = join(phaseRoot, "model.request.json");
            const responsePath = join(phaseRoot, "model.response.json");
            const outputPath = join(phaseRoot, "child.output.json");
            await writeFile(configPath, stableJson({
                caseId,
                requestPath,
                responsePath,
                outputPath,
                repositoryProbePath: join(repositoryRoot, "package.json"),
                operatorHomeProbePath,
                outboundProbePort: outboundProbeServer.port,
                envelope,
            }));
            const child = Bun.spawn([sandboxExec, "-p", sandboxProfile(lineageRoot), bunExecutable, childScript, configPath], {
                cwd: workspace,
                env: { HOME: cleanHome, TMPDIR: cleanTmp, PATH: process.env.PATH ?? "/usr/bin:/bin", LANG: "C.UTF-8", LC_ALL: "C.UTF-8", NO_COLOR: "1" },
                stdout: "pipe",
                stderr: "pipe",
            });
            const [stdout, stderr, exitCode] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
            assert.equal(exitCode, 0, `${caseId}: ${stdout}${stderr}`);
            const childResult = JSON.parse(await readFile(outputPath, "utf8"));
            results.push({
                caseId,
                phase,
                family,
                variant,
                processOrdinal: results.length + 1,
                freshProcessVerified: !results.some(item => item.pid === childResult.pid),
                pid: childResult.pid,
                commonSha256: envelope.commonSha256,
                projectionSha256: envelope.projection.sha256,
                projectionFile: envelope.projection.file,
                accessibleProjectionVariants: await readdir(join(workspace, "projections")),
                workspaceStateLineage: phase === "baseline" ? "isolated-baseline" : "retain-to-fresh-reuse",
                commonKeys: Object.keys(envelope.common).sort(),
                maxModelContinuations: envelope.common.maxModelContinuations,
                authority: envelope.common.authority,
                child: childResult,
            });
        }
    }
}
} finally {
    await writeFile(join(mailboxRoot, "STOP"), "stop\n");
    outboundProbeServer.stop();
}
const brokerExit = await broker.exited;
const brokerStdout = await new Response(broker.stdout).text();
const brokerStderr = await new Response(broker.stderr).text();
assert.equal(brokerExit, 0, brokerStderr);
const brokerResult = JSON.parse(brokerStdout);
assert.equal(brokerResult.handled, 36);
assert.equal(brokerResult.providerCalls, 0);

for (const phase of phases) for (const family of families) {
    const group = results.filter(item => item.phase === phase && item.family === family);
    assert.equal(group.length, 4);
    assert.equal(new Set(group.map(item => item.commonSha256)).size, 1, `${phase}/${family}: common context drift`);
    assert.equal(new Set(group.map(item => stableJson(item.authority))).size, 1, `${phase}/${family}: authority drift`);
    assert.equal(new Set(group.map(item => item.maxModelContinuations)).size, 1, `${phase}/${family}: call-budget drift`);
    assert.equal(new Set(group.map(item => stableJson(item.commonKeys))).size, 1, `${phase}/${family}: prompt/context shape drift`);
    assert.equal(new Set(group.map(item => item.projectionSha256)).size, 4, `${phase}/${family}: projections must remain attributable`);
    assert(group.every(item => item.accessibleProjectionVariants.length === 1 && item.accessibleProjectionVariants[0] === item.variant), `${phase}/${family}: foreign projection access`);
}
assert.equal(new Set(results.map(item => item.pid)).size, 36, "every phase/family/variant requires a fresh child process");
assert(results.every(item => item.freshProcessVerified
    && item.child.networkListenProbeDenied
    && item.child.outboundConnectProbeDenied
    && item.child.repositoryReadProbeDenied
    && item.child.operatorHomeReadProbeDenied
    && item.child.processSpawnProbeDenied
    && item.child.providerCalls === 0));

const sampleWorkspace = workspaces.values().next().value as string;
async function substrateInventory(workspace: string) {
    const files = (await readdir(join(workspace, "capabilities"))).sort();
    return Object.fromEntries(await Promise.all(files.map(async file => [`capabilities/${file}`, sha256(await readFile(join(workspace, "capabilities", file)))])));
}
const substrateSha256 = await substrateInventory(sampleWorkspace);
assert.equal(new Set(await Promise.all([...workspaces.values()].map(async workspace => stableJson(await substrateInventory(workspace))))).size, 1, "ordinary callable substrate drift");
const sanitizedResults = results.map(({ pid: _pid, child, ...item }) => ({ ...item, child: { ...child, pid: undefined } }));
const symmetry = {
    schemaVersion: 1,
    contractVersion: "R-031.discovery-retention.v1",
    cases: 36,
    variants,
    families,
    phases,
    maxModelContinuations,
    modelAlias: "mock:r031-live-boundary-v1",
    authority: commonAuthority,
    commonContextEqualWithinEveryPhaseFamily: true,
    onlyAttributedContextDifference: "projection",
    exactlyOneProjectionAccessiblePerAgentLineage: true,
    operatorRepositoryReadableByAgent: false,
    retainAndFreshReuseShareOnlySameVariantFamilyWorkspace: true,
    uniqueProjectionDigests: Object.fromEntries(variants.map(variant => [variant, results.find(item => item.variant === variant).projectionSha256])),
    groupControls: phases.flatMap(phase => families.map(family => {
        const group = results.filter(item => item.phase === phase && item.family === family);
        return {
            phase,
            family,
            commonContextSha256: group[0].commonSha256,
            projectionSha256ByVariant: Object.fromEntries(group.map(item => [item.variant, item.projectionSha256])),
        };
    })),
    commonOrdinaryCallableSubstrateSha256: substrateSha256,
    freshAgentProcessPerCase: true,
};
const safety = {
    schemaVersion: 1,
    brokerMode: "offline-mock",
    brokerHandledRequests: brokerResult.handled,
    providerCalls: 0,
    brokerIsSeparateProcess: true,
    agentCredentialsProvided: false,
    exactAgentEnvironmentKeys: ["HOME", "LANG", "LC_ALL", "NO_COLOR", "PATH", "TMPDIR"],
    authLikeAgentEnvironmentKeys: [],
    deniedNetworkOperations: ["bind/listen:tcp-loopback", "connect:tcp-loopback-established-listener"],
    allNamedNetworkProbeCasesDenied: true,
    broadMachLookupAllowed: false,
    machLookupAllowlist: [],
    namedMachServiceProbes: [],
    networkListenDeniedProbeCases: results.filter(item => item.child.networkListenProbeDenied).length,
    outboundConnectDeniedProbeCases: results.filter(item => item.child.outboundConnectProbeDenied).length,
    operatorRepositoryReadDeniedProbeCases: results.filter(item => item.child.repositoryReadProbeDenied).length,
    operatorHomeReadDeniedProbeCases: results.filter(item => item.child.operatorHomeReadProbeDenied).length,
    processSpawnDeniedProbeCases: results.filter(item => item.child.processSpawnProbeDenied).length,
    broadProcessAuthorityAllowed: true,
    processExecRestriction: "non-Bun executables denied; process* remains allowed for Bun compatibility",
    broadNonHomeReadsAllowed: true,
    filesystemBrokerTransport: true,
    futureProviderOwner: "credential-owning-broker-only-after-explicit-authorization",
    realSecretsRead: false,
    productionSourceChanged: false,
    modelComparisonRun: false,
    boundaryDisposition: "mock-boundary-envelope-only; not approved for live model execution",
    remainingBoundaryGaps: [
        "process* remains allowed for Bun compatibility even though non-Bun exec is denied by a named probe",
        "reads outside operator HOME remain broadly allowed for Bun compatibility",
        "network evidence covers only TCP loopback bind/listen and connect to an established listener",
        "deny-default Mach policy has no named service probe in this carrier",
        "child exercises the comparison envelope and broker transport, not the full agent marker/write/reload runtime",
        "broker is mock-only; credential ownership and secret non-transit are not exercised",
        "macOS sandbox-exec evidence is host-specific and not a portable production containment contract",
    ],
};
await writeFile(join(evidenceRoot, "boundary-results.json"), stableJson(sanitizedResults));
await writeFile(join(evidenceRoot, "context-symmetry.json"), stableJson(symmetry));
await writeFile(join(evidenceRoot, "safety-boundary.json"), stableJson(safety));
await writeFile(join(evidenceRoot, "provenance.json"), stableJson({
    schemaVersion: 1,
    runId,
    date: "2026-08-13",
    head: (await Bun.$`git rev-parse HEAD`.cwd(repositoryRoot).text()).trim(),
    bunVersion: Bun.version,
    platform: `${process.platform}-${process.arch}`,
    instrumentSha256: Object.fromEntries(await Promise.all(["r031-live-boundary-lib.ts", "r031-live-boundary-child.ts", "r031-live-boundary-broker.ts", "r031-live-boundary-runner.ts"].map(async file => [file, sha256(await readFile(join(import.meta.dir, file)))]))),
    sandboxProfileTemplateSha256: sha256(sandboxProfile("[LINEAGE_ROOT]")),
    sourceDiff: (await Bun.$`git diff -- src`.cwd(repositoryRoot).text()).trim().split("\n").filter(Boolean),
    sanitizedCarrier: true,
}));
await writeFile(join(evidenceRoot, "README.md"), `# R-031 boundary-envelope offline mock carrier ${runId}\n\nThis mock-only carrier exercises 36 fresh isolated child cases: four frozen projections by three task families by three phases. The filesystem broker ran separately in offline-mock mode and made zero provider calls. Every phase/family group had identical common prompt, mock model alias, fixture, golden, declared authority and six-continuation budget; only the attributable projection content differed. Each lineage exposed exactly one projection; retain-control and fresh-reuse alone shared that variant/family workspace.\n\nThe named checks passed in every child: TCP loopback bind/listen denied, outbound TCP loopback connect to an established control listener denied, operator repository and HOME reads denied, and non-Bun process exec denied. The profile has no mach-lookup allow rule. This is not yet a live-agent boundary: \`process*\` and broad non-HOME reads remain for Bun compatibility, Mach denial has no named service probe, the child exercises only envelope/broker transport, and the broker is mock-only. See \`remainingBoundaryGaps\` in \`safety-boundary.json\`. No real secret, live model, production source, architecture decision or winner selection was involved.\n\n- \`context-symmetry.json\`: equality controls and substrate/projection identities.\n- \`safety-boundary.json\`: exact proved controls and remaining boundary gaps.\n- \`boundary-results.json\`: sanitized per-case request/broker observations.\n- \`provenance.json\` and \`SHA256SUMS\`: instrument identity and integrity.\n`);
const checksumFiles = (await readdir(evidenceRoot)).filter(file => file !== "SHA256SUMS").sort();
await writeFile(join(evidenceRoot, "SHA256SUMS"), `${(await Promise.all(checksumFiles.map(async file => `${sha256(await readFile(join(evidenceRoot, file)))}  ${file}`))).join("\n")}\n`);
console.log(stableJson({ evidenceRoot, symmetry, safety }));
