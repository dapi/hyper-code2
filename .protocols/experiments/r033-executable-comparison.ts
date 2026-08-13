import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { CANDIDATES, CELLS, SENTINEL } from './r033-executable-adapters';
import { detectSentinel, sentinelForms } from './r018-sentinel-lib';

const SOURCE_BASELINE = '06ae8dfb401e858887512049cbe4f32be98174de';
const runId = process.env.R033_RUN_ID ?? '2026-08-13-executable-adapters-v2';
const repoRoot = resolve(import.meta.dir, '../..');
const evidenceRoot = resolve(process.env.R033_ARTIFACT_DIR ?? join(import.meta.dir, 'runs', 'R-033', runId));
const sandboxExec = Bun.which('sandbox-exec');
if (process.platform !== 'darwin' || !sandboxExec) throw new Error('R033_STOP_01: macOS sandbox-exec required');

const inventoriedFiles = [
    'src/llm/resolveEndpoint.ts', 'src/llm/streamOpenAI.ts', 'src/llm/streamAnthropic.ts',
    'src/llm/streamCodex.ts', 'src/agent/llmCall.ts', 'src/agent/buildLlmRequest.ts',
    'src/agent/executeMarker.ts', 'src/llm/refreshKimiCode.ts', 'src/llm/refreshClaudeCode.ts',
    'src/llm/refreshCodex.ts', 'src/llm/listModels.ts', 'src/agent/$route_new_GET.ts',
    'src/$main.ts', 'src/$type_Context.ts', 'src/loadFns.ts', 'src/genTypes.ts',
    'src/ctx_ns.d.ts', 'src/repl/eval.ts', 'src/settings/get.ts', 'src/settings/getString.ts',
    'src/settings/list.ts', 'src/db/select.ts', 'src/agent/renderEventHtml.ts',
];
const sha256 = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
async function command(args: string[]) {
    const proc = Bun.spawn(args, { cwd: repoRoot, env: { PATH: '/usr/bin:/bin:/opt/homebrew/bin' }, stdout: 'pipe', stderr: 'pipe' });
    const [stdout, stderr, exit] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
    if (exit !== 0) throw new Error(`R033_STOP_01_COMMAND: ${stderr}`);
    return stdout;
}
if ((await command(['git', 'diff', '--name-only', SOURCE_BASELINE, '--', ...inventoriedFiles])).trim()) throw new Error('R033_STOP_01_INVENTORY_DRIFT');
if ((await command(['git', 'diff', '--name-only', '--', ...inventoriedFiles])).trim()) throw new Error('R033_STOP_01_WORKTREE_SOURCE_DRIFT');

await mkdir(evidenceRoot, { recursive: true });
if ((await readdir(evidenceRoot)).length) throw new Error('R033_STOP_01_CARRIER_NOT_EMPTY');
const runRoot = await realpath(await mkdtemp(join(tmpdir(), 'hyper-code2-r033-executable-')));
const workspace = join(runRoot, 'workspace');
const home = join(runRoot, 'home');
const tmp = join(runRoot, 'tmp');
await Promise.all([mkdir(workspace), mkdir(home), mkdir(tmp)]);

const bunExecutable = Bun.which('bun') ?? process.execPath;
const operatorHome = process.env.HOME;
if (!operatorHome) throw new Error('R033_STOP_01_HOME_PATH_ABSENT');
function escapeProfile(value: string) { return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"'); }
const profile = `(version 1)
(deny default)
(allow process*)
(allow sysctl-read)
(allow file-read-metadata)
(allow file-read* (require-not (subpath "${escapeProfile(operatorHome)}")))
(allow file-read* (literal "${escapeProfile(bunExecutable)}") (subpath "${escapeProfile(repoRoot)}") (subpath "${escapeProfile(runRoot)}"))
(allow file-write* (subpath "${escapeProfile(runRoot)}"))`;

const outputPath = join(runRoot, 'raw-results.json');
const configPath = join(runRoot, 'config.json');
await Bun.write(configPath, JSON.stringify({ outputPath }));
const childScript = resolve(import.meta.dir, 'r033-executable-child.ts');
const child = Bun.spawn([sandboxExec, '-p', profile, bunExecutable, childScript, configPath], {
    cwd: workspace,
    env: { HOME: home, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8', NO_COLOR: '1', PATH: '/usr/bin:/bin', TMPDIR: tmp },
    stdout: 'pipe', stderr: 'pipe',
});
const [stdout, stderr, exit] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
if (exit !== 0) throw new Error(`R033_STOP_01_CHILD: ${stderr}`);
const raw = await Bun.file(outputPath).json() as { results: any[]; injectedLeakControls: any[] };

const forms = sentinelForms(SENTINEL);
const hasRaw = (value: unknown) => detectSentinel(JSON.stringify(value) ?? '', forms).length > 0;
const detectorNegativeControl = !hasRaw({ fixture: 'no-sentinel-control' });
const detectorPositiveControls = forms.map(form => ({
    id: form.id,
    detected: form.values.every(value => detectSentinel(value, forms).some(hit => hit.formId === form.id)),
    digests: form.values.map(value => sha256(value)),
}));
if (!detectorNegativeControl || detectorPositiveControls.some(control => !control.detected)) {
    throw new Error('R033_STOP_01_DETECTOR_CONTROL_FAILED');
}
if (raw.results.length !== 70 || raw.injectedLeakControls.length !== 70) throw new Error('R033_STOP_02_MATRIX_SIZE');
for (const candidate of CANDIDATES) {
    const rows = raw.results.filter(row => row.candidate === candidate);
    if (rows.length !== 14 || new Set(rows.map(row => row.cell)).size !== 14) throw new Error(`R033_STOP_02_SYMMETRY_${candidate}`);
}
if (raw.injectedLeakControls.some(row => row.status !== 'fail' || !row.reasons.includes('PROHIBITED_SINK_HIT'))) {
    throw new Error('R033_STOP_01_INJECTED_LEAK_CONTROL_MISSED');
}

const sanitizeResult = (row: any) => {
    const authority = Object.fromEntries(Object.entries(row.agentAuthority).map(([path, value]) => [path, {
        disposition: value === undefined ? 'absent' : hasRaw(value) ? 'raw-value-observed' : 'bounded-value-observed',
    }]));
    const sinkHits = Object.fromEntries(Object.entries(row.prohibitedSinks).map(([sink, value]) => [sink, hasRaw(value)]));
    const base = {
        candidate: row.candidate,
        cell: row.cell,
        status: row.status,
        reasons: row.reasons,
        executionTrace: row.executionTrace,
        dispatchCount: row.dispatchCount,
        transport: row.transport ?? null,
        stableErrorCode: row.stableErrorCode ?? null,
        authority,
        prohibitedSinkHits: sinkHits,
        retryStateSecretHit: hasRaw(row.retryState),
        restartStateSecretHit: hasRaw(row.restartState),
    };
    return { ...base, cellSha256: sha256(JSON.stringify(base)) };
};
const results = raw.results.map(sanitizeResult);
const leakControls = raw.injectedLeakControls.map(row => ({
    candidate: row.candidate,
    cell: row.cell,
    detected: row.status === 'fail' && row.reasons.includes('PROHIBITED_SINK_HIT'),
    reasons: row.reasons,
}));
const outcomes = Object.fromEntries(CANDIDATES.map(candidate => {
    const rows = results.filter(row => row.candidate === candidate);
    return [candidate, { pass: rows.filter(row => row.status === 'pass').length, fail: rows.filter(row => row.status === 'fail').length }];
}));
const failedCells = results.filter(row => row.status === 'fail').map(row => ({ candidate: row.candidate, cell: row.cell, reasons: row.reasons, cellSha256: row.cellSha256 }));

const adapterFiles = ['r033-executable-adapters.ts', 'r033-executable-child.ts', 'r033-executable-comparison.ts'];
const provenance = {
    schemaVersion: 2,
    runId,
    sourceBaseline: SOURCE_BASELINE,
    executionHead: (await command(['git', 'rev-parse', 'HEAD'])).trim(),
    inventoriedSourceDrift: false,
    instrumentSha256: Object.fromEntries(await Promise.all(adapterFiles.map(async file => [file, sha256(await readFile(join(import.meta.dir, file)))]))),
    child: { separateProcess: child.pid !== process.pid, osSandboxEnforced: true, providerAuthPassedInEnvironment: false, environmentKeys: ['HOME', 'LANG', 'LC_ALL', 'NO_COLOR', 'PATH', 'TMPDIR'] },
    boundaries: { realCredentialOrStoreRead: false, providerCalls: 0, listeners: 0, sharedState: false, productionSourceChanges: false, parentHomePathUsedOnlyForDenyRule: true },
    stdoutSha256: sha256(stdout), stderrSha256: sha256(stderr),
};
const summary = {
    schemaVersion: 2,
    runId,
    matrix: { candidates: CANDIDATES.length, cellsPerCandidate: CELLS.length, attributableCells: results.length, symmetric: true, rotatingOrder: true },
    execution: { adapterMethodsExecuted: true, parentOutcomeConstants: false, independentlyExpectedAuthDigests: true, injectedLeakControls: leakControls.length, injectedLeakControlsDetected: leakControls.filter(row => row.detected).length },
    outcomes,
    failedCells,
    mechanismSelected: false,
    winnerSelected: false,
    synthesisAllowed: false,
};
const controls = {
    schemaVersion: 2,
    detectorNegativeControl,
    detectorPositiveControls,
    independentExpectedAuthDigests: {
        bearer: 'd3177e877ed48485413a652e3b1df8358c3a9828744821898aebe6ab76f32be1',
        xApiKey: 'c294132494666cd199ee9c99464ae2ee3c22e2f944238b3f4034ce12254b2e14',
    },
    observedTransportDigests: [...new Set(results.flatMap(row => row.transport ? [row.transport.authDigest] : []))],
    allObservedAuthDigestsExpected: results.filter(row => row.transport).every(row => [
        'd3177e877ed48485413a652e3b1df8358c3a9828744821898aebe6ab76f32be1',
        'c294132494666cd199ee9c99464ae2ee3c22e2f944238b3f4034ce12254b2e14',
    ].includes(row.transport.authDigest)),
    injectedLeakControls: leakControls,
};

const carriers: Record<string, unknown> = { 'results.json': { schemaVersion: 2, results }, 'controls.json': controls, 'summary.json': summary, 'provenance.json': provenance };
for (const [name, value] of Object.entries(carriers)) {
    if (hasRaw(value)) throw new Error(`R033_STOP_03_RAW_CARRIER_${name}`);
    await Bun.write(join(evidenceRoot, name), `${JSON.stringify(value, null, 2)}\n`);
}
const readme = `# R-033 executable disposable adapters ${runId}\n\nThis additive sanitized carrier executes minimal disposable implementations of CAND-01 through CAND-05 across CC-01 through CC-14. Adapter methods perform synthetic resolution, authentication placement, projection/redaction, fail-closed errors, retry/restart state and direct-authority exposure. Outcomes are derived from executed state and detector observations; the parent does not assign candidate pass/fail constants. Seventy injected-leak repetitions verify that the common sink detector changes every case to failure. Authentication placement is checked against two frozen independently precomputed SHA-256 expectations.\n\nThe child runs under a deny-default macOS profile with a six-key non-auth environment. It uses no real credential/store, provider call, listener, shared state or production source. This is only mechanism-shaped disposable evidence. It neither establishes production fidelity nor selects or ranks a candidate. Independent carrier, symmetry and adapter-fidelity review is required; R-033 remains collecting and synthesis is blocked.\n\n- \`results.json\`: sanitized executed outcomes, traces and per-cell checksums.\n- \`controls.json\`: frozen expected auth digests and 70 injected-leak detector controls.\n- \`summary.json\`: matrix accounting and failures derived from execution.\n- \`provenance.json\` and \`SHA256SUMS\`: instrument/source identity and integrity.\n`;
await Bun.write(join(evidenceRoot, 'README.md'), readme);
const names = (await readdir(evidenceRoot)).filter(name => name !== 'SHA256SUMS').sort();
await Bun.write(join(evidenceRoot, 'SHA256SUMS'), `${(await Promise.all(names.map(async name => `${sha256(await readFile(join(evidenceRoot, name)))}  ${name}`))).join('\n')}\n`);
for (const name of await readdir(evidenceRoot)) if (hasRaw(await readFile(join(evidenceRoot, name), 'utf8'))) throw new Error(`R033_STOP_03_RAW_FINAL_${name}`);
console.log(JSON.stringify({ evidenceRoot, outcomes, failedCells: failedCells.length }, null, 2));
