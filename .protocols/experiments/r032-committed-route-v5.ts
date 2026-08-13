import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { arch, platform, release } from "node:os";
import { resolve } from "node:path";
import loadRoutes from "../../src/http/loadRoutes";
import match from "../../src/http/match";
import startHttp from "../../src/http/$start";
import classify from "../../src/project/classify";
import { adapters } from "./r032-dispatch-chain-v3";

const repo = resolve(import.meta.dir, "../..");
const runId = "2026-08-13-680be81-committed-route-v5";
const runDir = resolve(repo, ".protocols/experiments/runs/R-032", runId);
const baseline = "d119f1c10381e489d9140c43f9fe9a878bf67255";
const reconciliationPath = ".protocols/experiments/runs/R-029/2026-08-13-d119f1c-route-control-v2/route-control-reconciliation.json";
const fixturePath = ".protocols/experiments/r032-route-v5.fixture.ts";
const hash = (v: string | Uint8Array) => createHash("sha256").update(v).digest("hex");
type Caller = "missing" | "sufficient" | "expired" | "revoked";
type Policy = "ordinary" | "privileged" | "deny";

function defaultPolicy(adapter: any): Policy {
    return adapter.routeSeparation ? "deny" : adapter.identity || adapter.capability ? "privileged" : "ordinary";
}
function authorize(adapter: any, policy: Policy, caller: Caller, generationCurrent = true) {
    if (policy === "deny") return { allow: false, reason: "route-default-deny" };
    if (policy === "ordinary") return { allow: true, reason: "ordinary-or-ambient" };
    if (adapter.identity || adapter.capability) {
        if (!generationCurrent) return { allow: false, reason: "stale-generation" };
        if (caller !== "sufficient") return { allow: false, reason: `${adapter.identity ? "identity" : "capability"}-${caller}-deny` };
        return { allow: true, reason: adapter.identity ? "identity-authorized" : "capability-authorized" };
    }
    if (adapter.broker) {
        if (!generationCurrent) return { allow: false, reason: "broker-generation-stale" };
        return { allow: true, reason: "broker-message-authorized" };
    }
    return { allow: true, reason: "ambient-authority-gap" };
}

function lifecycle(adapter: any, kind: "browser" | "cli") {
    const channel = adapter.locality === "unix" && kind === "browser" ? "browser-bridge" : kind === "browser" ? "http-only-session" : "private-cli-channel";
    const phases: Array<{ event: string; caller: Caller }> = [
        { event: "start", caller: "sufficient" }, { event: "reconnect", caller: "sufficient" },
        { event: "expiry", caller: "expired" }, { event: "expiry-recovery", caller: "sufficient" },
        { event: "revocation", caller: "revoked" }, { event: "revocation-recovery", caller: "sufficient" },
    ];
    return phases.map((phase) => {
        const decision = authorize(adapter, "privileged", phase.caller);
        return { ...phase, channel, decision, state: decision.allow ? "ready" : "reauthorization-required", prompt: decision.allow ? null : phase.caller === "revoked" ? "clear-and-reauthorize" : "refresh-authority" };
    });
}

function reachability(adapter: any, capturedHostname: string) {
    const modeledExposure = adapter.locality === "loopback" ? "local-only" : adapter.locality === "unix" ? "filesystem-endpoint" : "unrestricted";
    return [
        { case: "default-locality", requestedBind: capturedHostname, requestedExposure: "default", modeledExposure, peerMetadata: "synthetic-local-peer", recovery: null },
        { case: "explicit-non-local-request", requestedBind: capturedHostname, requestedExposure: "non-local", modeledExposure, peerMetadata: "synthetic-non-local-peer", recovery: null },
        { case: "peer-address-metadata", requestedBind: capturedHostname, requestedExposure: "peer-observation", modeledExposure, peerMetadata: adapter.locality === "unix" ? "synthetic-filesystem-owner" : "synthetic-address-only", recovery: null },
        { case: "recovery", requestedBind: capturedHostname, requestedExposure: "recovery", modeledExposure, peerMetadata: "synthetic-recovered-peer", recovery: adapter.locality === "unix" ? "remove-stale-endpoint-and-recreate" : "rebind-modeled-endpoint" },
    ].map((x) => ({ ...x, callerAuthorityChanged: false, actualNetworkTested: false, fidelity: "data-model-only" }));
}

async function committedEntries() {
    const rows = JSON.parse(await readFile(resolve(repo, reconciliationPath), "utf8"));
    return Promise.all(rows.map(async (row: any) => {
        const rel = row.source.replace(/^src\//, "");
        const meta: any = classify(rel);
        assert.ok(meta.kind === "route" || meta.kind === "script", row.source);
        assert.equal(hash(await readFile(resolve(repo, row.source))), row.sourceSha256, `source drift: ${row.source}`);
        return { ...meta, root: "src", rootDir: resolve(repo, "src"), abs: resolve(repo, row.source) };
    }));
}

async function executeCommittedPath() {
    const entries = await committedEntries();
    const ctx: any = { routes: {}, fns: { project: { scan: async () => entries }, http: { match } } };
    const oldLog = console.log;
    console.log = () => {};
    try { await loadRoutes(ctx); } finally { console.log = oldLog; }
    const committedHandler = ctx.routes["/repl"]?.POST;
    assert.equal(typeof committedHandler, "function");
    const committedRouteCount = Object.values(ctx.routes).reduce((n: number, methods: any) => n + Object.keys(methods).length, 0);
    ctx.fns.project.scan = async () => [{ kind: "route", rel: fixturePath, moduleDir: ".protocols/experiments", fileName: "r032-route-v5.fixture.ts", routePath: "/repl", method: "POST", root: "synthetic", rootDir: repo, abs: resolve(repo, fixturePath) }];
    console.log = () => {};
    try { await loadRoutes(ctx); } finally { console.log = oldLog; }
    const overriddenHandler = ctx.routes["/repl"]?.POST;
    assert.notEqual(overriddenHandler, committedHandler);
    return { ctx, entries, committedHandler, overriddenHandler, committedRouteCount };
}

async function captureStartDispatch() {
    const calls: string[] = [];
    let serveOptions: any;
    const old: any = { serve: Bun.serve, file: Bun.file, write: Bun.write, connect: (Bun as any).connect, fetch: globalThis.fetch, ws: globalThis.WebSocket, log: console.log };
    (Bun as any).serve = (options: any) => { calls.push("Bun.serve:intercepted-no-listener"); serveOptions = options; return { timeout() {} }; };
    (Bun as any).file = () => ({ writer: () => ({ write() {}, flush() {} }) });
    (Bun as any).write = async () => { calls.push("Bun.write:intercepted-no-write"); return 0; };
    (Bun as any).connect = () => { throw Error("STOP-03:Bun.connect"); };
    (globalThis as any).fetch = () => { throw Error("STOP-03:fetch"); };
    (globalThis as any).WebSocket = class { constructor() { throw Error("STOP-03:WebSocket"); } };
    console.log = () => {};
    const root = { calls: 0 };
    const handler = async () => { root.calls++; return new Response("safe-spy"); };
    const ctx: any = { env: { PORT: "31337" }, state: {}, routes: { "/probe": { POST: handler } }, fns: { http: { match } } };
    try {
        await startHttp(ctx);
        const response = await serveOptions.fetch(new Request("http://synthetic.invalid/probe", { method: "POST" }));
        assert.equal(await response.text(), "safe-spy");
    } finally {
        (Bun as any).serve = old.serve; (Bun as any).file = old.file; (Bun as any).write = old.write; (Bun as any).connect = old.connect;
        (globalThis as any).fetch = old.fetch; (globalThis as any).WebSocket = old.ws; console.log = old.log;
    }
    return { requestedHostname: serveOptions.hostname, requestedPort: serveOptions.port, matchedAndDispatched: root.calls === 1, handlerCalls: root.calls, interceptedCalls: calls };
}

export async function executeV5() {
    const loaded = await executeCommittedPath();
    const start = await captureStartDispatch();
    const rows = adapters.map((adapter: any) => {
        const policy = defaultPolicy(adapter);
        const routeCases = ["committed", "late", "unclassified", "override"].map((routeCase) => {
            const inherited = routeCase !== "committed";
            const effectivePolicy: Policy = inherited ? policy : "privileged";
            const missing = authorize(adapter, effectivePolicy, "missing");
            const sufficient = authorize(adapter, effectivePolicy, "sufficient");
            return { routeCase, declaredAuthority: "privileged", inherited, effectivePolicy, missing, sufficient, handlerReachedMissing: missing.allow, authorityRootReachedMissing: missing.allow, bypassObserved: missing.allow };
        });
        const restartControlled = !!(adapter.identity || adapter.capability || adapter.broker);
        const stale = authorize(adapter, "privileged", "sufficient", !restartControlled);
        const missingAfterRestart = restartControlled ? { allow: false, reason: "missing-after-restart" } : authorize(adapter, "privileged", "missing", true);
        const fresh = authorize(adapter, "privileged", "sufficient", true);
        return {
            adapter: adapter.id,
            committedPath: { loadedEntryCount: loaded.entries.length, loadedRouteCount: loaded.committedRouteCount, actualOverrideReplacedHandler: loaded.committedHandler !== loaded.overriddenHandler, loaderAuthorityPolicyField: false, exactStop: "committed loadRoutes registers and overwrites handlers but has no authority default/inheritance contract" },
            dispatchPath: start,
            routeCases,
            reachability: reachability(adapter, start.requestedHostname),
            clients: (["browser", "cli"] as const).map((kind) => ({ kind, transitions: lifecycle(adapter, kind) })),
            restart: { controlled: restartControlled, stale: { decision: stale, rootCalls: stale.allow ? 1 : 0 }, missing: { decision: missingAfterRestart, rootCalls: missingAfterRestart.allow ? 1 : 0 }, fresh: { decision: fresh, rootCalls: fresh.allow ? 1 : 0 }, retainedAuthority: adapter.residual },
            fidelity: adapter.id === "CAN-06" ? "in-process-broker-label-only; incompatible-with-process-separation-claim" : "committed-loader-and-dispatch-plus-disposable-policy-adapter",
            gateAssessment: "not-reviewed",
        };
    });
    return rows;
}

async function cmd(args: string[]) {
    const p = Bun.spawn(args, { cwd: repo, env: { PATH: process.env.PATH ?? "/usr/bin:/bin" }, stdout: "pipe", stderr: "pipe" });
    const [out, err, code] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
    assert.equal(code, 0, `${args.join(" ")}: ${err}`); return out.trim();
}

async function main() {
    assert.equal(await cmd(["git", "diff", "--name-only", baseline, "--", "src"]), "");
    assert.equal(await cmd(["git", "status", "--short", "--", "src"]), "");
    const results = await executeV5();
    assert.equal(results.length, 9);
    const instrumentPaths = [".protocols/experiments/r032-committed-route-v5.ts", ".protocols/experiments/r032-committed-route-v5.test.ts", fixturePath, ".protocols/experiments/r032-dispatch-chain-v3.ts"];
    const reconciledSources = JSON.parse(await readFile(resolve(repo, reconciliationPath), "utf8")).map((row: any) => row.source);
    const sourcePaths = [...new Set(["src/http/$start.ts", "src/http/loadRoutes.ts", "src/http/match.ts", "src/project/classify.ts", reconciliationPath, ...reconciledSources])] as string[];
    const hashes = async (paths: string[]) => Object.fromEntries(await Promise.all(paths.map(async (path) => [path, hash(await readFile(resolve(repo, path)))])));
    const artifacts: Record<string, unknown> = {
        "manifest.json": { classification: "bounded-committed-route-plus-candidate-coupled-lifecycle", candidates: adapters.map((x) => x.id), routeCases: ["committed", "late", "unclassified", "override"], reachabilityCases: ["default-locality", "explicit-non-local-request", "peer-address-metadata", "recovery"], clients: ["browser", "cli"], completeMatrix: false, excludedCombinations: "Only predeclared CAN/COM labels are present; no Cartesian expansion.", exactStop: "Authority default/inheritance is absent from committed loadRoutes; arbitrary .hyper overlay scanning is prohibited because it would read user runtime state." },
        "results.json": results,
        "summary.json": results.map((r) => ({ adapter: r.adapter, committedEntries: r.committedPath.loadedEntryCount, committedRoutes: r.committedPath.loadedRouteCount, overrideReplaced: r.committedPath.actualOverrideReplacedHandler, missingBypasses: r.routeCases.filter((x) => x.bypassObserved).map((x) => x.routeCase), staleRootCalls: r.restart.stale.rootCalls, missingRootCalls: r.restart.missing.rootCalls, fidelity: r.fidelity, gateAssessment: "not-reviewed" })),
        "provenance.json": { runId, date: "2026-08-13", executionHead: await cmd(["git", "rev-parse", "HEAD"]), baseline, bun: Bun.version, git: await cmd(["git", "--version"]), platform: { platform: platform(), arch: arch(), release: release() }, environmentKeys: Object.keys(process.env).sort(), sourceHashes: await hashes(sourcePaths), instrumentHashes: await hashes(instrumentPaths), safety: { realListenerOpened: false, realSocketOpened: false, realNetworkAccess: false, realSecretRead: false, userRuntimeStateRead: false, srcChanged: false, runtimeConfigurationChanged: false, mechanismSelected: false, writes: "carrier-only" } },
        "review.json": { status: "pending-independent-review", synthesisAuthorized: false, mechanismSelected: false, gateAssessment: "not-reviewed", required: ["committed loader fidelity", "intercepted start/fetch fidelity", "candidate-policy coupling", "route bypass interpretation", "reachability separation", "restart retained-authority", "nine-label symmetry", "provenance and STOP boundary"] },
    };
    await mkdir(runDir, { recursive: true });
    for (const [name, value] of Object.entries(artifacts)) await writeFile(resolve(runDir, name), JSON.stringify(value, null, 2) + "\n");
    await writeFile(resolve(runDir, "README.md"), "# R-032 committed-route and coupled-lifecycle v5\n\nThis additive carrier executes the committed `http.loadRoutes`, `http.match`, and intercepted `$start.fetch` paths without opening a listener or invoking a production handler. It replays 36 fixed-baseline committed entries: 34 imported route modules and two script GET registrations. It observes real handler overwrite through the committed loader, then applies one mechanism-neutral policy/authority wrapper symmetrically to all nine predeclared labels. Browser and CLI lifecycle decisions call that same authorization adapter; restart cases record retained root authority. Requested bind and modeled reachability remain separate and no actual reachability is claimed.\n\nExact STOP boundary: committed `loadRoutes` has no authority-policy/default/inheritance field, and arbitrary `.hyper` scanning would read prohibited user runtime state. Therefore candidate defaults/inheritance and the synthetic overlay entry are prototype evidence, not current runtime policy or arbitrary-overlay proof. CAN-06 remains incompatible with a process-separation conclusion. The full matrix remains incomplete; all gates are not-reviewed, synthesis is unauthorized, and no mechanism is selected.\n");
    const names = [...Object.keys(artifacts), "README.md"].sort();
    await writeFile(resolve(runDir, "SHA256SUMS"), (await Promise.all(names.map(async (name) => `${hash(await readFile(resolve(runDir, name)))}  ${name}`))).join("\n") + "\n");
    console.log(JSON.stringify({ runId, labels: results.length, review: "pending", synthesisAuthorized: false }, null, 2));
}

if (import.meta.main) await main();
