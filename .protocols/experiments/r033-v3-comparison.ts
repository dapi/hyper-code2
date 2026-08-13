import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { CANDIDATES, CELLS, SENTINEL } from './r033-v3-semantics';
import { detectSentinel, sentinelForms } from './r018-sentinel-lib';

const runId = process.env.R033_RUN_ID ?? '2026-08-13-semantic-adapters-v3';
const repoRoot = resolve(import.meta.dir, '../..');
const evidenceRoot = resolve(process.env.R033_ARTIFACT_DIR ?? join(import.meta.dir, 'runs', 'R-033', runId));
const sha = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
const SOURCE_BASELINE = '06ae8dfb401e858887512049cbe4f32be98174de';
const inventoriedFiles = ['src/llm/resolveEndpoint.ts','src/llm/streamOpenAI.ts','src/llm/streamAnthropic.ts','src/llm/streamCodex.ts','src/agent/llmCall.ts','src/agent/buildLlmRequest.ts','src/agent/executeMarker.ts','src/llm/refreshKimiCode.ts','src/llm/refreshClaudeCode.ts','src/llm/refreshCodex.ts','src/llm/listModels.ts','src/agent/$route_new_GET.ts','src/$main.ts','src/$type_Context.ts','src/loadFns.ts','src/genTypes.ts','src/ctx_ns.d.ts','src/repl/eval.ts','src/settings/get.ts','src/settings/getString.ts','src/settings/list.ts','src/db/select.ts','src/agent/renderEventHtml.ts'];
async function git(args: string[]) { const proc = Bun.spawn(['git', ...args], { cwd: repoRoot, env: { PATH: '/usr/bin:/bin:/opt/homebrew/bin' }, stdout: 'pipe', stderr: 'pipe' }); const [out, err, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]); if (code) throw new Error(`R033_STOP_01_GIT_${err}`); return out; }
if ((await git(['diff','--name-only',SOURCE_BASELINE,'--',...inventoriedFiles])).trim() || (await git(['diff','--name-only','--',...inventoriedFiles])).trim()) throw new Error('R033_STOP_01_INVENTORY_DRIFT');
const sandbox = Bun.which('sandbox-exec');
const bun = Bun.which('bun') ?? process.execPath;
if (!sandbox || process.platform !== 'darwin') throw new Error('R033_STOP_01_SANDBOX_REQUIRED');
await mkdir(evidenceRoot, { recursive: true });
if ((await readdir(evidenceRoot)).length) throw new Error('R033_STOP_01_CARRIER_NOT_EMPTY');
const root = await realpath(await mkdtemp(join(tmpdir(), 'r033-v3-')));
const home = join(root, 'home'); const temp = join(root, 'tmp'); const work = join(root, 'work');
await Promise.all([mkdir(home), mkdir(temp), mkdir(work)]);
const operatorHome = process.env.HOME;
if (!operatorHome) throw new Error('R033_STOP_01_HOME_PATH');
const homeProbe = join(operatorHome, '.zshrc');
const keychainProbe = join(operatorHome, 'Library', 'Keychains', 'login.keychain-db');
if (!(await Bun.file(homeProbe).exists()) || !(await Bun.file(keychainProbe).exists())) throw new Error('R033_STOP_01_PROBE_FIXTURE');
const outside = await realpath(await mkdtemp(join(tmpdir(), 'r033-v3-denied-')));
const esc = (value: string) => value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
const profile = `(version 1)\n(deny default)\n(allow process*)\n(allow sysctl-read)\n(allow file-read-metadata)\n(allow file-read* (require-not (subpath "${esc(operatorHome)}")))\n(allow file-read* (literal "${esc(bun)}") (subpath "${esc(repoRoot)}") (subpath "${esc(root)}"))\n(allow file-write* (subpath "${esc(root)}"))`;
const env = { HOME: home, LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8', NO_COLOR: '1', PATH: '/usr/bin:/bin', TMPDIR: temp };
const rawPath = join(root, 'raw.json'); const config = join(root, 'config.json');
await Bun.write(config, JSON.stringify({ outputPath: rawPath, homeProbe, keychainProbe, outsideWrite: join(outside, 'denied') }));
const child = Bun.spawn([sandbox, '-p', profile, bun, resolve(import.meta.dir, 'r033-v3-child.ts'), config], { cwd: work, env, stdout: 'pipe', stderr: 'pipe' });
const [stdout, stderr, exit] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
if (exit) throw new Error(`R033_STOP_01_CHILD_${stderr}`);
const rawCarrier = await Bun.file(rawPath).json() as any;
if (rawCarrier.results.length !== 70) throw new Error('R033_STOP_02_MATRIX');
const expectedEnv = ['HOME', 'LANG', 'LC_ALL', 'NO_COLOR', 'PATH', 'TMPDIR'];
if (JSON.stringify(rawCarrier.containment.environmentKeys) !== JSON.stringify(expectedEnv) || rawCarrier.containment.credentialLikeKeys.length || !rawCarrier.containment.homeReadDenied || !rawCarrier.containment.keychainReadDenied || !rawCarrier.containment.outsideWriteDenied || !rawCarrier.containment.listenerDenied) throw new Error('R033_STOP_01_CONTAINMENT');

const restartResults: any[] = [];
for (const row of rawCarrier.results.filter((item: any) => item.cell === 'CC-12')) {
    const input = join(root, `restart-${row.candidate}.json`); const output = join(root, `restart-${row.candidate}-out.json`); const cfg = join(root, `restart-${row.candidate}-config.json`);
    await Bun.write(input, JSON.stringify({ candidate: row.candidate, state: row.restartState }));
    await Bun.write(cfg, JSON.stringify({ inputPath: input, outputPath: output }));
    const proc = Bun.spawn([sandbox, '-p', profile, bun, resolve(import.meta.dir, 'r033-v3-restart-child.ts'), cfg], { cwd: work, env, stdout: 'pipe', stderr: 'pipe' });
    const [err, code] = await Promise.all([new Response(proc.stderr).text(), proc.exited]);
    if (code) throw new Error(`R033_STOP_01_RESTART_${row.candidate}_${err}`);
    restartResults.push(await Bun.file(output).json());
}

const forms = sentinelForms(SENTINEL);
const layers = ['agent-context', 'model-input', 'action-result', 'persistence', 'render', 'diagnostic', 'retry-state', 'restart-state'];
const layerControls = layers.flatMap(layer => forms.flatMap(form => form.values.map((value, index) => ({ layer, form: form.id, valueIndex: index, detected: detectSentinel(value, forms).some(hit => hit.formId === form.id), digest: sha(value) }))));
if (layerControls.some(control => !control.detected)) throw new Error('R033_STOP_01_LAYER_CONTROL');
const negativeControl = detectSentinel(JSON.stringify({ layers, value: 'clean' }), forms).length === 0;
if (!negativeControl) throw new Error('R033_STOP_01_NEGATIVE_CONTROL');

const hasRaw = (value: unknown) => detectSentinel(JSON.stringify(value) ?? '', forms).length > 0;
const sanitized = rawCarrier.results.map((row: any) => {
    const restart = restartResults.find(item => item.candidate === row.candidate) ?? null;
    if (row.cell === 'CC-12') {
        if (row.candidate === 'CAND-04' && !restart?.rawRecovered) row.reasons.push('RESTART_PROBE_MISSED_RAW');
        if (row.candidate !== 'CAND-04' && restart?.status !== 'pass') row.reasons.push('RESTART_REVALIDATION_FAILED');
        row.status = row.reasons.length ? 'fail' : 'pass';
    }
    const clean = {
        candidate: row.candidate, cell: row.cell, status: row.status, reasons: row.reasons,
        dispatches: row.dispatches, stableError: row.stableError, trace: row.trace,
        observedDigest: sha(JSON.stringify(row.observed)), observedRaw: hasRaw(row.observed),
        retryRaw: hasRaw(row.retryState), restart: restart ? { ...restart, rawRecovered: restart.rawRecovered } : null,
        requestReceipts: Object.values(row.observed).filter((value: any) => value && typeof value === 'object' && 'requestMatched' in value).map((value: any) => ({ requestDigest: value.requestDigest, expectedRequestDigest: value.expectedRequestDigest, requestMatched: value.requestMatched, authDigest: value.authDigest, expectedAuthDigest: value.expectedAuthDigest, authMatched: value.authMatched })),
    };
    return { ...clean, cellSha256: sha(JSON.stringify(clean)) };
});
if (sanitized.some((row: any) => hasRaw(row))) throw new Error('R033_STOP_03_SANITIZED_ROWS');
const outcomes = Object.fromEntries(CANDIDATES.map(candidate => { const rows = sanitized.filter((row: any) => row.candidate === candidate); return [candidate, { pass: rows.filter((row: any) => row.status === 'pass').length, fail: rows.filter((row: any) => row.status === 'fail').length }]; }));
const controls = { schemaVersion: 3, negativeControl, layerControls, requestControlsFrozenOutsideRuntime: true, restartProcesses: restartResults.map(item => ({ candidate: item.candidate, newProcess: item.newProcess, status: item.status, rawRecovered: item.rawRecovered, revalidationRequired: item.revalidationRequired })) };
const summary = { schemaVersion: 3, runId, matrix: { candidates: 5, cells: 14, results: sanitized.length, symmetric: CANDIDATES.every(candidate => sanitized.filter((row: any) => row.candidate === candidate).length === 14) }, semanticCoverage: { cc02RealFormsAndTransport: true, perLayerTransformedControls: true, cc03to06FrozenFullRequestControls: true, cc05SyntheticStoreRefreshOAuth: true, cc06IdentityAndRefresh: true, cc10ThrownAndSerialization: true, cc11RetryCancellationBound: true, cc12NewProcessRevalidation: true, cc13DiscoveryRenderFailure: true, cc14CallableProbes: true }, outcomes, synthesisAllowed: false, mechanismSelected: false };
const files = ['r033-v3-semantics.ts', 'r033-v3-child.ts', 'r033-v3-restart-child.ts', 'r033-v3-comparison.ts'];
const provenance = { schemaVersion: 3, runId, sourceBaseline: SOURCE_BASELINE, head: (await git(['rev-parse','HEAD'])).trim(), inventoriedFiles, inventoryDrift: false, worktreeInventoriedSourceDrift: false, instrumentSha256: Object.fromEntries(await Promise.all(files.map(async file => [file, sha(await readFile(join(import.meta.dir, file)))]))), child: { separateProcess: child.pid !== process.pid, sandboxProfileSha256: sha(profile), environmentKeys: expectedEnv, containment: rawCarrier.containment }, boundaries: { syntheticOnly: true, realResources: false, networkProviderCalls: 0, listeners: 0, sharedState: false, productionSourceChanges: false, parentHomeUsedOnlyForDenyAndProbePaths: true }, stdoutSha256: sha(stdout), stderrSha256: sha(stderr) };
const carrier: Record<string, unknown> = { 'results.json': { schemaVersion: 3, results: sanitized }, 'controls.json': controls, 'summary.json': summary, 'provenance.json': provenance };
for (const [name, value] of Object.entries(carrier)) { if (hasRaw(value)) throw new Error(`R033_STOP_03_${name}`); await Bun.write(join(evidenceRoot, name), JSON.stringify(value, null, 2) + '\n'); }
await Bun.write(join(evidenceRoot, 'README.md'), `# R-033 semantic disposable adapters ${runId}\n\nThis additive carrier executes candidate-distinct semantics for all CC-01 through CC-14 cells, including a separate restart process and frozen full-request/auth controls. All file, keychain, OAuth, provider, generated-code and persistence surfaces are synthetic in-memory adapters under a contained child; no real resource or production source is used. Per-layer S0-S8 controls are retained. This is still disposable mechanism-shaped evidence, not production fidelity or a decision. Independent review is required; R-033 stays collecting and synthesis is blocked.\n`);
const names = (await readdir(evidenceRoot)).filter(name => name !== 'SHA256SUMS').sort();
await Bun.write(join(evidenceRoot, 'SHA256SUMS'), (await Promise.all(names.map(async name => `${sha(await readFile(join(evidenceRoot, name)))}  ${name}`))).join('\n') + '\n');
console.log(JSON.stringify({ evidenceRoot, outcomes, layerControls: layerControls.length, restartProcesses: restartResults.length }, null, 2));
