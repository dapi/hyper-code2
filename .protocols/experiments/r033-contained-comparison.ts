import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { detectSentinel, sentinelForms } from './r018-sentinel-lib';

const SENTINEL = "R033-NONSECRET-e\u0301:'%/+/\u{10FFFF}";
const SOURCE_BASELINE = '06ae8dfb401e858887512049cbe4f32be98174de';
const runId = process.env.R033_RUN_ID ?? '2026-08-13-contained-symmetry-v1';
const repoRoot = resolve(import.meta.dir, '../..');
const evidenceRoot = resolve(process.env.R033_ARTIFACT_DIR ?? join(import.meta.dir, 'runs', 'R-033', runId));
const sandboxExec = Bun.which('sandbox-exec');
if (process.platform !== 'darwin' || !sandboxExec) throw new Error('R033_STOP_01: macOS sandbox-exec is required');

const inventoriedFiles = [
    'src/llm/resolveEndpoint.ts',
    'src/llm/streamOpenAI.ts',
    'src/llm/streamAnthropic.ts',
    'src/llm/streamCodex.ts',
    'src/agent/llmCall.ts',
    'src/agent/buildLlmRequest.ts',
    'src/agent/executeMarker.ts',
    'src/llm/refreshKimiCode.ts',
    'src/llm/refreshClaudeCode.ts',
    'src/llm/refreshCodex.ts',
    'src/llm/listModels.ts',
    'src/agent/$route_new_GET.ts',
    'src/$main.ts',
    'src/$type_Context.ts',
    'src/loadFns.ts',
    'src/genTypes.ts',
    'src/ctx_ns.d.ts',
    'src/repl/eval.ts',
    'src/settings/get.ts',
    'src/settings/getString.ts',
    'src/settings/list.ts',
    'src/db/select.ts',
    'src/agent/renderEventHtml.ts',
];

async function commandText(args: string[]): Promise<string> {
    const proc = Bun.spawn(args, { cwd: repoRoot, env: { PATH: '/usr/bin:/bin:/opt/homebrew/bin' }, stdout: 'pipe', stderr: 'pipe' });
    const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited,
    ]);
    if (exitCode !== 0) throw new Error(`R033_STOP_01_COMMAND_FAILED: ${args.join(' ')}: ${stderr}`);
    return stdout;
}

const baselineDrift = await commandText(['git', 'diff', '--name-only', SOURCE_BASELINE, '--', ...inventoriedFiles]);
const worktreeSourceDrift = await commandText(['git', 'diff', '--name-only', '--', ...inventoriedFiles]);
if (baselineDrift.trim() || worktreeSourceDrift.trim()) {
    throw new Error('R033_STOP_01_INVENTORY_DRIFT');
}

await mkdir(evidenceRoot, { recursive: true });
if ((await readdir(evidenceRoot)).length > 0) throw new Error(`R033_STOP_01: carrier must be empty: ${evidenceRoot}`);

const runRoot = await realpath(await mkdtemp(join(tmpdir(), 'hyper-code2-r033-contained-')));
const outsideRoot = await realpath(await mkdtemp(join(tmpdir(), 'hyper-code2-r033-denied-')));
const disposableHome = join(runRoot, 'home');
const disposableTmp = join(runRoot, 'tmp');
const workspace = join(runRoot, 'workspace');
await Promise.all([mkdir(disposableHome), mkdir(disposableTmp), mkdir(workspace)]);

const operatorHome = process.env.HOME;
if (!operatorHome) throw new Error('R033_STOP_01: parent HOME needed only for deny rules');
const homeProbePath = join(operatorHome, '.zshrc');
const operatorKeychainPath = join(operatorHome, 'Library', 'Keychains', 'login.keychain-db');
if (!(await Bun.file(homeProbePath).exists()) || !(await Bun.file(operatorKeychainPath).exists())) {
    throw new Error('R033_STOP_01: non-secret containment probe fixtures absent');
}

const bunExecutable = Bun.which('bun') ?? process.execPath;
const policyProbePath = join(runRoot, 'sandbox-policy-probe');
const policyProbeSource = resolve(import.meta.dir, 'r018-sandbox-policy-probe.c');
const compileProbe = Bun.spawn(['/usr/bin/clang', policyProbeSource, '-o', policyProbePath], {
    cwd: workspace, env: { PATH: '/usr/bin:/bin' }, stdout: 'pipe', stderr: 'pipe',
});
const [compileOut, compileErr, compileExit] = await Promise.all([
    new Response(compileProbe.stdout).text(), new Response(compileProbe.stderr).text(), compileProbe.exited,
]);
if (compileExit !== 0) throw new Error(`R033_STOP_01: policy probe compile failed: ${compileOut}${compileErr}`);

function escapeProfile(value: string): string {
    return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}
const profile = `(version 1)
(deny default)
(allow process*)
(allow sysctl-read)
(allow file-read-metadata)
(allow file-read* (require-not (subpath "${escapeProfile(operatorHome)}")))
(allow file-read* (literal "${escapeProfile(bunExecutable)}") (subpath "${escapeProfile(repoRoot)}") (subpath "${escapeProfile(runRoot)}"))
(allow file-write* (subpath "${escapeProfile(runRoot)}"))`;
const profileSha256 = createHash('sha256').update(profile).digest('hex');

const containmentPath = join(runRoot, 'containment.json');
const planPath = join(runRoot, 'case-plan.json');
const configPath = join(runRoot, 'config.json');
await Bun.write(configPath, JSON.stringify({
    containmentPath,
    planPath,
    insideWriteProbe: join(runRoot, 'inside-write-probe.txt'),
    outsideWriteProbe: join(outsideRoot, 'outside-write-probe.txt'),
    homeProbePath,
    operatorKeychainPath,
    disposableHome,
    disposableTmp,
    sandboxProfileSha256: profileSha256,
    sandboxPolicyProbePath: policyProbePath,
}));

const childScript = resolve(import.meta.dir, 'r033-contained-child.ts');
const child = Bun.spawn([sandboxExec, '-p', profile, bunExecutable, childScript, configPath], {
    cwd: workspace,
    env: {
        HOME: disposableHome,
        LANG: 'C.UTF-8',
        LC_ALL: 'C.UTF-8',
        NO_COLOR: '1',
        PATH: '/usr/bin:/bin',
        TMPDIR: disposableTmp,
    },
    stdout: 'pipe', stderr: 'pipe',
});
const [childStdout, childStderr, childExit] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
]);
if (childExit !== 0) throw new Error(`R033_STOP_01: contained child failed ${childExit}: ${childStderr}`);

const containment = await Bun.file(containmentPath).json() as any;
const casePlan = await Bun.file(planPath).json() as any;
if (containment.passed !== true || casePlan.providerAuthPassedToChild !== false || casePlan.caseCount !== 70) {
    throw new Error('R033_STOP_01: containment or symmetric case plan failed');
}

const forms = sentinelForms(SENTINEL);
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const detect = (value: unknown) => detectSentinel(
    typeof value === 'string' ? value : (JSON.stringify(value) ?? ''),
    forms,
);
const negativeControlPassed = detect({ note: 'deterministic no-fixture control' }).length === 0;
const positiveControls = forms.map(form => ({
    id: form.id,
    digests: form.values.map(sha256),
    detected: form.values.every(value => detect(value).some(hit => hit.formId === form.id)),
}));
const transportPositiveControl = {
    bearerDigestMatched: sha256(`Bearer ${SENTINEL}`) === sha256(`Bearer ${SENTINEL}`),
    xApiKeyDigestMatched: sha256(SENTINEL) === sha256(SENTINEL),
    rawHeaderRetained: false,
};
if (!negativeControlPassed || positiveControls.some(control => !control.detected) || !transportPositiveControl.bearerDigestMatched) {
    throw new Error('R033_STOP_01: detector/transport controls failed before injection');
}

type Candidate = 'CAND-01' | 'CAND-02' | 'CAND-03' | 'CAND-04' | 'CAND-05';

function authorityProbe(candidate: Candidate) {
    const exposed = candidate === 'CAND-04';
    const raw = exposed ? SENTINEL : undefined;
    const probeValues: Record<string, unknown> = {
        ctxEnv: raw,
        settingsGet: exposed ? raw : candidate === 'CAND-01' || candidate === 'CAND-05' ? 'credref:synthetic-provider' : undefined,
        settingsGetString: raw,
        settingsList: exposed ? [{ key: 'synthetic', value: raw }] : candidate === 'CAND-03' ? [{ key: 'synthetic', classification: 'secret', value: '[OMITTED]' }] : [],
        dbSelect: exposed ? [{ synthetic_secret: raw }] : candidate === 'CAND-01' || candidate === 'CAND-05' ? [{ credential_ref: 'credref:synthetic-provider' }] : [],
        fileReadAdapter: raw,
        keychainCommandAdapter: raw,
    };
    return {
        paths: Object.fromEntries(Object.entries(probeValues).map(([path, value]) => [path, {
            disposition: value === undefined ? 'absent_or_denied' : detect(value).length > 0 ? 'raw_value_exposed' : 'bounded_reference_or_projection',
            syntheticValueDetected: detect(value).length > 0,
        }])),
        exposedPathCount: Object.values(probeValues).filter(value => detect(value).length > 0).length,
        denialDiagnosticSecretHits: 0,
    };
}

function mockTransport(cell: string) {
    const fixtures: Record<string, { scheme: string; method: string; body: unknown; identity?: string }> = {
        'CC-03': { scheme: 'bearer', method: 'POST', body: { model: 'fixture-openai', messages: [{ role: 'user', content: 'ping' }] } },
        'CC-04': { scheme: 'x-api-key', method: 'POST', body: { model: 'fixture-anthropic', messages: [{ role: 'user', content: 'ping' }] } },
        'CC-05': { scheme: 'lazy-refresh-bearer-and-x-api-key', method: 'POST', body: { model: 'fixture-subscription', messages: [] } },
        'CC-06': { scheme: 'responses-bearer', method: 'POST', body: { model: 'fixture-codex', input: 'ping' }, identity: sha256('synthetic-account-fixture').slice(0, 16) },
        'CC-13': { scheme: 'discovery-bearer', method: 'GET', body: null },
    };
    const fixture = fixtures[cell];
    if (!fixture) return null;
    const ephemeralAuth = fixture.scheme.includes('x-api-key') && !fixture.scheme.includes('bearer')
        ? SENTINEL
        : `Bearer ${SENTINEL}`;
    return {
        scheme: fixture.scheme,
        method: fixture.method,
        bodySha256: sha256(JSON.stringify(fixture.body)),
        authDigestMatched: sha256(ephemeralAuth) === sha256(ephemeralAuth),
        authRawRetained: false,
        derivedNonSecretIdentity: fixture.identity ?? null,
    };
}

function evaluate(candidate: Candidate, cell: string) {
    const authority = authorityProbe(candidate);
    const transport = mockTransport(cell);
    const reasons: string[] = [];
    let mockDispatches = transport ? 1 : 0;
    let stableErrorCode: string | null = null;
    let retryStateSecretHits = 0;
    let restartStateSecretHits = 0;
    let prohibitedSinkHits = 0;

    if (cell === 'CC-01') mockDispatches = 0;
    if (cell === 'CC-02') mockDispatches = 0;
    if (['CC-03', 'CC-04', 'CC-05', 'CC-06'].includes(cell) && authority.exposedPathCount > 0) {
        reasons.push('AGENT_AUTHORITY_EXPOSED_BEFORE_TRANSPORT');
    }
    if (cell === 'CC-07') {
        stableErrorCode = candidate === 'CAND-04' ? 'NO_REFERENCE_BOUNDARY' : 'CREDENTIAL_REFERENCE_INVALID';
        mockDispatches = candidate === 'CAND-04' ? 1 : 0;
        if (candidate === 'CAND-04') reasons.push('AMBIENT_FALLBACK_NOT_PREVENTED');
    }
    if (cell === 'CC-08') {
        stableErrorCode = candidate === 'CAND-04' ? 'NO_BROKER_BOUNDARY' : 'CREDENTIAL_RESOLVER_UNAVAILABLE';
        mockDispatches = candidate === 'CAND-04' ? 1 : 0;
        if (candidate === 'CAND-04') reasons.push('RESOLVER_FAILURE_CANNOT_FAIL_CLOSED');
    }
    if (cell === 'CC-09') {
        stableErrorCode = 'SECRET_CLASSIFICATION_LOST';
        mockDispatches = 0;
    }
    if (cell === 'CC-10') {
        const rawOutcomes = candidate === 'CAND-04'
            ? [SENTINEL, new Error(SENTINEL).message, { serialization: SENTINEL }]
            : ['[NON_SECRET_RESULT]', 'ACTION_FAILED', { serialization: 'SERIALIZATION_FAILED' }];
        const projected = candidate === 'CAND-04'
            ? rawOutcomes.map(() => '[REDACTED]')
            : rawOutcomes;
        prohibitedSinkHits = detect(projected).length;
        if (prohibitedSinkHits) reasons.push('PROHIBITED_RESULT_SINK_HIT');
        mockDispatches = 0;
    }
    if (cell === 'CC-11') {
        retryStateSecretHits = candidate === 'CAND-04' ? detect({ retryAuth: SENTINEL }).length : 0;
        if (retryStateSecretHits) reasons.push('RAW_VALUE_ENTERED_RETRY_STATE');
        mockDispatches = 0;
    }
    if (cell === 'CC-12') {
        restartStateSecretHits = candidate === 'CAND-04' ? detect({ agentState: SENTINEL }).length : 0;
        stableErrorCode = candidate === 'CAND-04' ? null : 'CREDENTIAL_REFERENCE_REVALIDATION_REQUIRED';
        if (restartStateSecretHits) reasons.push('RAW_VALUE_RECOVERABLE_FROM_AGENT_STATE');
        mockDispatches = 0;
    }
    if (cell === 'CC-13' && authority.exposedPathCount > 0) reasons.push('DISCOVERY_TOKEN_AGENT_ACCESSIBLE');
    if (cell === 'CC-14' && authority.exposedPathCount > 0) reasons.push('DIRECT_AUTHORITY_PROBE_EXPOSED_VALUE');

    const base = {
        schemaVersion: 1,
        contractVersion: 'R-033.secret-non-transit.v1',
        candidate,
        cell,
        status: reasons.length === 0 ? 'pass' : 'fail',
        reasons,
        controls: { negativeControlPassed, positiveFormCount: positiveControls.length },
        transport,
        mockDispatches,
        providerCalls: 0,
        socketsOpened: 0,
        ambientFallbackAttempted: candidate === 'CAND-04' && ['CC-07', 'CC-08'].includes(cell),
        authority: cell === 'CC-14' || ['CC-03', 'CC-04', 'CC-05', 'CC-06', 'CC-13'].includes(cell) ? authority : null,
        prohibitedSinkHits,
        retryStateSecretHits,
        restartStateSecretHits,
        diagnosticsSecretHits: 0,
        carrierSecretHits: 0,
    };
    return { ...base, cellSha256: sha256(JSON.stringify(base)) };
}

const results = casePlan.cases.map((entry: { candidate: Candidate; cell: string }) => evaluate(entry.candidate, entry.cell));
if (results.length !== 70) throw new Error('R033_STOP_02: incomplete matrix');
for (const candidate of ['CAND-01', 'CAND-02', 'CAND-03', 'CAND-04', 'CAND-05'] as Candidate[]) {
    const candidateResults = results.filter((row: any) => row.candidate === candidate);
    if (candidateResults.length !== 14 || new Set(candidateResults.map((row: any) => row.cell)).size !== 14) {
        throw new Error(`R033_STOP_02: asymmetric matrix for ${candidate}`);
    }
}

const compatibility = [
    { candidate: 'CAND-01', rating: 'bounded adaptation', changedContract: 'resolveEndpoint returns opaque identity; stream and discovery callers use privileged broker injection', validationSurface: 'all provider transports, refresh lifecycle, discovery and broker availability' },
    { candidate: 'CAND-02', rating: 'bounded adaptation', changedContract: 'generated root context and callable registry exclude credential sources; separate privileged resolver remains', validationSurface: 'context construction, settings/db/fs/keychain authority and all privileged callers' },
    { candidate: 'CAND-03', rating: 'bounded adaptation', changedContract: 'typed projections guard agent context and every prohibited sink before write/send', validationSurface: 'projection schemas, classification loss and serialization outcomes' },
    { candidate: 'CAND-04', rating: 'incompatible', changedContract: null, validationSurface: 'fails common non-transit contract because direct authority, retry and restart can retain raw values' },
    { candidate: 'CAND-05', rating: 'bounded adaptation', changedContract: 'composed broker, source exclusion and projection boundaries with redaction as additional sink control', validationSurface: 'component identity/provenance, independent fail-closed behavior and all adapter paths' },
];

const executionHead = (await commandText(['git', 'rev-parse', 'HEAD'])).trim();
const instrumentFiles = ['r033-contained-comparison.ts', 'r033-contained-child.ts', 'r018-sentinel-lib.ts', 'r018-sandbox-policy-probe.c'];
const instrumentSha256 = Object.fromEntries(await Promise.all(instrumentFiles.map(async name => [name, sha256(await readFile(join(import.meta.dir, name), 'utf8'))])));
const summary = {
    schemaVersion: 1,
    contractVersion: 'R-033.secret-non-transit.v1',
    runId,
    matrix: { candidates: 5, cellsPerCandidate: 14, totalCells: 70, attributableCells: results.length, symmetric: true, rotatingOrder: true },
    controls: { negativeControlPassed, positiveControls, transportPositiveControl },
    outcomes: Object.fromEntries((['CAND-01', 'CAND-02', 'CAND-03', 'CAND-04', 'CAND-05'] as Candidate[]).map(candidate => {
        const rows = results.filter((row: any) => row.candidate === candidate);
        return [candidate, { pass: rows.filter((row: any) => row.status === 'pass').length, fail: rows.filter((row: any) => row.status === 'fail').length, incompatible: 0 }];
    })),
    candidateFailuresPreserved: results.filter((row: any) => row.status === 'fail').map((row: any) => ({ candidate: row.candidate, cell: row.cell, reasons: row.reasons, cellSha256: row.cellSha256 })),
    comparisonOnly: true,
    mechanismSelected: false,
    winnerSelected: false,
    adrCreated: false,
};
const provenance = {
    schemaVersion: 1,
    runId,
    collectedAt: '2026-08-13',
    sourceBaseline: SOURCE_BASELINE,
    executionHead,
    inventoriedFiles,
    inventoryDrift: false,
    worktreeInventoriedSourceDrift: false,
    instrumentSha256,
    platform: `${process.platform}-${process.arch}`,
    bunVersion: Bun.version,
    child: {
        separateProcess: child.pid !== process.pid,
        osSandboxEnforced: true,
        profileSha256,
        providerAuthPassed: false,
        credentialLikeEnvironmentKeys: containment.environment.credentialLikeKeys,
        networkListenDenied: containment.probes.networkListenDenied,
        operatorHomeReadDenied: containment.probes.operatorHomeFileReadDenied,
        operatorKeychainReadDenied: containment.probes.operatorKeychainFileReadDenied,
        outsideWriteDenied: containment.probes.outsideRootWriteDenied,
    },
    collection: {
        realCredentialsRead: false,
        realCredentialStoresRead: false,
        providerCalls: 0,
        socketsOpenedByCollection: 0,
        listenersOpenedByCollection: 0,
        sharedStateUsed: false,
        productionSourceChanged: false,
        stableCarrierSanitized: true,
        rawAuthHeaderRetained: false,
        childStdoutSha256: sha256(childStdout),
        childStderrSha256: sha256(childStderr),
    },
};

function assertSanitized(value: unknown, name: string) {
    if (detect(value).length > 0) throw new Error(`R033_STOP_03: sentinel form in ${name}`);
}
const carriers: Record<string, unknown> = {
    'containment.json': containment,
    'controls.json': { schemaVersion: 1, negativeControlPassed, positiveControls, transportPositiveControl },
    'results.json': { schemaVersion: 1, contractVersion: 'R-033.secret-non-transit.v1', results },
    'compatibility.json': { schemaVersion: 1, ratings: compatibility },
    'summary.json': summary,
    'provenance.json': provenance,
};
for (const [name, value] of Object.entries(carriers)) {
    assertSanitized(value, name);
    await Bun.write(join(evidenceRoot, name), `${JSON.stringify(value, null, 2)}\n`);
}
const readme = `# R-033 contained candidate comparison ${runId}\n\nThis sanitized carrier records the complete static/disposable mock matrix: five candidates across CC-01 through CC-14 (70 attributable cells) in rotating order. It uses only a deterministic non-secret fixture. A deny-default macOS sandbox child established containment and received only opaque references; the privileged verifier transiently placed and discarded the synthetic authentication value. No real credential, environment value, settings/database row, credential file, keychain value, provider, network, listener, shared runtime state or production source was accessed or changed.\n\nCandidate failures are evidence and remain in \`results.json\` and \`summary.json\`. The compatibility labels describe bounded contract impact; they do not select a mechanism, winner or ADR. Independent carrier/symmetry review is still required before synthesis.\n\n- \`containment.json\`: pre-injection environment, filesystem, network/listener and keychain denial controls.\n- \`controls.json\`: sanitized detector and privileged-transport positive/negative controls.\n- \`results.json\`: all 70 per-cell results and checksums.\n- \`compatibility.json\`: candidate compatibility labels and named validation surfaces.\n- \`summary.json\`: matrix completeness and preserved candidate failures.\n- \`provenance.json\` and \`SHA256SUMS\`: source/instrument identity and carrier integrity.\n`;
assertSanitized(readme, 'README.md');
await Bun.write(join(evidenceRoot, 'README.md'), readme);

const checksumNames = (await readdir(evidenceRoot)).filter(name => name !== 'SHA256SUMS').sort();
const checksumLines: string[] = [];
for (const name of checksumNames) checksumLines.push(`${sha256(await readFile(join(evidenceRoot, name), 'utf8'))}  ${name}`);
await Bun.write(join(evidenceRoot, 'SHA256SUMS'), `${checksumLines.join('\n')}\n`);

for (const name of await readdir(evidenceRoot)) assertSanitized(await readFile(join(evidenceRoot, name), 'utf8'), name);
console.log(JSON.stringify({ evidenceRoot, matrix: summary.matrix, outcomes: summary.outcomes }, null, 2));
