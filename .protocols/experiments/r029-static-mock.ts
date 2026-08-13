import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import classify from "../../src/project/classify";
import startServer from "../../src/http/$start";
import match from "../../src/http/match";
import loadRoutes from "../../src/http/loadRoutes";
import replRoute from "../../src/repl/$route__POST";
import filesPutRoute from "../../src/files/$route__PUT";
import eventsClientRoute from "../../src/events/$route_client.js_GET";
import agentPostRoute from "../../src/agent/$route_$id_POST";
import forkRoute from "../../src/agent/$route_$id_fork_POST";
import stopRoute from "../../src/agent/$route_$id_stop_POST";
import settingsStatusRoute from "../../src/settings/$route__GET";
import settingsEnvRoute from "../../src/settings/$route_env_POST";

const repositoryRoot = resolve(import.meta.dir, "../..");
const runId = "2026-08-13-d119f1c-static-mock";
const runDir = resolve(repositoryRoot, ".protocols/experiments/runs/R-029", runId);

type Authority =
    | "in_process_eval"
    | "shell"
    | "filesystem_read"
    | "filesystem_write"
    | "git_mutation_or_push"
    | "settings_or_credentials"
    | "provider_or_model_invocation"
    | "agent_or_session_mutation"
    | "server_or_process_control";

type InventoryRow = {
    method: string;
    path: string;
    source: string;
    loaderRule: "route" | "script";
    dependencies: string[];
    authority: Array<{ class: Authority; reach: "direct" | "transitive"; note: string }>;
    callerControls: string[];
    responseAndError: string;
    sourceSha256: string;
};

const routeNotes: Record<string, { authority?: InventoryRow["authority"]; response: string }> = {
    "src/$route_GET.ts": { response: "302 to first agent or rendered empty-state page" },
    "src/agent/$route_$id_DELETE.ts": { authority: direct("agent_or_session_mutation", "clear/delete agent state"), response: "200 JSON; session delete exceptions are logged and suppressed" },
    "src/agent/$route_$id_GET.ts": { authority: direct("agent_or_session_mutation", "read durable agent/session state"), response: "404 or rendered agent page" },
    "src/agent/$route_$id_POST.ts": { authority: [
        ...direct("agent_or_session_mutation", "append message and schedule worker"),
        ...transitive("provider_or_model_invocation", "scheduled worker later invokes the configured model"),
        ...transitive("in_process_eval", "model output may request an eval marker"),
        ...transitive("shell", "model output may request a bash marker"),
        ...transitive("filesystem_read", "model output may request read/grep markers"),
        ...transitive("filesystem_write", "model output may request write/edit markers"),
        ...transitive("git_mutation_or_push", "bash/eval authority can invoke git"),
    ], response: "404/400, 204/303, or 200 JSON; worker execution is deferred" },
    "src/agent/$route_$id_archive_POST.ts": { authority: direct("agent_or_session_mutation", "archive durable agent and remove runtime view"), response: "303; archive exceptions are logged and suppressed" },
    "src/agent/$route_$id_delete_POST.ts": { authority: direct("agent_or_session_mutation", "delete durable agent and runtime view"), response: "303" },
    "src/agent/$route_$id_events.html_GET.ts": { authority: direct("agent_or_session_mutation", "read durable event/run state"), response: "404 or event HTML fragment" },
    "src/agent/$route_$id_events_GET.ts": { authority: direct("agent_or_session_mutation", "load agent and read durable events/run state"), response: "404 or 200 JSON" },
    "src/agent/$route_$id_fork_POST.ts": { authority: direct("agent_or_session_mutation", "create durable child agent"), response: "404 or 303 to child" },
    "src/agent/$route_$id_messages_delete_POST.ts": { authority: direct("agent_or_session_mutation", "delete/truncate durable messages"), response: "404/400 or 303" },
    "src/agent/$route_$id_status_GET.ts": { authority: direct("agent_or_session_mutation", "read durable run state"), response: "404 or 200 JSON" },
    "src/agent/$route_$id_statusbar_GET.ts": { authority: direct("agent_or_session_mutation", "read durable run state"), response: "404 or status HTML" },
    "src/agent/$route_$id_stop_POST.ts": { authority: [
        ...direct("server_or_process_control", "abort an in-process agent run"),
        ...direct("agent_or_session_mutation", "optionally clear queued work"),
    ], response: "303" },
    "src/agent/$route_new_GET.ts": { authority: [
        ...direct("settings_or_credentials", "enumerate provider/model availability through llm.listModels"),
    ], response: "rendered new-agent form" },
    "src/agent/$route_new_POST.ts": { authority: direct("agent_or_session_mutation", "create and persist an agent"), response: "303 to created agent" },
    "src/dev/$route_fail_GET.ts": { response: "always throws" },
    "src/events/$route__GET.ts": { authority: direct("server_or_process_control", "register process-local subscriber and keepalive timer"), response: "200 event-stream until abort" },
    "src/events/$route_client.js_GET.ts": { authority: direct("filesystem_read", "read shipped browser script"), response: "200 JavaScript response; read errors propagate" },
    "src/files/$route_GET.ts": { authority: direct("filesystem_read", "resolve/list/read project files and metadata"), response: "404 or rendered directory/file view; dependency errors may propagate" },
    "src/files/$route__POST.ts": { authority: direct("filesystem_write", "write caller-selected project-relative path"), response: "400 or 303; dependency errors propagate" },
    "src/files/$route__PUT.ts": { authority: direct("filesystem_write", "write caller-selected project-relative path"), response: "400 or 200 JSON; dependency errors propagate" },
    "src/files/$route_close_POST.ts": { authority: direct("agent_or_session_mutation", "mutate process-local open-file state"), response: "303" },
    "src/repl/$route__POST.ts": { authority: [
        ...direct("in_process_eval", "pass caller body to repl.eval inside server process"),
        ...transitive("shell", "evaluated code has process/Bun authority"),
        ...transitive("filesystem_read", "evaluated code has process/Bun authority"),
        ...transitive("filesystem_write", "evaluated code has process/Bun authority"),
        ...transitive("git_mutation_or_push", "evaluated code can invoke git"),
        ...transitive("settings_or_credentials", "evaluated code receives ctx and process globals"),
        ...transitive("provider_or_model_invocation", "evaluated code receives the function registry"),
        ...transitive("agent_or_session_mutation", "evaluated code receives ctx state and functions"),
        ...transitive("server_or_process_control", "evaluated code runs in the server process"),
    ], response: "200 JSON on eval success or 500 JSON including error/stack" },
    "src/settings/$route__GET.ts": { authority: direct("settings_or_credentials", "settings.status reads env and CLI credential-file status"), response: "rendered settings page" },
    "src/settings/$route_codex_login_POST.ts": { authority: [
        ...direct("settings_or_credentials", "start Codex device login"),
        ...transitive("shell", "startCodexLogin spawns the codex CLI"),
        ...transitive("filesystem_write", "the CLI may write its auth file"),
    ], response: "303; dependency failure stored in process state" },
    "src/settings/$route_codex_logout_POST.ts": { authority: [
        ...direct("settings_or_credentials", "delete Codex auth and login state"),
        ...transitive("filesystem_write", "logout removes credential file"),
        ...transitive("server_or_process_control", "logout may kill login child process"),
    ], response: "303" },
    "src/settings/$route_declared_GET.ts": { authority: direct("settings_or_credentials", "read declared/default/persisted setting values"), response: "rendered settings form" },
    "src/settings/$route_declared_POST.ts": { authority: [
        ...direct("settings_or_credentials", "set/remove persisted settings, including secret-typed values"),
        ...direct("agent_or_session_mutation", "mutate settings rows"),
    ], response: "200 settings HTML; invalid values are ignored" },
    "src/settings/$route_env_POST.ts": { authority: [
        ...direct("settings_or_credentials", "accept arbitrary valid env-key/value pair"),
        ...transitive("filesystem_read", "saveEnv reads project .env"),
        ...transitive("filesystem_write", "saveEnv rewrites project .env"),
    ], response: "400 or 303; dependency errors propagate" },
    "src/settings/$route_kimi_login_POST.ts": { authority: [
        ...direct("settings_or_credentials", "start Kimi OAuth device flow"),
        ...transitive("provider_or_model_invocation", "dependency invokes an external OAuth provider"),
        ...transitive("filesystem_write", "successful polling writes credential file"),
    ], response: "303; dependency errors propagate" },
    "src/settings/$route_kimi_logout_POST.ts": { authority: [
        ...direct("settings_or_credentials", "delete Kimi credential and login state"),
        ...transitive("filesystem_write", "logout removes credential file"),
    ], response: "303" },
    "src/ui/$route_control.js_GET.ts": { authority: direct("filesystem_read", "build/read browser-control script through ui.controlScript"), response: "200 JavaScript; dependency errors propagate" },
    "src/ui/$route_eval_result_POST.ts": { authority: direct("agent_or_session_mutation", "complete an in-process pending UI eval entry"), response: "400/404 or 200 JSON" },
    "src/ui/$route_ping_GET.ts": { response: "200 JSON" },
};

function direct(authority: Authority, note: string): InventoryRow["authority"] {
    return [{ class: authority, reach: "direct", note }];
}
function transitive(authority: Authority, note: string): InventoryRow["authority"] {
    return [{ class: authority, reach: "transitive", note }];
}

function sha256(input: string | Uint8Array) {
    return createHash("sha256").update(input).digest("hex");
}

async function command(args: string[]) {
    const proc = Bun.spawn(args, { cwd: repositoryRoot, stdout: "pipe", stderr: "pipe", env: {} });
    const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited,
    ]);
    if (exitCode !== 0) throw new Error(`${args.join(" ")} failed: ${stderr.trim()}`);
    return stdout.trim();
}

function dependencies(source: string): string[] {
    const out = new Set<string>();
    for (const m of source.matchAll(/ctx\.fns\.([A-Za-z0-9_?.]+)/g)) out.add(m[1]!.replace(/[?.]+$/, ""));
    for (const m of source.matchAll(/\bBun\.([A-Za-z0-9_]+)/g)) out.add(`Bun.${m[1]}`);
    for (const m of source.matchAll(/from ["'](node:[^"']+)["']/g)) out.add(m[1]!);
    return [...out].sort();
}

async function inventory() {
    const glob = new Bun.Glob("**/*");
    const entries: Array<{ rel: string; meta: ReturnType<typeof classify> }> = [];
    for await (const rel of glob.scan({ cwd: resolve(repositoryRoot, "src"), onlyFiles: true })) {
        const meta = classify(rel);
        if (meta.kind === "route" || meta.kind === "script") entries.push({ rel, meta });
    }
    entries.sort((a, b) => a.rel.localeCompare(b.rel));

    const rows: InventoryRow[] = [];
    for (const { rel, meta } of entries) {
        const sourcePath = `src/${rel}`;
        const source = await readFile(resolve(repositoryRoot, sourcePath), "utf8");
        if (meta.kind === "script") {
            rows.push({
                method: "GET", path: meta.routePath, source: sourcePath, loaderRule: "script",
                dependencies: dependencies(source),
                authority: [
                    ...direct("filesystem_read", "loader bundles and serves script source"),
                    ...direct("filesystem_write", "loader writes bundle under runtime script cache"),
                    ...direct("server_or_process_control", "loader invokes Bun.build in process"),
                ],
                callerControls: [], responseAndError: "200 built asset; build/read errors propagate",
                sourceSha256: sha256(source),
            });
            continue;
        }
        const note = routeNotes[sourcePath];
        assert(note, `missing review note for ${sourcePath}`);
        rows.push({
            method: meta.method, path: meta.routePath, source: sourcePath, loaderRule: "route",
            dependencies: dependencies(source), authority: note.authority ?? [], callerControls: [],
            responseAndError: note.response, sourceSha256: sha256(source),
        });
    }

    const routeFiles = rows.filter(row => row.loaderRule === "route").length;
    const scripts = rows.filter(row => row.loaderRule === "script").length;
    assert.equal(routeFiles, Object.keys(routeNotes).length, "route file/manual-review reconciliation");
    assert.equal(new Set(rows.map(row => `${row.method} ${row.path}`)).size, rows.length, "unique dispatch keys");
    return { rows, routeFiles, scripts };
}

async function mockedChecks() {
    const cases: any[] = [];
    const record = (name: string, authority: Authority[], input: string, reached: string[], status: number | string, note: string) =>
        cases.push({ name, authority, input, reached, status, note });

    const original = { serve: Bun.serve, file: Bun.file, write: Bun.write, build: Bun.build };
    const captured: any = { writes: [], builds: [], files: [], serveCalls: 0 };
    try {
        (Bun as any).serve = (options: any) => {
            captured.serveCalls++;
            captured.serveOptions = options;
            return { timeout() {}, stop() { throw new Error("mock server stop must not be called"); } };
        };
        (Bun as any).file = (path: string) => {
            captured.files.push(String(path));
            return {
                writer: () => ({ write() {}, flush() {} }),
                text: async () => "/* synthetic-script */",
            };
        };
        (Bun as any).write = async (path: string, data: unknown) => {
            captured.writes.push({ path: String(path), bytes: String(data).length });
            return String(data).length;
        };
        (Bun as any).build = async (options: any) => {
            captured.builds.push({ entrypoints: options.entrypoints.map((x: string) => relative(repositoryRoot, x)), outdir: options.outdir, target: options.target });
            return { success: true, logs: [], outputs: [{ path: "/synthetic/bundle.js" }] };
        };

        const startCtx: any = {
            env: { PORT: "43111" }, state: {}, routes: { "/probe": { POST: async () => ({ accepted: true }) } },
            fns: { http: { match } },
        };
        await startServer(startCtx);
        assert.equal(captured.serveCalls, 1);
        assert.equal(captured.serveOptions.hostname, "0.0.0.0");
        assert.equal(captured.serveOptions.port, 43111);
        const dispatchRes = await captured.serveOptions.fetch(new Request("http://synthetic.invalid/probe", { method: "POST" }));
        assert.equal(dispatchRes.status, 200);
        record("listener-capture", ["server_or_process_control"], "synthetic POST; no identity", ["Bun.serve capture", "dispatcher"], 200,
            "No socket opened. Current options request hostname 0.0.0.0 and use PORT from ctx.env.");

        const scriptCtx: any = {
            routes: {},
            fns: { project: { scan: async () => [{ kind: "script", routePath: "/synthetic.js", abs: "/synthetic/source.js", fileName: "$script_synthetic.js", root: "synthetic", rel: "$script_synthetic.js" }] } },
        };
        await loadRoutes(scriptCtx);
        const scriptRes = await scriptCtx.routes["/synthetic.js"].GET();
        assert.equal(scriptRes.status, 200);
        assert.equal(captured.builds.length, 1);
        record("script-loader", ["filesystem_read", "filesystem_write", "server_or_process_control"], "synthetic GET; no identity", ["Bun.build stub", "Bun.write stub", "Bun.file stub"], 200,
            "Build/read/write roots were replaced; no shared runtime state was touched.");

        for (const auth of [undefined, "Malformed value", "Bearer synthetic-invalid"]) {
            const reached: string[] = [];
            const headers = auth ? { authorization: auth } : undefined;
            const res = await replRoute({ fns: { repl: { eval: async (_c: any, opts: any) => { reached.push(`eval:${opts.code}`); return "synthetic"; } } } } as any,
                null, new Request("http://synthetic.invalid/repl", { method: "POST", headers, body: "synthetic-code" }));
            assert.equal(res.status, 200);
            assert.equal(reached.length, 1);
            record("repl-caller-variant", ["in_process_eval", "shell", "filesystem_read", "filesystem_write", "git_mutation_or_push", "settings_or_credentials", "provider_or_model_invocation", "agent_or_session_mutation", "server_or_process_control"],
                auth ?? "missing Authorization", reached, res.status, "All identity variants reached the eval stub; no route-local caller control was observed.");
        }

        {
            const reached: string[] = [];
            const ctx: any = { fns: { files: { write: async (_c: any, opts: any) => reached.push(`write:${opts.path}:${opts.content}`) } } };
            const ok = await filesPutRoute(ctx, null, new Request("http://synthetic.invalid/files?path=synthetic.txt", { method: "PUT", headers: { authorization: "Malformed value" }, body: "synthetic" }));
            const deniedByValidation = await filesPutRoute(ctx, null, new Request("http://synthetic.invalid/files", { method: "PUT", body: "synthetic" }));
            assert.equal(ok.status, 200); assert.equal(deniedByValidation.status, 400); assert.equal(reached.length, 1);
            record("filesystem-write", ["filesystem_write"], "malformed identity + valid path; then missing path", reached, `${ok.status}/${deniedByValidation.status}`,
                "Input validation blocked a missing path, not an unauthorized caller; privileged write was stubbed.");
        }

        {
            const res = await eventsClientRoute();
            assert.equal(await res.text(), "/* synthetic-script */");
            record("filesystem-read", ["filesystem_read"], "synthetic GET; no identity", ["Bun.file stub"], res.status, "Filesystem root was stubbed.");
        }

        {
            const reached: string[] = [];
            const agent = { id: "synthetic-agent" };
            const ctx: any = { state: { agent: { [agent.id]: agent } }, fns: {
                session: { appendUserMessage: async () => { reached.push("session.appendUserMessage"); return { idx: 1 }; }, syncAgentState: () => reached.push("session.syncAgentState") },
                settings: { getNumber: () => 0 }, db: { exec: () => reached.push("db.exec") }, agent: { wakeWorker: () => reached.push("agent.wakeWorker") },
            } };
            const req: any = new Request("http://synthetic.invalid/agent/synthetic-agent", { method: "POST", headers: { authorization: "Bearer synthetic-invalid" }, body: "do synthetic work" });
            req.params = { id: agent.id };
            const res = await agentPostRoute(ctx, null, req);
            assert.equal(res.status, 200); assert(reached.includes("agent.wakeWorker"));
            record("agent-schedule", ["agent_or_session_mutation", "provider_or_model_invocation", "in_process_eval", "shell", "filesystem_read", "filesystem_write", "git_mutation_or_push"],
                "malformed bearer + valid agent/body", reached, res.status, "Synchronous route reached durable queue stubs; provider and marker execution remain deferred and were not invoked.");
        }

        {
            const reached: string[] = [];
            const ctx: any = { state: { agent: { parent: { id: "parent" } } }, fns: { session: { load: () => null, fork: () => { reached.push("session.fork"); return { id: "child" }; } } } };
            const req: any = new Request("http://synthetic.invalid/agent/parent/fork", { method: "POST" }); req.params = { id: "parent" };
            const res = await forkRoute(ctx, null, req); assert.equal(res.status, 303);
            const missing: any = new Request("http://synthetic.invalid/agent/absent/fork", { method: "POST" }); missing.params = { id: "absent" };
            const notFound = await forkRoute({ state: { agent: {} }, fns: { session: { load: () => null } } } as any, null, missing); assert.equal(notFound.status, 404);
            record("session-mutation", ["agent_or_session_mutation"], "missing identity; existing then absent resource", reached, `${res.status}/${notFound.status}`,
                "Resource existence gates mutation; no caller identity gate was observed.");
        }

        {
            const reached: string[] = [];
            const req: any = new Request("http://synthetic.invalid/agent/a/stop", { method: "POST", headers: { authorization: "Malformed value" } }); req.params = { id: "a" };
            const res = await stopRoute({ state: { agent: { a: { id: "a" } } }, fns: { agent: { stop: () => reached.push("agent.stop") } } } as any, null, req);
            assert.equal(res.status, 303); assert.deepEqual(reached, ["agent.stop"]);
            record("process-control", ["server_or_process_control", "agent_or_session_mutation"], "malformed identity", reached, res.status,
                "Malformed identity reached the process-control stub.");
        }

        {
            const reached: string[] = [];
            const ctx: any = { state: {}, fns: { settings: { status: () => { reached.push("settings.status"); return {
                openai: { set: false }, anthropic: { set: false }, kimi: { set: false }, groq: { set: false }, openrouter: { set: false },
                kimiCoding: { loggedIn: false, expSec: null }, codex: { loggedIn: false, email: null, expSec: null },
            }; } } } };
            await settingsStatusRoute(ctx);
            const form = new FormData(); form.set("key", "SYNTHETIC_KEY"); form.set("value", "synthetic-value");
            const envRes = await settingsEnvRoute({ fns: { settings: { saveEnv: (_c: any, opts: any) => reached.push(`settings.saveEnv:${Object.keys(opts.entries)[0]}`) } } } as any,
                null, new Request("http://synthetic.invalid/settings/env", { method: "POST", headers: { authorization: "Bearer synthetic-invalid" }, body: form }));
            assert.equal(envRes.status, 303);
            record("settings-credentials", ["settings_or_credentials", "filesystem_read", "filesystem_write"], "malformed bearer + synthetic values", reached, envRes.status,
                "Credential/status and env persistence roots were stubbed; no real env, home or credential store was read or written.");
        }
    } finally {
        (Bun as any).serve = original.serve;
        (Bun as any).file = original.file;
        (Bun as any).write = original.write;
        (Bun as any).build = original.build;
    }
    assert.equal(captured.serveCalls, 1, "exactly one mocked serve call");
    return { cases, captured };
}

const head = await command(["git", "rev-parse", "HEAD"]);
assert.equal(head, "d119f1c10381e489d9140c43f9fe9a878bf67255", "fixed snapshot HEAD changed; choose a new run id and review again");
const worktreeDiff = (await command(["git", "status", "--short"])).split("\n").filter(Boolean);
const sourceDiff = (await command(["git", "status", "--short", "--", "src"])).split("\n").filter(Boolean);
assert.equal(sourceDiff.length, 0, "src differs from fixed HEAD; inventory would not describe the committed snapshot");
const bunVersion = Bun.version;
const gitVersion = await command(["git", "--version"]);
const inventoryResult = await inventory();
const mockResult = await mockedChecks();

await mkdir(runDir, { recursive: true });
const provenance = {
    runId, date: "2026-08-13", head, sourceDiff, worktreeDiffAtCollection: worktreeDiff,
    tools: { bun: bunVersion, git: gitVersion },
    boundary: {
        socketOpened: false, realSecretsRead: false, realHomeRead: false, sharedRuntimeStateTouched: false,
        evidenceCarrierWritten: true, mechanismSelected: false, roots: ["src"], overlayIncluded: false,
    },
    counts: { routeFiles: inventoryResult.routeFiles, loaderScripts: inventoryResult.scripts, dispatchEntries: inventoryResult.rows.length },
};

const files: Record<string, string> = {
    "provenance.json": JSON.stringify(provenance, null, 2) + "\n",
    "route-authority-inventory.json": JSON.stringify(inventoryResult.rows, null, 2) + "\n",
    "mock-results.json": JSON.stringify(mockResult, null, 2) + "\n",
};
for (const [name, content] of Object.entries(files)) await writeFile(resolve(runDir, name), content);
const checksums = Object.entries(files).map(([name, content]) => `${sha256(content)}  ${name}`).sort().join("\n") + "\n";
await writeFile(resolve(runDir, "SHA256SUMS"), checksums);
await writeFile(resolve(runDir, "README.md"), `# R-029 static/mock run ${runId}\n\n` +
    `Fixed source snapshot: \`${head}\`. The repository worktree was dirty outside \`src/\`; ` +
    `\`provenance.json\` preserves that limitation. No socket was opened. All privileged roots used by direct-handler checks were stubs. ` +
    `The run used synthetic requests/state and did not read real environment values, home files, credentials or shared runtime state.\n\n` +
    `- \`route-authority-inventory.json\`: ${inventoryResult.rows.length} reconciled loader entries.\n` +
    `- \`mock-results.json\`: ${mockResult.cases.length} synthetic cases.\n` +
    `- \`SHA256SUMS\`: checksums for the JSON carriers.\n`);

console.log(JSON.stringify({ runDir: relative(repositoryRoot, runDir), provenance, cases: mockResult.cases.length }, null, 2));
