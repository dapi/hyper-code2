import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "../..");
const runId = "2026-08-13-e301161-executable-adapters-v2";
const runDir = resolve(root, ".protocols/experiments/runs/R-032", runId);
const baseline = "d119f1c10381e489d9140c43f9fe9a878bf67255";
const sentinel = "R032_RAW_SYNTHETIC_CREDENTIAL_7f19";
const digest = (value: string) => createHash("sha256").update(value).digest("hex");

type Id = "CAN-01"|"CAN-02"|"CAN-03"|"CAN-04"|"CAN-05"|"CAN-06"|"COM-01"|"COM-02"|"COM-03";
type Caller = "missing"|"valid-insufficient"|"valid-sufficient"|"revoked";
type Route = { id: string; authority: "ordinary"|"privileged"|"unclassified"; overlay?: boolean };
type Context = { caller: Caller; rawCredential: string; now: number; verifierUp: boolean; policyValid: boolean; brokerUp: boolean };
type Decision = { allow: boolean; reason: string; bound?: { kind: string; subject: string; scope: string; credentialDigest: string } };
type Adapter = {
    id: Id; label: string; transport: (requested: "local"|"non-local", client: "browser"|"cli") => { allow: boolean; channel: string; recovery: string };
    decide: (route: Route, ctx: Context) => Decision;
    deferred: (bound: Decision["bound"], state: Caller, ctx: Context) => Decision;
    classify: (route: Route, ctx: Context) => Decision;
    residual: string;
};

const noAuthority = (route: Route): Decision => ({ allow: true, reason: `no-caller-control:${route.authority}` });
const verified = (kind: string) => (route: Route, ctx: Context): Decision => {
    if (!ctx.verifierUp || !ctx.policyValid) return { allow: false, reason: "authority-service-fail-closed" };
    if (route.authority === "ordinary") return { allow: true, reason: "ordinary" };
    if (route.authority === "unclassified") return { allow: false, reason: "unclassified-deny" };
    if (ctx.caller !== "valid-sufficient") return { allow: false, reason: `deny:${ctx.caller}` };
    return { allow: true, reason: "authorized", bound: { kind, subject: "synthetic-user", scope: "privileged", credentialDigest: digest(ctx.rawCredential) } };
};
const deferredNone = (_bound: Decision["bound"], _state: Caller): Decision => ({ allow: true, reason: "no-deferred-authority-recheck" });
const deferredVerified = (bound: Decision["bound"], state: Caller, ctx: Context): Decision => {
    if (!ctx.verifierUp || !ctx.policyValid) return { allow: false, reason: "deferred-service-fail-closed" };
    if (!bound) return { allow: false, reason: "missing-bound-authority" };
    return state === "valid-sufficient" ? { allow: true, reason: "deferred-recheck-authorized", bound } : { allow: false, reason: `deferred-deny:${state}`, bound };
};
const local = (kind: "loopback"|"unix"|"unrestricted") => (requested: "local"|"non-local", client: "browser"|"cli") => ({
    allow: requested === "local" || kind === "unrestricted",
    channel: kind === "unix" && client === "browser" ? "local-browser-bridge" : kind === "unix" ? "private-unix-client" : client === "browser" ? "http-only-local-session" : "private-cli-channel",
    recovery: kind === "unix" ? "recreate-stale-endpoint-and-bridge" : "restart-and-revalidate",
});
const separated = (inner: Adapter["decide"]): Adapter["decide"] => (route, ctx) => route.authority === "unclassified" ? { allow: false, reason: "route-partition-default-deny" } : inner(route, ctx);
const brokered = (inner: Adapter["decide"]): Adapter["decide"] => (route, ctx) => !ctx.brokerUp ? { allow: false, reason: "broker-fail-closed" } : inner(route, ctx);

export const adapters: Adapter[] = [
    { id:"CAN-01",label:"loopback",transport:local("loopback"),decide:noAuthority,deferred:deferredNone,classify:noAuthority,residual:"single-process-root", },
    { id:"CAN-02",label:"unix",transport:local("unix"),decide:noAuthority,deferred:deferredNone,classify:noAuthority,residual:"single-process-root", },
    { id:"CAN-03",label:"identity-policy",transport:local("unrestricted"),decide:verified("identity"),deferred:deferredVerified,classify:verified("identity"),residual:"single-process-root", },
    { id:"CAN-04",label:"capability",transport:local("unrestricted"),decide:verified("capability"),deferred:deferredVerified,classify:verified("capability"),residual:"single-process-root", },
    { id:"CAN-05",label:"route-separation",transport:local("unrestricted"),decide:separated(noAuthority),deferred:deferredNone,classify:separated(noAuthority),residual:"partitioned-single-process-root", },
    { id:"CAN-06",label:"broker",transport:local("unrestricted"),decide:brokered(noAuthority),deferred:deferredNone,classify:brokered(noAuthority),residual:"stub-broker-root", },
    { id:"COM-01",label:"loopback-identity",transport:local("loopback"),decide:verified("identity"),deferred:deferredVerified,classify:verified("identity"),residual:"single-process-root", },
    { id:"COM-02",label:"unix-capability",transport:local("unix"),decide:verified("capability"),deferred:deferredVerified,classify:verified("capability"),residual:"single-process-root", },
    { id:"COM-03",label:"layered",transport:local("loopback"),decide:brokered(separated(verified("identity"))),deferred:deferredVerified,classify:brokered(separated(verified("identity"))),residual:"stub-broker-root", },
];

const routes: Route[] = [
    { id:"committed-ordinary", authority:"ordinary" },
    { id:"committed-privileged", authority:"privileged" },
    { id:"late-unclassified", authority:"unclassified" },
    { id:"overlay-override", authority:"privileged", overlay:true },
];
const baseContext = (caller: Caller): Context => ({ caller, rawCredential: sentinel, now: 1_723_520_000, verifierUp:true, policyValid:true, brokerUp:true });

function scan(value: unknown) { return JSON.stringify(value).includes(sentinel); }
function sanitizedSinks(adapter: Adapter, decision: Decision) {
    const event = { adapter:adapter.id, allow:decision.allow, reason:decision.reason, authority:decision.bound ? { ...decision.bound } : null };
    return { log:event, render:event, transcript:event, result:event, modelInput:event, persistence:event };
}

export function executeAdapter(adapter: Adapter) {
    const cells: any[] = [];
    const privileged = routes[1]!;
    for (const caller of ["missing","valid-insufficient","valid-sufficient"] as Caller[]) {
        let roots = 0;
        const decision = adapter.decide(privileged, baseContext(caller));
        if (decision.allow) roots++;
        cells.push({ axis:"immediate", case:`privileged:${caller}`, decision, handlerReached:decision.allow, authorityRootCalls:roots });
    }
    const ordinary = adapter.decide(routes[0]!, baseContext("missing"));
    cells.push({ axis:"immediate", case:"ordinary:missing", decision:ordinary, handlerReached:ordinary.allow, authorityRootCalls:0 });
    const enqueue = adapter.decide(privileged, baseContext("valid-sufficient"));
    for (const state of ["valid-sufficient","revoked","missing"] as Caller[]) {
        let roots = 0;
        const decision = adapter.deferred(enqueue.bound, state, baseContext(state));
        if (decision.allow) roots++;
        cells.push({ axis:"deferred", case:`use:${state}`, decision, boundAtEnqueue:enqueue.bound ?? null, authorityRootCalls:roots });
    }
    for (const route of routes.slice(2)) {
        let roots = 0;
        const decision = adapter.classify(route, baseContext("missing"));
        if (decision.allow) roots++;
        cells.push({ axis:"route-lifecycle", case:route.id, decision, authorityRootCalls:roots });
    }
    for (const failure of ["verifier","policy","broker"] as const) {
        const ctx = baseContext("valid-sufficient");
        if (failure === "verifier") ctx.verifierUp=false;
        if (failure === "policy") ctx.policyValid=false;
        if (failure === "broker") ctx.brokerUp=false;
        let roots=0; const decision=adapter.decide(privileged,ctx); if(decision.allow) roots++;
        cells.push({ axis:"failure", case:`${failure}-down`, decision, authorityRootCalls:roots });
    }
    for (const client of ["browser","cli"] as const) for (const phase of ["start","expiry","recovery"] as const) {
        const transport=adapter.transport("local",client);
        const authority=phase==="expiry" ? adapter.decide(privileged,baseContext("revoked")) : adapter.decide(privileged,baseContext("valid-sufficient"));
        cells.push({ axis:"local-ux",case:`${client}:${phase}`,transport,authority,userVisible:!authority.allow?"reauthorize":phase==="recovery"?transport.recovery:"ready" });
    }
    const nonTransitDecision=adapter.decide(privileged,baseContext("valid-sufficient"));
    const sinks=sanitizedSinks(adapter,nonTransitDecision);
    const sinkCounts=Object.fromEntries(Object.entries(sinks).map(([name,value])=>[name,scan(value)?1:0]));
    cells.push({ axis:"non-transit",case:"raw-sentinel-through-adapter",rawInjected:true,sinkCounts,detected:Object.values(sinkCounts).some(Boolean) });
    return cells;
}

async function command(args:string[]) { const p=Bun.spawn(args,{cwd:root,stdout:"pipe",stderr:"pipe",env:{PATH:process.env.PATH??"/usr/bin:/bin"}}); const [o,e,c]=await Promise.all([new Response(p.stdout).text(),new Response(p.stderr).text(),p.exited]); assert.equal(c,0,`${args.join(" ")}: ${e}`); return o.trim(); }

async function run() {
    assert.equal(await command(["git","diff","--name-only",baseline,"--","src"]),"");
    assert.equal(await command(["git","status","--short","--","src"]),"");
    const original={serve:Bun.serve,connect:(Bun as any).connect,fetch:globalThis.fetch,ws:globalThis.WebSocket}; const calls:string[]=[];
    const deny=(name:string)=>(..._args:unknown[])=>{calls.push(name);throw new Error(`prohibited:${name}`)};
    (Bun as any).serve=deny("Bun.serve");(Bun as any).connect=deny("Bun.connect");(globalThis as any).fetch=deny("fetch");(globalThis as any).WebSocket=class{constructor(){calls.push("WebSocket");throw new Error("prohibited:WebSocket")}};
    let results:any[]; try { results=adapters.flatMap(adapter=>executeAdapter(adapter).map(cell=>({adapter:adapter.id,...cell}))); } finally {(Bun as any).serve=original.serve;(Bun as any).connect=original.connect;(globalThis as any).fetch=original.fetch;(globalThis as any).WebSocket=original.ws}
    assert.deepEqual(calls,[]);
    const positive={ fixture:"deliberately-leaky-detector-control", detected:scan({modelInput:sentinel}) }; assert.equal(positive.detected,true);
    const negative={ fixture:"sanitized-detector-control", detected:scan({modelInput:{credentialDigest:digest(sentinel)}}) }; assert.equal(negative.detected,false);
    const perAdapter=adapters.map(adapter=>{const rows=results.filter(r=>r.adapter===adapter.id);return {adapter:adapter.id,executedCells:rows.length,axes:[...new Set(rows.map(r=>r.axis))],preservedFailures:rows.filter(r=>r.decision?.allow===false||r.authority?.allow===false).map(r=>r.case),nonTransitDetected:rows.find(r=>r.axis==="non-transit").detected,gateAssessment:"not-reviewed"}});
    assert(perAdapter.every(x=>x.executedCells===19)); assert(perAdapter.every(x=>x.axes.length===6)); assert(perAdapter.every(x=>x.nonTransitDetected===false));
    const instrument=await readFile(import.meta.path); const test=await readFile(resolve(import.meta.dir,"r032-executable-adapters.test.ts"));
    const artifacts:Record<string,unknown>={
        "manifest.json":{classification:"bounded-executed-representative-subset",adapters:adapters.map(({id,label,residual})=>({id,label,residual})),routes,cellsPerAdapter:19,axes:["immediate","deferred","route-lifecycle","failure","local-ux","non-transit"],notFullMatrix:true,fullContractModelCarrier:"../2026-08-13-e301161-authority-contract-v1/README.md"},
        "executed-results.json":results,"summary.json":perAdapter,"detector-controls.json":{sentinelDigest:digest(sentinel),rawSentinelStored:false,positive,negative},
        "provenance.json":{runId,date:"2026-08-13",executionHead:await command(["git","rev-parse","HEAD"]),sourceBaseline:baseline,instruments:[{path:".protocols/experiments/r032-executable-adapters.ts",sha256:digest(instrument.toString())},{path:".protocols/experiments/r032-executable-adapters.test.ts",sha256:digest(test.toString())}],environmentKeys:Object.keys(process.env).sort(),networkCalls:calls,boundary:{realTransport:false,realSecret:false,userState:false,productionSourceChange:false,mechanismSelected:false}},
        "review.json":{status:"pending-independent-review",synthesisAuthorized:false,required:["adapter execution fidelity","representative subset symmetry","preserved failures","sentinel detector controls","gate interpretation"]},
    };
    await mkdir(runDir,{recursive:true}); for(const [n,v] of Object.entries(artifacts))await writeFile(resolve(runDir,n),JSON.stringify(v,null,2)+"\n");
    await writeFile(resolve(runDir,"README.md"),`# R-032 bounded adapter-decision carrier\n\nThis additive carrier directly executes the decision, deferred-decision, classification and transport methods of nine disposable adapters over 19 identical representative cells each (171 total). It does not execute a common dispatcher, handler or authority-root spy chain and therefore supplies no handler/root boundary evidence. It is deliberately not the full 3,663-row matrix. It preserves denied and uncovered decision outcomes, injects a raw synthetic sentinel into every adapter decision fixture, proves the detector with a deliberately leaky positive control and a sanitized negative control, and records zero downstream sentinel detections for its generated sink projections.\n\nNo listener/socket, real secret, user state or production source is used. Results remain disposable in-process adapter-decision behavior, not OS/network/identity-provider/cryptographic/process-isolation proof. Gate assessment is not-reviewed; independent review is required and R-032 remains collecting.\n`);
    const names=[...Object.keys(artifacts),"README.md"].sort(); const sums=[];for(const n of names)sums.push(`${digest(await readFile(resolve(runDir,n)))}  ${n}`);await writeFile(resolve(runDir,"SHA256SUMS"),sums.join("\n")+"\n");
    console.log(JSON.stringify({runId,adapters:9,cellsPerAdapter:19,total:results.length,positiveDetector:positive.detected,negativeDetector:negative.detected,review:"pending"},null,2));
}
if(import.meta.main){if(process.env.R032_EXEC_CONTAINED==="1")await run();else{const p=Bun.spawn([process.execPath,import.meta.path],{cwd:root,env:{PATH:process.env.PATH??"/usr/bin:/bin",R032_EXEC_CONTAINED:"1"},stdin:"ignore",stdout:"inherit",stderr:"inherit"});process.exitCode=await p.exited}}
