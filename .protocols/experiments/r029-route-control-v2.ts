import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import classify from "../../src/project/classify";
import startServer from "../../src/http/$start";
import match from "../../src/http/match";

const repositoryRoot = resolve(import.meta.dir, "../..");
const sourceBaseline = "d119f1c10381e489d9140c43f9fe9a878bf67255";
const priorRunId = "2026-08-13-d119f1c-static-mock";
const runId = "2026-08-13-d119f1c-route-control-v2";
const runDir = resolve(repositoryRoot, ".protocols/experiments/runs/R-029", runId);
const priorInventoryPath = resolve(
    repositoryRoot,
    ".protocols/experiments/runs/R-029",
    priorRunId,
    "route-authority-inventory.json",
);

type Reach = "direct" | "transitive";
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

type PriorInventoryRow = {
    method: string;
    path: string;
    source: string;
    loaderRule: "route" | "script";
    dependencies: string[];
    authority: Array<{ class: Authority; reach: Reach; note: string }>;
    callerControls: string[];
    responseAndError: string;
    sourceSha256: string;
};

type HeaderCandidate = {
    header: string;
    classification: "content_negotiation" | "navigation_only" | "caller_authority_candidate";
    evidence: string;
};

const authorityClasses: Authority[] = [
    "in_process_eval",
    "shell",
    "filesystem_read",
    "filesystem_write",
    "git_mutation_or_push",
    "settings_or_credentials",
    "provider_or_model_invocation",
    "agent_or_session_mutation",
    "server_or_process_control",
];

const identityVariants = [
    { id: "missing", headers: {} },
    { id: "malformed", headers: { authorization: "Malformed synthetic" } },
    { id: "synthetic-invalid", headers: { authorization: "Bearer synthetic-invalid" } },
] as const;

const reviewedNonControlTerms: Record<string, Array<{ token: string; rationale: string }>> = {
    "src/settings/$route__GET.ts": [{
        token: "authorize",
        rationale: "Rendered device-flow instruction for the operator; it does not inspect or establish the HTTP caller's identity.",
    }],
    "src/settings/$route_kimi_login_POST.ts": [{
        token: "authorization",
        rationale: "Source comment naming the downstream OAuth device-authorization flow; it is not a caller control in this HTTP handler.",
    }],
};

function sha256(input: string | Uint8Array) {
    return createHash("sha256").update(input).digest("hex");
}

async function command(args: string[]) {
    const process = Bun.spawn(args, {
        cwd: repositoryRoot,
        stdout: "pipe",
        stderr: "pipe",
        env: { PATH: processEnvPath() },
    });
    const [stdout, stderr, exitCode] = await Promise.all([
        new Response(process.stdout).text(),
        new Response(process.stderr).text(),
        process.exited,
    ]);
    if (exitCode !== 0) throw new Error(`${args.join(" ")} failed: ${stderr.trim()}`);
    return stdout.trim();
}

function processEnvPath() {
    return process.env.PATH ?? "/usr/bin:/bin";
}

function concretePath(path: string) {
    return path.replace(/:([A-Za-z0-9_]+)/g, "synthetic-$1");
}

function headerCandidates(source: string): HeaderCandidate[] {
    const found = new Map<string, HeaderCandidate>();
    for (const match of source.matchAll(/\.headers\s*(?:\?\.)?\s*\.?get\s*(?:\?\.)?\s*\(\s*["']([^"']+)["']/gi)) {
        const header = match[1]!.toLowerCase();
        const classification = header === "referer"
            ? "navigation_only"
            : ["accept", "content-type", "hx-request"].includes(header)
                ? "content_negotiation"
                : "caller_authority_candidate";
        found.set(header, {
            header,
            classification,
            evidence: match[0],
        });
    }
    return [...found.values()].sort((a, b) => a.header.localeCompare(b.header));
}

function requestHeaderAccesses(source: string) {
    return [...source.matchAll(/\b(?:req|request)\.headers(?:\?\.)?/g)].map(match => match[0]);
}

function handlerSessionEvidence(source: string, loaderRule: "route" | "script") {
    if (loaderRule === "script") {
        return {
            handlerParameters: [],
            sessionParameter: null,
            sessionParameterReferences: 0,
            conclusion: "The loader-generated script handler has no caller-session parameter.",
        };
    }
    const signature = source.match(/export default (?:async )?function\s*\(([^)]*)\)/m);
    assert(signature, "route default function signature not found");
    const parameters = signature[1]!.split(",").map(item => item.trim().split(":")[0]!.trim());
    const sessionParameter = parameters[1] ?? null;
    const sessionParameterReferences = sessionParameter === "_session"
        ? [...source.matchAll(/\b_session\b/g)].length
        : 0;
    if (sessionParameter === "_session") {
        assert.equal(sessionParameterReferences, 1, "_session must remain unused outside the signature");
    }
    return {
        handlerParameters: parameters,
        sessionParameter,
        sessionParameterReferences,
        conclusion: sessionParameter === "_session"
            ? "The dispatcher-supplied session slot is explicitly unused by the handler."
            : "The handler declares no session slot that could establish caller identity.",
    };
}

function executionTiming(
    row: PriorInventoryRow,
    item: PriorInventoryRow["authority"][number],
): Array<"immediate" | "deferred"> {
    if (row.path === "/agent/:id" && row.method === "POST" && item.reach === "transitive") {
        return ["deferred"];
    }
    if (row.path === "/settings/codex/login" && item.class === "filesystem_write") {
        return ["deferred"];
    }
    if (row.path === "/settings/kimi/login") {
        if (item.class === "filesystem_write") return ["deferred"];
        if (item.class === "provider_or_model_invocation") return ["immediate", "deferred"];
    }
    return ["immediate"];
}

function authorityControlTokens(source: string) {
    const patterns = [
        /authorization/gi,
        /bearer/gi,
        /cookie/gi,
        /authenticate/gi,
        /authorize/gi,
        /caller[_-]?identity/gi,
        /principal/gi,
    ];
    return patterns.flatMap(pattern => [...source.matchAll(pattern)].map(match => match[0].toLowerCase()));
}

async function enumerateCurrentEntries() {
    const entries: Array<{ method: string; path: string; source: string; loaderRule: "route" | "script" }> = [];
    const glob = new Bun.Glob("**/*");
    for await (const rel of glob.scan({ cwd: resolve(repositoryRoot, "src"), onlyFiles: true })) {
        const metadata = classify(rel);
        if (metadata.kind === "route") {
            entries.push({ method: metadata.method, path: metadata.routePath, source: `src/${rel}`, loaderRule: "route" });
        } else if (metadata.kind === "script") {
            entries.push({ method: "GET", path: metadata.routePath, source: `src/${rel}`, loaderRule: "script" });
        }
    }
    return entries.sort((a, b) => `${a.method} ${a.path}`.localeCompare(`${b.method} ${b.path}`));
}

async function repositoryTestsFor(source: string) {
    const stem = source.replace(/\.ts$/, "").replace(/\.js$/, "");
    const candidates = [`${stem}.test.ts`, `${stem}.test.js`];
    const existing: string[] = [];
    for (const candidate of candidates) {
        if (await Bun.file(resolve(repositoryRoot, candidate)).exists()) existing.push(candidate);
    }
    return existing;
}

async function dispatchMock(rows: PriorInventoryRow[]) {
    const calls: Array<{ key: string; identityVariant: string; authorizationObserved: string | null }> = [];
    const routes: Record<string, Record<string, Function>> = {};
    for (const row of rows) {
        const bucket = (routes[row.path] ??= {});
        bucket[row.method] = async (_ctx: unknown, _session: unknown, req: Request) => {
            calls.push({
                key: `${row.method} ${row.path}`,
                identityVariant: req.headers.get("x-synthetic-identity-variant") ?? "unknown",
                authorizationObserved: req.headers.get("authorization"),
            });
            return Response.json({ reached: true });
        };
    }

    const original = { serve: Bun.serve, file: Bun.file, write: Bun.write };
    const capture: any = { serveCalls: 0, writesIntercepted: [], filesIntercepted: [] };
    try {
        (Bun as any).serve = (options: any) => {
            capture.serveCalls += 1;
            capture.options = options;
            return { timeout() {}, stop() { throw new Error("mock server stop is prohibited"); } };
        };
        (Bun as any).file = (path: string) => {
            capture.filesIntercepted.push(String(path));
            return { writer: () => ({ write() {}, flush() {} }) };
        };
        (Bun as any).write = async (path: string, value: unknown) => {
            capture.writesIntercepted.push({ path: String(path), bytes: String(value).length });
            return String(value).length;
        };

        const ctx: any = { env: { PORT: "43112" }, state: {}, routes, fns: { http: { match } } };
        await startServer(ctx);
        assert.equal(capture.serveCalls, 1);
        assert.equal(capture.options.hostname, "0.0.0.0");
        assert.equal(capture.options.port, 43112);

        for (const row of rows) {
            for (const variant of identityVariants) {
                const headers = new Headers(variant.headers);
                headers.set("x-synthetic-identity-variant", variant.id);
                const response = await capture.options.fetch(new Request(
                    `http://synthetic.invalid${concretePath(row.path)}`,
                    { method: row.method, headers },
                ));
                assert.equal(response.status, 200, `${row.method} ${row.path} ${variant.id}`);
            }
        }
    } finally {
        (Bun as any).serve = original.serve;
        (Bun as any).file = original.file;
        (Bun as any).write = original.write;
    }

    assert.equal(calls.length, rows.length * identityVariants.length);
    return { calls, capture };
}

const executionHead = await command(["git", "rev-parse", "HEAD"]);
const sourceDiffFromBaseline = await command(["git", "diff", "--name-only", sourceBaseline, "--", "src"]);
const sourceWorktreeDiff = await command(["git", "status", "--short", "--", "src"]);
assert.equal(sourceDiffFromBaseline, "", "committed src differs from the approved source baseline");
assert.equal(sourceWorktreeDiff, "", "src has worktree changes; refuse mixed-snapshot collection");

const priorRows = JSON.parse(await readFile(priorInventoryPath, "utf8")) as PriorInventoryRow[];
const enumerated = await enumerateCurrentEntries();
assert.equal(priorRows.length, 36);
assert.equal(enumerated.length, 36);
assert.deepEqual(
    enumerated.map(row => `${row.method} ${row.path} ${row.source} ${row.loaderRule}`),
    priorRows.map(row => `${row.method} ${row.path} ${row.source} ${row.loaderRule}`).sort(),
    "fresh loader enumeration does not reconcile with the prior reviewed inventory",
);

const sharedSources = ["src/http/$start.ts", "src/http/match.ts", "src/http/loadRoutes.ts"];
const sharedControlAnalysis = [];
for (const sourcePath of sharedSources) {
    const source = await readFile(resolve(repositoryRoot, sourcePath), "utf8");
    sharedControlAnalysis.push({
        source: sourcePath,
        sourceSha256: sha256(source),
        authorityControlTokens: authorityControlTokens(source),
        headerCandidates: headerCandidates(source),
        requestHeaderAccesses: requestHeaderAccesses(source),
        dispatchSessionArgumentNull: sourcePath === "src/http/$start.ts"
            ? /m\.handler\(ctx, null, req\)/.test(source)
            : null,
    });
}
assert(sharedControlAnalysis.every(item => item.authorityControlTokens.length === 0));
assert(sharedControlAnalysis.every(item => item.headerCandidates.every(candidate => candidate.classification !== "caller_authority_candidate")));
assert.equal(sharedControlAnalysis.find(item => item.source === "src/http/$start.ts")?.dispatchSessionArgumentNull, true);

const mocked = await dispatchMock(priorRows);
const reconciliation = [];
for (const row of priorRows) {
    const source = await readFile(resolve(repositoryRoot, row.source), "utf8");
    assert.equal(sha256(source), row.sourceSha256, `source hash drift: ${row.source}`);
    const candidates = headerCandidates(source);
    const rawHeaderAccesses = requestHeaderAccesses(source);
    assert.equal(rawHeaderAccesses.length, candidates.length, `dynamic or unclassified request header access: ${row.source}`);
    const controlTokens = authorityControlTokens(source);
    const reviewedTokens = reviewedNonControlTerms[row.source] ?? [];
    assert.deepEqual(
        [...controlTokens].sort(),
        reviewedTokens.map(item => item.token).sort(),
        `unreviewed authority-control token: ${row.source}`,
    );
    const authorityCandidateHeaders = candidates.filter(item => item.classification === "caller_authority_candidate");
    assert.equal(authorityCandidateHeaders.length, 0, `unreviewed header candidate: ${row.source}`);
    const repositoryTests = await repositoryTestsFor(row.source);
    const sessionEvidence = handlerSessionEvidence(source, row.loaderRule);
    const key = `${row.method} ${row.path}`;
    const dispatchCaseIds = identityVariants.map(variant => `${key}#${variant.id}`);
    assert.equal(mocked.calls.filter(call => call.key === key).length, identityVariants.length);
    const authorityWithTiming = row.authority.map(item => ({
        ...item,
        executionTiming: executionTiming(row, item),
    }));

    reconciliation.push({
        key,
        source: row.source,
        loaderRule: row.loaderRule,
        sourceSha256: row.sourceSha256,
        dependencies: row.dependencies,
        authority: authorityWithTiming,
        executionTiming: row.authority.length === 0
            ? []
            : [...new Set(authorityWithTiming.flatMap(item => item.executionTiming))],
        callerControlEvidence: {
            sharedDispatchSources: sharedSources,
            routeLocalAuthorityControlCandidates: [],
            reviewedNonControlTerms: reviewedTokens,
            routeLocalHeaderCandidates: candidates,
            requestHeaderAccessCount: rawHeaderAccesses.length,
            handlerSessionEvidence: sessionEvidence,
            conclusion: "No caller identity/authentication/authorization control is present in the common dispatch path or this route source at the fixed source baseline.",
        },
        coverage: {
            dispatchMock: dispatchCaseIds,
            handlerClassification: repositoryTests.length > 0 ? "repository_test_plus_static_control_review" : "static_only_control_review",
            repositoryTests,
            staticOnlyRationale: repositoryTests.length > 0
                ? null
                : "Caller-control absence is a source-level property: the common dispatcher mock proves all three identity variants reach this entry's handler boundary, while exact-source token/header review finds no route-local caller-authority candidate. Handler side effects are not executed.",
        },
        responseAndError: row.responseAndError,
    });
}

const authorityCoverage = authorityClasses.map(authority => {
    const paths = reconciliation.flatMap(row => row.authority
        .filter(item => item.class === authority)
        .flatMap(item => item.executionTiming.map(timing => ({
            key: row.key,
            timing,
            callGraphReach: item.reach,
            note: item.note,
        }))));
    assert(paths.length > 0, `authority class missing from inventory: ${authority}`);
    return { authority, paths };
});

const provenance = {
    runId,
    date: "2026-08-13",
    executionHead,
    sourceBaseline,
    sourceDiffFromBaseline: [],
    sourceWorktreeDiff: [],
    priorRun: priorRunId,
    tools: { bun: Bun.version, git: await command(["git", "--version"]) },
    boundary: {
        socketOpened: false,
        realSecretsRead: false,
        realHomeRead: false,
        sharedRuntimeStateTouched: false,
        projectOrRuntimeWrites: false,
        evidenceCarrierWritten: true,
        mechanismSelected: false,
        overlayIncluded: false,
    },
    counts: {
        dispatchEntries: reconciliation.length,
        identityVariantsPerEntry: identityVariants.length,
        dispatchMockCalls: mocked.calls.length,
        authorityClasses: authorityCoverage.length,
        entriesWithRepositoryTests: reconciliation.filter(row => row.coverage.repositoryTests.length > 0).length,
        entriesWithStaticOnlyControlReview: reconciliation.filter(row => row.coverage.handlerClassification === "static_only_control_review").length,
    },
};

const outputs: Record<string, string> = {
    "provenance.json": JSON.stringify(provenance, null, 2) + "\n",
    "shared-control-analysis.json": JSON.stringify(sharedControlAnalysis, null, 2) + "\n",
    "route-control-reconciliation.json": JSON.stringify(reconciliation, null, 2) + "\n",
    "dispatch-mock-results.json": JSON.stringify(mocked, null, 2) + "\n",
    "authority-coverage.json": JSON.stringify(authorityCoverage, null, 2) + "\n",
};

await mkdir(runDir, { recursive: true });
for (const [name, content] of Object.entries(outputs)) await writeFile(resolve(runDir, name), content);
await writeFile(
    resolve(runDir, "SHA256SUMS"),
    Object.entries(outputs).map(([name, content]) => `${sha256(content)}  ${name}`).sort().join("\n") + "\n",
);
await writeFile(resolve(runDir, "README.md"), `# R-029 route/control reconciliation ${runId}\n\n` +
    `This additive carrier reconciles all 36 committed-source dispatch entries at source baseline \`${sourceBaseline}\`. ` +
    `It does not replace the prior run \`${priorRunId}\`. The instrument opened no socket, read no real secret/home state, ` +
    `executed no handler side effect, and intercepted listener/runtime writes. Only this evidence carrier was written.\n\n` +
    `- \`route-control-reconciliation.json\`: per-entry caller-control evidence, immediate/deferred authority paths, and mock/test/static coverage.\n` +
    `- \`dispatch-mock-results.json\`: 108 synthetic dispatcher calls (36 entries times three identity variants).\n` +
    `- \`shared-control-analysis.json\`: exact-source analysis of listener, matcher and loader.\n` +
    `- \`authority-coverage.json\`: reconciliation of all nine authority classes and their timing.\n` +
    `- \`provenance.json\` and \`SHA256SUMS\`: snapshot, safety boundary and integrity metadata.\n`);

console.log(JSON.stringify({ runDir: relative(repositoryRoot, runDir), provenance }, null, 2));
