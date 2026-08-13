import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dir, "../..");
const sourceBaseline = "d119f1c10381e489d9140c43f9fe9a878bf67255";
const priorRunId = "2026-08-13-d119f1c-route-control-v2";
const runId = "2026-08-13-e301161-authority-contract-v1";
const runDir = resolve(repositoryRoot, ".protocols/experiments/runs/R-032", runId);
const priorRunDir = resolve(repositoryRoot, ".protocols/experiments/runs/R-029", priorRunId);

type CandidateId = "CAN-01" | "CAN-02" | "CAN-03" | "CAN-04" | "CAN-05" | "CAN-06" | "COM-01" | "COM-02" | "COM-03";
type CallerState = "missing" | "malformed" | "invalid" | "valid-insufficient" | "valid-sufficient" | "expired" | "revoked" | "replayed";
type Axis = "reachability" | "immediate" | "deferred" | "route-lifecycle" | "local-ux" | "failure" | "non-transit";
type RouteClass = "ordinary" | "privileged";

type CommittedRoute = {
    key: string;
    source: string;
    sourceSha256: string;
    authority: Array<{ class: string; executionTiming: Array<"immediate" | "deferred"> }>;
};

type Candidate = {
    id: CandidateId;
    label: string;
    locality: "loopback" | "unix" | "unrestricted";
    authority: "none" | "identity-policy" | "capability";
    routeSeparation: boolean;
    broker: boolean;
    browserBridge: boolean;
    fidelity: string;
};

type Result = {
    candidate: CandidateId;
    axis: Axis;
    caseId: string;
    outcome: string;
    allowed: boolean | null;
    handlerReached: boolean;
    authorityRootReached: boolean;
    requestedExposure: string | null;
    modeledExposure: string | null;
    callerAuthorityChanged: boolean;
    residualProcessAuthority: string;
    boundAuthority: string | null;
    recheckPoint: string | null;
    inheritedPolicy: string | null;
    bypassObserved: boolean;
    credentialChannel: string | null;
    bootstrapSteps: number | null;
    promptRequired: boolean | null;
    recovery: string | null;
    auditSignal: string | null;
    sinkCounts: Record<string, number> | null;
    fidelityLimit: string;
};

const candidates: Candidate[] = [
    { id: "CAN-01", label: "loopback default", locality: "loopback", authority: "none", routeSeparation: false, broker: false, browserBridge: false, fidelity: "Bind behavior is modeled only; no interface was opened or probed." },
    { id: "CAN-02", label: "Unix-domain transport", locality: "unix", authority: "none", routeSeparation: false, broker: false, browserBridge: true, fidelity: "Filesystem ownership, peer metadata, kernel enforcement and browser bridging are modeled assumptions." },
    { id: "CAN-03", label: "authentication plus authorization", locality: "unrestricted", authority: "identity-policy", routeSeparation: false, broker: false, browserBridge: false, fidelity: "Synthetic identity verifier and policy only; no external identity provider." },
    { id: "CAN-04", label: "scoped capability", locality: "unrestricted", authority: "capability", routeSeparation: false, broker: false, browserBridge: false, fidelity: "Opaque in-memory labels model capability lifecycle; cryptography is not evaluated." },
    { id: "CAN-05", label: "route separation", locality: "unrestricted", authority: "none", routeSeparation: true, broker: false, browserBridge: false, fidelity: "Route partitions are in-process data structures; separation does not identify callers." },
    { id: "CAN-06", label: "process separation", locality: "unrestricted", authority: "none", routeSeparation: false, broker: true, browserBridge: false, fidelity: "Broker/worker is an in-process adapter; OS confinement and IPC behavior are not established." },
    { id: "COM-01", label: "loopback plus authentication/authorization", locality: "loopback", authority: "identity-policy", routeSeparation: false, broker: false, browserBridge: false, fidelity: "Locality and identity policy are modeled; no network or external identity provider." },
    { id: "COM-02", label: "Unix-domain transport plus capability", locality: "unix", authority: "capability", routeSeparation: false, broker: false, browserBridge: true, fidelity: "Transport and capability cryptography are modeled, not kernel- or provider-validated." },
    { id: "COM-03", label: "loopback plus authz, route separation and broker", locality: "loopback", authority: "identity-policy", routeSeparation: true, broker: true, browserBridge: false, fidelity: "All boundaries are disposable in-process adapters; OS isolation is not established." },
];

const callerStates: CallerState[] = ["missing", "malformed", "invalid", "valid-insufficient", "valid-sufficient", "expired", "revoked", "replayed"];
const routeLifecycle = ["committed", "late-registration", "unclassified", "overlay-override"] as const;
const clientKinds = ["browser", "cli-tui"] as const;
const clientPhases = ["start", "reconnect", "expiry", "revocation", "recovery"] as const;
const failureKinds = ["stale-state", "verifier-broker-unavailable", "policy-parse-failure", "restart"] as const;
const reachabilityCases = ["default-locality", "explicit-non-local-request", "peer-address-metadata", "recovery"] as const;
const deferredCases = ["later-valid", "later-expired", "later-revoked", "missing-propagation", "reduced-scope", "replay"] as const;
const sinks = ["ordinary-log", "rendered-html", "durable-transcript", "action-result", "model-input", "persistence"] as const;
const sentinel = "synthetic-r032-bearer-never-serialize";
const sentinelHash = sha256(sentinel);

function sha256(input: string | Uint8Array) {
    return createHash("sha256").update(input).digest("hex");
}

function json(value: unknown) {
    return `${JSON.stringify(value, null, 2)}\n`;
}

function base(candidate: Candidate, axis: Axis, caseId: string): Result {
    return {
        candidate: candidate.id,
        axis,
        caseId,
        outcome: "observed",
        allowed: null,
        handlerReached: false,
        authorityRootReached: false,
        requestedExposure: null,
        modeledExposure: null,
        callerAuthorityChanged: false,
        residualProcessAuthority: candidate.broker ? "broker-retains-stubbed-privileged-roots" : "single-process-retains-stubbed-privileged-roots",
        boundAuthority: null,
        recheckPoint: null,
        inheritedPolicy: null,
        bypassObserved: false,
        credentialChannel: null,
        bootstrapSteps: null,
        promptRequired: null,
        recovery: null,
        auditSignal: null,
        sinkCounts: null,
        fidelityLimit: candidate.fidelity,
    };
}

function authorityDecision(candidate: Candidate, caller: CallerState, routeClass: RouteClass) {
    if (routeClass === "ordinary") return { allowed: true, reason: "ordinary-route" };
    if (candidate.authority === "none") return { allowed: true, reason: "no-caller-authority-control" };
    if (caller === "valid-sufficient") return { allowed: true, reason: "verified-and-sufficient" };
    return { allowed: false, reason: `deny-${caller}` };
}

function reachability(candidate: Candidate): Result[] {
    return reachabilityCases.map(caseName => {
        const result = base(candidate, "reachability", `reachability:${caseName}`);
        result.requestedExposure = caseName === "explicit-non-local-request" ? "non-local" : "local";
        result.modeledExposure = candidate.locality === "loopback" ? "loopback" : candidate.locality === "unix" ? "filesystem-endpoint" : "all-interfaces-possible";
        result.callerAuthorityChanged = false;
        result.outcome = caseName === "explicit-non-local-request" && candidate.locality !== "unrestricted" ? "exposure-request-denied" : caseName === "recovery" ? "modeled-recovery-complete" : "modeled-only";
        result.allowed = caseName === "explicit-non-local-request" ? candidate.locality === "unrestricted" : true;
        result.recovery = caseName === "recovery" ? (candidate.locality === "unix" ? "remove-stale-endpoint-then-recreate" : "restart-local-adapter") : null;
        return result;
    });
}

function immediate(candidate: Candidate, committedRoutes: CommittedRoute[]): Result[] {
    return committedRoutes.flatMap(route => callerStates.map(caller => {
        const routeClass: RouteClass = route.authority.length > 0 ? "privileged" : "ordinary";
        const result = base(candidate, "immediate", `immediate:${routeClass}:${route.key}:${caller}`);
        const decision = authorityDecision(candidate, caller, routeClass);
        result.allowed = decision.allowed;
        result.outcome = decision.reason;
        result.handlerReached = decision.allowed;
        result.authorityRootReached = decision.allowed && routeClass === "privileged";
        result.auditSignal = `${decision.allowed ? "allow" : "deny"}:${routeClass}:${caller}`;
        return result;
    }));
}

function deferred(candidate: Candidate, committedRoutes: CommittedRoute[]): Result[] {
    const deferredFixtures = committedRoutes.flatMap(route => route.authority
        .filter(authority => authority.executionTiming.includes("deferred"))
        .map(authority => ({ route: route.key, authority: authority.class })));
    return deferredFixtures.flatMap(fixture => deferredCases.map(caseName => {
        const result = base(candidate, "deferred", `deferred:${fixture.route}:${fixture.authority}:${caseName}`);
        const hasAuthority = candidate.authority !== "none";
        const validAtUse = caseName === "later-valid";
        const shouldAllow = hasAuthority && validAtUse;
        result.allowed = shouldAllow;
        result.handlerReached = shouldAllow;
        result.authorityRootReached = shouldAllow;
        result.boundAuthority = hasAuthority ? (candidate.authority === "capability" ? "capability-hash-and-scope" : "principal-id-and-scope") : null;
        result.recheckPoint = hasAuthority ? "deferred-use" : null;
        result.outcome = shouldAllow ? "deferred-use-allowed" : hasAuthority ? `deferred-use-denied-${caseName}` : "deferred-authority-not-bound-bypass";
        result.bypassObserved = !hasAuthority;
        result.auditSignal = hasAuthority ? `${shouldAllow ? "allow" : "deny"}:deferred:${caseName}` : "missing-deferred-authority-context";
        return result;
    }));
}

function lifecycle(candidate: Candidate, committedRoutes: CommittedRoute[]): Result[] {
    const fixtures = [
        ...committedRoutes.map(route => ({ caseName: "committed" as const, fixture: route.key })),
        { caseName: "late-registration" as const, fixture: "synthetic-late-privileged" },
        { caseName: "unclassified" as const, fixture: "synthetic-unclassified" },
        { caseName: "overlay-override" as const, fixture: "synthetic-overlay-privileged-override" },
    ];
    return fixtures.map(({ caseName, fixture }) => {
        const result = base(candidate, "route-lifecycle", `route-lifecycle:${caseName}:${fixture}`);
        const explicitCoverage = candidate.authority !== "none" || candidate.routeSeparation;
        result.inheritedPolicy = explicitCoverage
            ? caseName === "unclassified" ? "deny-unclassified" : "inherit-authority-class-default"
            : "no-explicit-authority-default";
        result.allowed = caseName === "unclassified" ? !explicitCoverage : true;
        result.bypassObserved = !explicitCoverage && caseName !== "committed";
        result.handlerReached = result.allowed;
        result.authorityRootReached = result.bypassObserved;
        result.outcome = result.bypassObserved ? "authority-policy-bypass" : caseName === "unclassified" ? "default-deny" : "policy-inherited";
        return result;
    });
}

function compatibility(candidate: Candidate): Result[] {
    return clientKinds.flatMap(client => clientPhases.map(phase => {
        const result = base(candidate, "local-ux", `local-ux:${client}:${phase}`);
        result.credentialChannel = candidate.authority === "none"
            ? "none"
            : client === "browser" ? "http-only-session-adapter" : "private-client-channel";
        result.bootstrapSteps = candidate.authority === "none" ? 1 : candidate.locality === "unix" && client === "browser" ? 3 : 2;
        result.promptRequired = candidate.authority !== "none" && (phase === "start" || phase === "recovery");
        if (candidate.locality === "unix" && client === "browser" && !candidate.browserBridge) {
            result.allowed = false;
            result.outcome = "browser-bridge-missing";
            result.recovery = "install-or-start-local-browser-bridge";
        } else if ((phase === "expiry" || phase === "revocation") && candidate.authority !== "none") {
            result.allowed = false;
            result.outcome = `visible-denial-${phase}`;
            result.recovery = client === "browser" ? "local-reauthentication" : "refresh-private-client-channel";
        } else {
            result.allowed = true;
            result.outcome = phase === "recovery" ? "explicit-recovery-complete" : "client-lifecycle-supported";
            result.recovery = phase === "recovery" ? (candidate.locality === "unix" ? "bridge-and-endpoint-recreated" : "session-reestablished") : null;
        }
        return result;
    }));
}

function failures(candidate: Candidate): Result[] {
    return failureKinds.map(caseName => {
        const result = base(candidate, "failure", `failure:${caseName}`);
        const authorityDependent = candidate.authority !== "none";
        const affected = caseName === "verifier-broker-unavailable" ? authorityDependent || candidate.broker : caseName === "policy-parse-failure" ? authorityDependent || candidate.routeSeparation : true;
        result.allowed = affected ? false : true;
        result.handlerReached = result.allowed;
        result.authorityRootReached = result.allowed && candidate.authority === "none";
        result.outcome = affected ? "fail-closed" : "failure-not-governed-by-candidate";
        result.recovery = caseName === "restart" ? "revalidate-authority-before-resume" : `repair-${caseName}`;
        result.auditSignal = `${affected ? "deny" : "uncovered"}:failure:${caseName}`;
        result.bypassObserved = !affected && candidate.authority === "none";
        return result;
    });
}

function nonTransit(candidate: Candidate): Result[] {
    return callerStates.map(caller => {
        const result = base(candidate, "non-transit", `non-transit:${caller}`);
        const designatedBoundary = candidate.authority !== "none" || candidate.broker;
        const sanitized = {
            principal: candidate.authority === "identity-policy" ? `principal-${caller}` : null,
            capabilityDigest: candidate.authority === "capability" ? sentinelHash : null,
            decision: authorityDecision(candidate, caller, "privileged").reason,
        };
        const serializedSinks: Record<string, string> = Object.fromEntries(sinks.map(sink => [sink, JSON.stringify({ sink, ...sanitized })]));
        result.sinkCounts = Object.fromEntries(Object.entries(serializedSinks).map(([sink, value]) => [sink, value.includes(sentinel) ? 1 : 0]));
        result.allowed = designatedBoundary && Object.values(result.sinkCounts).every(count => count === 0);
        result.outcome = designatedBoundary ? "sentinel-contained-at-designated-boundary" : "no-designated-verifier-or-broker-boundary";
        result.auditSignal = `credential-digest:${sentinelHash}`;
        return result;
    });
}

function collect(candidate: Candidate, committedRoutes: CommittedRoute[]): Result[] {
    return [
        ...reachability(candidate),
        ...immediate(candidate, committedRoutes),
        ...deferred(candidate, committedRoutes),
        ...lifecycle(candidate, committedRoutes),
        ...compatibility(candidate),
        ...failures(candidate),
        ...nonTransit(candidate),
    ];
}

function hardGates(candidate: Candidate, rows: Result[]) {
    const byAxis = (axis: Axis) => rows.filter(row => row.axis === axis);
    const privilegedUnauthorized = byAxis("immediate").filter(row => row.caseId.startsWith("immediate:privileged:") && !row.caseId.endsWith(":valid-sufficient"));
    const deferredRows = byAxis("deferred");
    const lifecycleRows = byAxis("route-lifecycle");
    const nonTransitRows = byAxis("non-transit");
    const uxRows = byAxis("local-ux");
    const failureRows = byAxis("failure");
    return {
        "GATE-01": { pass: privilegedUnauthorized.every(row => !row.handlerReached && !row.authorityRootReached), evidence: privilegedUnauthorized.map(row => row.caseId) },
        "GATE-02": { pass: deferredRows.every(row => row.boundAuthority !== null && row.recheckPoint === "deferred-use" && !row.bypassObserved), evidence: deferredRows.map(row => row.caseId) },
        "GATE-03": { pass: lifecycleRows.every(row => row.inheritedPolicy !== "no-explicit-authority-default" && !row.bypassObserved), evidence: lifecycleRows.map(row => row.caseId) },
        "GATE-04": { pass: byAxis("reachability").every(row => row.requestedExposure !== null && row.modeledExposure !== null && row.callerAuthorityChanged === false && row.residualProcessAuthority.length > 0), evidence: byAxis("reachability").map(row => row.caseId) },
        "GATE-05": { pass: nonTransitRows.every(row => row.allowed === true && Object.values(row.sinkCounts ?? {}).every(count => count === 0)), evidence: nonTransitRows.map(row => row.caseId) },
        "GATE-06": { pass: clientKinds.every(client => clientPhases.every(phase => uxRows.some(row => row.caseId === `local-ux:${client}:${phase}` && row.credentialChannel !== null))), evidence: uxRows.map(row => row.caseId) },
        "GATE-07": { pass: failureRows.every(row => row.outcome === "fail-closed" && row.authorityRootReached === false), evidence: failureRows.map(row => row.caseId) },
    };
}

async function command(args: string[]) {
    const child = Bun.spawn(args, { cwd: repositoryRoot, stdout: "pipe", stderr: "pipe", env: { PATH: process.env.PATH ?? "/usr/bin:/bin" } });
    const [stdout, stderr, exitCode] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    assert.equal(exitCode, 0, `${args.join(" ")} failed: ${stderr.trim()}`);
    return stdout.trim();
}

async function run() {
    const executionHead = await command(["git", "rev-parse", "HEAD"]);
    const sourceDiffFromBaseline = await command(["git", "diff", "--name-only", sourceBaseline, "--", "src"]);
    const sourceWorktreeDiff = await command(["git", "status", "--short", "--", "src"]);
    assert.equal(sourceDiffFromBaseline, "", "committed src differs from R-029 source baseline");
    assert.equal(sourceWorktreeDiff, "", "src has worktree changes; refuse mixed-snapshot collection");

    const priorReconciliationPath = resolve(priorRunDir, "route-control-reconciliation.json");
    const priorProvenancePath = resolve(priorRunDir, "provenance.json");
    const priorReconciliation = JSON.parse(await readFile(priorReconciliationPath, "utf8")) as CommittedRoute[];
    const priorProvenance = JSON.parse(await readFile(priorProvenancePath, "utf8"));
    assert.equal(priorReconciliation.length, 36);
    assert.equal(priorProvenance.sourceBaseline, sourceBaseline);
    assert.equal(priorReconciliation.flatMap(route => route.authority.filter(authority => authority.executionTiming.includes("deferred"))).length, 9);

    const originalNetwork = { serve: Bun.serve, connect: (Bun as any).connect, fetch: globalThis.fetch, WebSocket: globalThis.WebSocket };
    const forbiddenCalls: string[] = [];
    const deny = (name: string) => (..._args: unknown[]) => { forbiddenCalls.push(name); throw new Error(`R-032 prohibited network API: ${name}`); };
    (Bun as any).serve = deny("Bun.serve");
    (Bun as any).connect = deny("Bun.connect");
    (globalThis as any).fetch = deny("fetch");
    (globalThis as any).WebSocket = class { constructor() { forbiddenCalls.push("WebSocket"); throw new Error("R-032 prohibited network API: WebSocket"); } };

    let rawResults: Result[];
    try {
        rawResults = candidates.flatMap(candidate => collect(candidate, priorReconciliation));
    } finally {
        (Bun as any).serve = originalNetwork.serve;
        (Bun as any).connect = originalNetwork.connect;
        (globalThis as any).fetch = originalNetwork.fetch;
        (globalThis as any).WebSocket = originalNetwork.WebSocket;
    }
    assert.deepEqual(forbiddenCalls, [], "a prohibited network API was requested");

    const expectedCases = collect(candidates[0]!, priorReconciliation).map(row => `${row.axis}/${row.caseId}`);
    const symmetry = candidates.map(candidate => {
        const rows = rawResults.filter(row => row.candidate === candidate.id);
        const cases = rows.map(row => `${row.axis}/${row.caseId}`);
        return { candidate: candidate.id, count: rows.length, identicalCases: JSON.stringify(cases) === JSON.stringify(expectedCases), cases };
    });
    assert(symmetry.every(row => row.identicalCases));
    assert(symmetry.every(row => row.count === expectedCases.length));

    const sourcePaths = ["src/http/$start.ts", "src/http/loadRoutes.ts", "src/http/match.ts"];
    const sourceHashes: Record<string, string> = {};
    for (const path of sourcePaths) sourceHashes[path] = sha256(await readFile(resolve(repositoryRoot, path)));
    for (const row of priorReconciliation) {
        const currentHash = sha256(await readFile(resolve(repositoryRoot, row.source)));
        assert.equal(currentHash, row.sourceSha256, `source hash drift: ${row.source}`);
        sourceHashes[row.source] = currentHash;
    }

    const summary = candidates.map(candidate => {
        const rows = rawResults.filter(row => row.candidate === candidate.id);
        return {
            candidate: candidate.id,
            label: candidate.label,
            cases: rows.length,
            evidenceClassification: "contract-model-only",
            gateResult: "not-evaluated",
            candidateBehaviorExecuted: false,
            authorityCoverage: candidate.authority,
            localityModel: candidate.locality,
            routeSeparation: candidate.routeSeparation,
            brokerBoundary: candidate.broker,
            residualProcessAuthority: candidate.broker ? "privileged broker still has stubbed roots" : "single process still has stubbed roots",
            fidelityLimit: candidate.fidelity,
        };
    });
    const contractAccounting = Object.fromEntries(candidates.map(candidate => {
        const rows = rawResults.filter(row => row.candidate === candidate.id);
        return [candidate.id, {
            classification: "formula-derived-contract-expectation-not-candidate-evidence",
            gateResult: "not-evaluated",
            modeledExpectations: hardGates(candidate, rows),
        }];
    }));

    const manifest = {
        frozenAt: "2026-08-13",
        candidates,
        excludedCombinations: "All non-COM-01..03 combinations remain excluded by the approved plan; none were added during collection.",
        axes: ["reachability", "immediate", "deferred", "route-lifecycle", "local-ux", "failure", "non-transit"],
        callerStates,
        routeLifecycle,
        clientKinds,
        clientPhases,
        failureKinds,
        reachabilityCases,
        deferredCases,
        sinks,
        caseCountPerCandidate: expectedCases.length,
        scoringRubric: {
            rule: "No aggregate preference score and no mechanism selection. Hard gates are reported independently; trade-offs remain descriptive.",
            criteria: ["coverage strength", "least-authority precision", "trusted-local friction", "implementation surface", "operational/recovery burden", "migration compatibility", "observability/auditability", "testability", "residual reachability risk", "residual caller risk", "residual process risk"],
        },
    };
    const safety = {
        networkApisDenied: ["Bun.serve", "Bun.connect", "fetch", "WebSocket"],
        prohibitedNetworkCallsObserved: forbiddenCalls,
        socketOrListenerOpened: false,
        realSecretRead: false,
        userRuntimeStateRead: false,
        productionSourceChangedByInstrument: false,
        privilegedRoots: ["handler", "eval", "shell", "filesystem", "provider", "settings", "process-control"],
        privilegedRootsMode: "in-memory capture stubs only",
        syntheticCredentialRepresentationOutsideVerifier: { digest: sentinelHash, rawValueStored: false },
        formulaGeneratedSinkCountsZero: rawResults.filter(row => row.axis === "non-transit").every(row => Object.values(row.sinkCounts ?? {}).every(count => count === 0)),
        sentinelInjectedIntoCandidateAdapter: false,
        detectorPositiveControlExecuted: false,
        carrierOnlyRuntimeWrites: true,
    };
    assert.equal(safety.formulaGeneratedSinkCountsZero, true);

    const instrumentPath = resolve(import.meta.dir, "r032-network-authority.ts");
    const instrumentTestPath = resolve(import.meta.dir, "r032-network-authority.test.ts");
    const provenance = {
        runId,
        date: "2026-08-13",
        executionHead,
        sourceBaseline,
        sourceDiffFromBaseline: [],
        sourceWorktreeDiff: [],
        priorCarrier: `.protocols/experiments/runs/R-029/${priorRunId}`,
        priorCarrierHashes: {
            "route-control-reconciliation.json": sha256(await readFile(priorReconciliationPath)),
            "provenance.json": sha256(await readFile(priorProvenancePath)),
        },
        instruments: [
            { path: ".protocols/experiments/r032-network-authority.ts", sha256: sha256(await readFile(instrumentPath)) },
            { path: ".protocols/experiments/r032-network-authority.test.ts", sha256: sha256(await readFile(instrumentTestPath)) },
        ],
        sourceHashes,
        tools: { bun: Bun.version, git: await command(["git", "--version"]) },
        environment: { inheritedKeys: Object.keys(process.env).sort(), homeRead: false, credentialEnvironmentRead: false },
        boundary: {
            collectionModes: ["static", "mock", "disposable-in-process-prototype"],
            realTransport: false,
            realIdentityProvider: false,
            realSecrets: false,
            userState: false,
            productionImplementation: false,
            mechanismSelected: false,
        },
    };

    await mkdir(runDir, { recursive: true });
    const artifacts: Record<string, unknown> = {
        "manifest.json": manifest,
        "raw-results.json": rawResults,
        "gate-evidence.json": contractAccounting,
        "summary.json": summary,
        "provenance.json": provenance,
        "safety.json": safety,
        "review.json": {
            status: "rejected-as-candidate-evidence",
            reviewedFinding: "The 3,663 rows are formula/property-model output. Candidate adapters were not executed and the zero sink counts had neither raw sentinel injection nor a positive detector control.",
            requiredChecks: ["fixture symmetry", "source provenance", "hard-gate interpretation", "excluded combinations", "mechanism fidelity", "no mechanism selection"],
            synthesisAuthorized: false,
        },
    };
    for (const [name, value] of Object.entries(artifacts)) await writeFile(resolve(runDir, name), json(value));

    const readme = `# R-032 contract-model and accounting dry run\n\nThis sanitized carrier is retained as a rejected pre-collection dry run. Its ${rawResults.length.toLocaleString("en-US")} rows are formula-derived contract/schema/accounting output, not executions of CAN-01..06 or COM-01..03 adapters. It provides no candidate evidence and no hard-gate pass or failure. In particular, its zero sink counts are tautological: no raw synthetic sentinel entered a candidate adapter and no positive detector control ran.\n\nThe carrier is still useful only for checking frozen fixture cardinality, field presence, source provenance and symmetric case accounting. It opens no listener or socket, uses no real secret or user state, changes no production source and selects no mechanism. See review.json for the rejection record.\n\nR-032 remains collecting. A separate additive carrier must execute real disposable adapters and must pass independent review before synthesis, an ADR, delivery or non-local/shared use.\n`;
    await writeFile(resolve(runDir, "README.md"), readme);

    const checksumFiles = [...Object.keys(artifacts), "README.md"].sort();
    const checksumLines = [];
    for (const name of checksumFiles) checksumLines.push(`${sha256(await readFile(resolve(runDir, name)))}  ${name}`);
    await writeFile(resolve(runDir, "SHA256SUMS"), `${checksumLines.join("\n")}\n`);

    const fileList = (await command(["find", `.protocols/experiments/runs/R-032/${runId}`, "-type", "f", "-print"])).split("\n").filter(Boolean);
    assert(fileList.every(path => path.startsWith(`.protocols/experiments/runs/R-032/${runId}/`)), "unexpected R-032 carrier write");
    console.log(JSON.stringify({ runId, classification: "contract-model-only", candidates: candidates.length, casesPerCandidate: expectedCases.length, totalCases: rawResults.length, symmetry: true, safety, review: "rejected-as-candidate-evidence" }, null, 2));
}

if (import.meta.main) {
    if (process.env.R032_CONTAINED === "1") {
        await run();
    } else {
        const child = Bun.spawn([process.execPath, import.meta.path], {
            cwd: repositoryRoot,
            env: { PATH: process.env.PATH ?? "/usr/bin:/bin", R032_CONTAINED: "1" },
            stdin: "ignore",
            stdout: "inherit",
            stderr: "inherit",
        });
        process.exitCode = await child.exited;
    }
}

export { candidates, collect, hardGates };
