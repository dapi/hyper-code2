import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { Database } from 'bun:sqlite';
import loadRoutes from '../../../src/http/loadRoutes';
import match from '../../../src/http/match';
import startHttp from '../../../src/http/$start';
import classify from '../../../src/project/classify';
import dbExec from '../../../src/db/exec';
import dbSelect from '../../../src/db/select';
import appendMessage from '../../../src/session/appendMessage';
import appendEvent from '../../../src/session/appendEvent';
import appendEventWithHtml from '../../../src/session/appendEventWithHtml';
import appendUserMessage from '../../../src/session/appendUserMessage';
import appendErrorEvent from '../../../src/session/appendErrorEvent';
import getMessages from '../../../src/session/getMessages';
import getEvents from '../../../src/session/getEvents';
import syncAgentState from '../../../src/session/syncAgentState';
import renderEventHtml from '../../../src/agent/renderEventHtml';
import workerLoop from '../../../src/agent/workerLoop';
import wakeWorker from '../../../src/agent/wakeWorker';
import { decideBroker } from './broker-child';

export const FREEZE_HEAD = '44225bf29d8f17c4275faa29a9be5ba59b88793d';
export const RUN_ID = '2026-08-13-44225bf-runtime-authority-v6';
export const RAW = 'R032_V6_RAW_SYNTHETIC_7f91';

export const CANDIDATES = [
    { id: 'CAN-01', locality: 'loopback', identity: false, capability: false, separation: false, broker: false },
    { id: 'CAN-02', locality: 'unix', identity: false, capability: false, separation: false, broker: false },
    { id: 'CAN-03', locality: 'unrestricted', identity: true, capability: false, separation: false, broker: false },
    { id: 'CAN-04', locality: 'unrestricted', identity: false, capability: true, separation: false, broker: false },
    { id: 'CAN-05', locality: 'unrestricted', identity: false, capability: false, separation: true, broker: false },
    { id: 'CAN-06', locality: 'unrestricted', identity: false, capability: false, separation: false, broker: true },
    { id: 'COM-01', locality: 'loopback', identity: true, capability: false, separation: false, broker: false },
    { id: 'COM-02', locality: 'unix', identity: false, capability: true, separation: false, broker: false },
    { id: 'COM-03', locality: 'loopback', identity: true, capability: false, separation: true, broker: true },
] as const;

export const CASES = [
    'immediate-missing', 'immediate-insufficient', 'immediate-sufficient',
    'use-expired', 'use-revoked', 'use-replay', 'use-reduced', 'use-missing',
    'mixed-principals-coalesced',
    'failure-verifier', 'failure-policy', 'failure-broker', 'failure-stale',
    'restart-stale', 'restart-missing', 'restart-recovery',
] as const;

export const COMMITTED_ENTRIES = [
    'src/$route_GET.ts',
    'src/agent/$route_$id_DELETE.ts', 'src/agent/$route_$id_GET.ts',
    'src/agent/$route_$id_POST.ts', 'src/agent/$route_$id_archive_POST.ts',
    'src/agent/$route_$id_delete_POST.ts', 'src/agent/$route_$id_events.html_GET.ts',
    'src/agent/$route_$id_events_GET.ts', 'src/agent/$route_$id_fork_POST.ts',
    'src/agent/$route_$id_messages_delete_POST.ts', 'src/agent/$route_$id_status_GET.ts',
    'src/agent/$route_$id_statusbar_GET.ts', 'src/agent/$route_$id_stop_POST.ts',
    'src/agent/$route_new_GET.ts', 'src/agent/$route_new_POST.ts', 'src/agent/$script_chat.js',
    'src/dev/$route_fail_GET.ts', 'src/events/$route__GET.ts', 'src/events/$route_client.js_GET.ts',
    'src/files/$route_GET.ts', 'src/files/$route__POST.ts', 'src/files/$route__PUT.ts',
    'src/files/$route_close_POST.ts', 'src/files/$script_editor.js', 'src/repl/$route__POST.ts',
    'src/self/$route_GET.ts', 'src/settings/$route__GET.ts',
    'src/settings/$route_codex_login_POST.ts', 'src/settings/$route_codex_logout_POST.ts',
    'src/settings/$route_declared_GET.ts', 'src/settings/$route_declared_POST.ts',
    'src/settings/$route_env_POST.ts', 'src/settings/$route_kimi_login_POST.ts',
    'src/settings/$route_kimi_logout_POST.ts', 'src/ui/$route_control.js_GET.ts',
    'src/ui/$route_eval_result_POST.ts', 'src/ui/$route_ping_GET.ts',
] as const;

export const MIGRATION_PATHS = [
    'src/session/$migrate_20260418000000_init.up.sql',
    'src/session/$migrate_20260428130000_add_archived_at.up.sql',
    'src/session/$migrate_20260428150000_add_forks.up.sql',
    'src/settings/$migrate_20260509120000_settings.up.sql',
    'src/session/$migrate_20270410120000_add_messages_excluded.up.sql',
    'src/session/$migrate_20270501123000_add_kv.up.sql',
    'src/session/$migrate_20270502000000_inline_run_state.up.sql',
    'src/session/$migrate_20270503120000_add_messages_excluded_from_cursor.up.sql',
    'src/session/$migrate_20270504120000_drop_tool_calls.up.sql',
] as const;

export const SOURCE_PATHS = [...new Set([
    ...COMMITTED_ENTRIES,
    ...MIGRATION_PATHS,
    'src/http/$start.ts', 'src/http/loadRoutes.ts', 'src/http/match.ts',
    'src/project/classify.ts', 'src/agent/workerLoop.ts', 'src/agent/wakeWorker.ts',
    'src/agent/$route_$id_POST.ts', 'src/session/appendUserMessage.ts',
    'src/session/appendMessage.ts', 'src/session/appendEvent.ts',
    'src/session/appendEventWithHtml.ts', 'src/session/appendErrorEvent.ts',
    'src/session/getMessages.ts', 'src/session/getEvents.ts', 'src/session/syncAgentState.ts',
    'src/agent/renderEventHtml.ts', 'src/db/exec.ts', 'src/db/select.ts',
])];

type Candidate = typeof CANDIDATES[number];
type CaseId = typeof CASES[number];
type Decision = { allow: boolean; reason: string; principal: string | null; scope: string | null };

const repo = resolve(import.meta.dir, '../../..');
const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
const transforms = (value: string) => ({
    raw: value,
    base64: Buffer.from(value).toString('base64'),
    hex: Buffer.from(value).toString('hex'),
    url: encodeURIComponent(value),
    reverse: [...value].reverse().join(''),
});

export function detections(value: unknown) {
    const text = JSON.stringify(value);
    return Object.entries(transforms(RAW)).filter(([, needle]) => text.includes(needle)).map(([name]) => name);
}

function controlled(candidate: Candidate) {
    return candidate.identity || candidate.capability || candidate.broker;
}

function caseState(caseId: CaseId) {
    const sufficient = !caseId.endsWith('missing') && caseId !== 'immediate-insufficient';
    return {
        caller: sufficient ? 'sufficient' : caseId === 'immediate-insufficient' ? 'insufficient' : 'missing',
        principal: sufficient ? 'principal-a' : null,
        scope: caseId === 'use-reduced' ? 'ordinary' : sufficient ? 'privileged' : null,
        expiresAt: caseId === 'use-expired' ? 99 : 200,
        now: 100,
        revoked: caseId === 'use-revoked',
        replayed: caseId === 'use-replay',
        generation: caseId === 'restart-stale' || caseId === 'failure-stale' ? 1 : 2,
        expectedGeneration: 2,
        verifierAvailable: caseId !== 'failure-verifier',
        policyAvailable: caseId !== 'failure-policy',
        brokerAvailable: caseId !== 'failure-broker',
    };
}

function enqueueState(caseId: CaseId) {
    const state = caseState(caseId);
    if (!caseId.startsWith('immediate-') && !caseId.startsWith('failure-verifier')
        && !caseId.startsWith('failure-policy') && !caseId.startsWith('failure-broker')) {
        state.caller = 'sufficient';
        state.principal = 'principal-a';
        state.scope = 'privileged';
    }
    return state;
}

async function decide(candidate: Candidate, phase: 'enqueue' | 'use', state: ReturnType<typeof caseState>, brokerMode: 'memory' | 'child', ipc: unknown[]): Promise<Decision> {
    if ((candidate.identity || candidate.capability) && !state.verifierAvailable) return { allow: false, reason: 'verifier-unavailable', principal: null, scope: null };
    if ((candidate.identity || candidate.capability || candidate.separation) && !state.policyAvailable) return { allow: false, reason: 'policy-unavailable', principal: null, scope: null };
    if (controlled(candidate)) {
        if (!state.principal) return { allow: false, reason: `${phase}-context-missing`, principal: null, scope: null };
        if (state.scope !== 'privileged') return { allow: false, reason: `${phase}-scope-deny`, principal: state.principal, scope: state.scope };
        if (phase === 'use' && state.now >= state.expiresAt) return { allow: false, reason: 'use-expired', principal: state.principal, scope: state.scope };
        if (phase === 'use' && state.revoked) return { allow: false, reason: 'use-revoked', principal: state.principal, scope: state.scope };
        if (phase === 'use' && state.replayed) return { allow: false, reason: 'use-replay', principal: state.principal, scope: state.scope };
        if (phase === 'use' && state.generation !== state.expectedGeneration) return { allow: false, reason: 'use-generation-stale', principal: state.principal, scope: state.scope };
    }
    if (candidate.broker) {
        const request = {
            phase, candidate: candidate.id as 'CAN-06' | 'COM-03', principal: state.principal,
            scope: state.scope, generation: state.generation, expectedGeneration: state.expectedGeneration,
            credentialDigest: state.principal ? hash(RAW) : null, brokerAvailable: state.brokerAvailable,
        };
        ipc.push(request);
        const result = brokerMode === 'child' ? await childBroker(request) : decideBroker(request);
        ipc.push(result);
        if (!result.allow) return { ...result, principal: state.principal, scope: state.scope };
    }
    return { allow: true, reason: controlled(candidate) ? `${phase}-authorized` : 'ambient-authority-gap', principal: state.principal, scope: state.scope };
}

async function childBroker(request: Parameters<typeof decideBroker>[0]) {
    const child = Bun.spawn([process.execPath, resolve(import.meta.dir, 'broker-child.ts')], {
        cwd: repo, env: { R032_V6_CHILD: '1' }, stdin: 'pipe', stdout: 'pipe', stderr: 'pipe',
    });
    child.stdin.write(JSON.stringify(request));
    child.stdin.end();
    const [stdout, stderr, code] = await Promise.all([
        new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
    ]);
    assert.equal(code, 0, stderr);
    return JSON.parse(stdout);
}

async function frozenEntries() {
    return Promise.all(COMMITTED_ENTRIES.map(async (path) => {
        const rel = path.slice('src/'.length);
        const meta: any = classify(rel);
        assert.ok(meta.kind === 'route' || meta.kind === 'script', path);
        return { ...meta, root: 'src', rootDir: resolve(repo, 'src'), abs: resolve(repo, path) };
    }));
}

async function capturedFetch(ctx: any, stops: string[]) {
    let serveOptions: any;
    const old = { serve: Bun.serve, file: Bun.file, write: Bun.write };
    (Bun as any).serve = (options: any) => {
        stops.push('Bun.serve:captured-no-listener');
        serveOptions = options;
        return { timeout() {}, requestIP: () => ({ address: '127.0.0.1' }) };
    };
    (Bun as any).file = () => ({ writer: () => ({ write() {}, flush() {} }) });
    (Bun as any).write = async () => { stops.push('Bun.write:captured-no-write'); return 0; };
    try { await startHttp(ctx); } finally {
        (Bun as any).serve = old.serve; (Bun as any).file = old.file; (Bun as any).write = old.write;
    }
    assert.equal(typeof serveOptions?.fetch, 'function');
    return serveOptions.fetch as (request: globalThis.Request) => Promise<Response>;
}

function createEnvelopeTable(ctx: any) {
    ctx.fns.db.exec(ctx, { sql: `CREATE TABLE r032_v6_envelopes (
        agent_id TEXT NOT NULL, message_idx INTEGER NOT NULL, case_id TEXT NOT NULL,
        principal TEXT, scope TEXT, credential_digest TEXT, generation INTEGER,
        expires_at INTEGER, revoked INTEGER NOT NULL, replayed INTEGER NOT NULL,
        PRIMARY KEY(agent_id, message_idx))` });
}

async function runSuite(dbPath: string, brokerMode: 'memory' | 'child') {
    const ctx: any = await makeContainedContext(dbPath);
    const stops: string[] = [];
    const ipc: unknown[] = [];
    const audit: unknown[] = [];
    const outcomes = new Map<string, any>();
    const jobs = new Map<string, { candidate: Candidate; caseId: CaseId }>();
    createEnvelopeTable(ctx);
    ctx.fns.http = { match };
    ctx.fns.project = { scan: async () => frozenEntries() };
    await loadRoutes(ctx);
    assert.equal(Object.values(ctx.routes).reduce((n: number, row: any) => n + Object.keys(row).length, 0), 37);
    const realPost = ctx.routes['/agent/:id']?.POST;
    assert.equal(typeof realPost, 'function');

    ctx.routes['/agent/:id'].POST = async (routeCtx: any, params: any, request: Request) => {
        const job = jobs.get((request as any).params.id)!;
        const state = enqueueState(job.caseId);
        const authorization = request.headers.get('authorization');
        state.principal = authorization ? request.headers.get('x-r032-principal') : null;
        state.caller = authorization ? state.caller : 'missing';
        const immediate = await decide(job.candidate, 'enqueue', state, brokerMode, ipc);
        audit.push({ stage: 'enqueue', candidate: job.candidate.id, caseId: job.caseId, decision: immediate.reason });
        if (!immediate.allow) {
            outcomes.set((request as any).params.id, { immediate, use: null });
            return Response.json({ error: immediate.reason }, { status: 403 });
        }
        const response = await realPost(routeCtx, params, request);
        const idx = Number(ctx.fns.db.select(ctx, { sql: 'SELECT MAX(idx) idx FROM messages WHERE agent_id = ?', params: [(request as any).params.id] })[0].idx);
        ctx.fns.db.exec(ctx, { sql: `INSERT INTO r032_v6_envelopes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, params: [
            (request as any).params.id, idx, job.caseId, immediate.principal, immediate.scope,
            immediate.principal ? hash(RAW) : null, state.generation, state.expiresAt,
            Number(state.revoked), Number(state.replayed),
        ] });
        outcomes.set((request as any).params.id, { immediate, use: null });
        return response;
    };

    ctx.fns.agent.run = async (_runCtx: any, opts: any) => {
        const job = jobs.get(opts.agent.id)!;
        const state = caseState(job.caseId);
        const claim = ctx.fns.db.select(ctx, { sql: 'SELECT run_state, run_started_at, last_processed_msg_idx FROM agents WHERE id = ?', params: [opts.agent.id] })[0];
        const frontier = Number(ctx.fns.db.select(ctx, { sql: `SELECT COALESCE(MAX(idx), -1) max_idx FROM messages
            WHERE agent_id = ? AND role = 'user' AND excluded_from_cursor = 0`, params: [opts.agent.id] })[0].max_idx);
        const envelopes = ctx.fns.db.select(ctx, { sql: 'SELECT * FROM r032_v6_envelopes WHERE agent_id = ? ORDER BY message_idx', params: [opts.agent.id] });
        if (job.caseId === 'use-missing' || job.caseId === 'restart-missing') envelopes.length = 0;
        if (job.caseId === 'mixed-principals-coalesced' && new Set(envelopes.map((row: any) => row.principal)).size > 1 && controlled(job.candidate)) {
            const use = { allow: false, reason: 'mixed-principals-deny', principal: null, scope: null };
            outcomes.get(opts.agent.id).use = use;
            outcomes.get(opts.agent.id).worker = { claimRunState: claim.run_state, runStarted: claim.run_started_at != null, frontier, envelopeCount: envelopes.length };
            throw new Error(`R032_V6_DENY:${use.reason}`);
        }
        const row = envelopes.at(-1);
        if (row) {
            state.principal = row.principal; state.scope = row.scope; state.generation = Number(row.generation);
            state.expiresAt = Number(row.expires_at); state.revoked = Boolean(row.revoked); state.replayed = Boolean(row.replayed);
        } else {
            state.principal = null; state.scope = null;
        }
        if (job.caseId === 'use-reduced') state.scope = 'ordinary';
        if (job.caseId === 'restart-recovery') state.generation = state.expectedGeneration;
        const use = await decide(job.candidate, 'use', state, brokerMode, ipc);
        outcomes.get(opts.agent.id).use = use;
        outcomes.get(opts.agent.id).worker = { claimRunState: claim.run_state, runStarted: claim.run_started_at != null, frontier, envelopeCount: envelopes.length };
        audit.push({ stage: 'use', candidate: job.candidate.id, caseId: job.caseId, decision: use.reason });
        if (!use.allow) throw new Error(`R032_V6_DENY:${use.reason}`);
    };

    const fetch = await capturedFetch(ctx, stops);
    const rows: any[] = [];
    for (const candidate of CANDIDATES) {
        for (const caseId of CASES) {
            const agent = seedAgent(ctx, `${candidate.id.toLowerCase()}-${caseId}`);
            jobs.set(agent.id, { candidate, caseId });
            const requests = caseId === 'mixed-principals-coalesced' ? ['principal-a', 'principal-b'] : ['principal-a'];
            const requestCaptures: unknown[] = [];
            const responses = [];
            for (const principal of requests) {
                const state = enqueueState(caseId);
                if (caseId === 'mixed-principals-coalesced') state.principal = principal;
                const authorization = state.caller === 'missing' ? null : `Bearer ${RAW}`;
                requestCaptures.push({ authorization, principal, scope: state.scope });
                const headers: Record<string, string> = { 'content-type': 'text/plain', accept: 'application/json', 'x-r032-principal': principal };
                if (authorization) headers.authorization = authorization;
                const response = await fetch(new Request(`http://synthetic.invalid/agent/${agent.id}?debounceSeconds=0`, {
                    method: 'POST', headers, body: `safe-message:${candidate.id}:${caseId}:${principal}`,
                }));
                responses.push({ status: response.status, body: await response.text() });
                if (response.status === 403) break;
                if (caseId === 'mixed-principals-coalesced') {
                    ctx.fns.db.exec(ctx, { sql: 'UPDATE r032_v6_envelopes SET principal = ? WHERE agent_id = ? AND message_idx = (SELECT MAX(message_idx) FROM r032_v6_envelopes WHERE agent_id = ?)', params: [principal, agent.id, agent.id] });
                }
            }
            if (caseId === 'use-missing' || caseId === 'restart-missing') {
                ctx.fns.db.exec(ctx, { sql: 'DELETE FROM r032_v6_envelopes WHERE agent_id = ?', params: [agent.id] });
            }
            const queued = Number(ctx.fns.db.select(ctx, { sql: 'SELECT COUNT(*) n FROM agents WHERE id = ? AND next_run_at IS NOT NULL', params: [agent.id] })[0].n);
            if (queued) await drainOne(ctx, agent.id);
            const dbEnvelope = ctx.fns.db.select(ctx, { sql: 'SELECT * FROM r032_v6_envelopes WHERE agent_id = ?', params: [agent.id] });
            const messages = ctx.fns.db.select(ctx, { sql: 'SELECT role, content FROM messages WHERE agent_id = ?', params: [agent.id] });
            const events = ctx.fns.db.select(ctx, { sql: 'SELECT type, payload FROM events WHERE agent_id = ?', params: [agent.id] });
            const agentRow = ctx.fns.db.select(ctx, { sql: 'SELECT run_state, next_run_at, last_processed_msg_idx, last_error FROM agents WHERE id = ?', params: [agent.id] })[0];
            const result = outcomes.get(agent.id) ?? { immediate: null, use: null };
            const sinks = {
                S0_request: requestCaptures,
                S1_envelope: dbEnvelope.map(({ credential_digest, ...rest }: any) => ({ ...rest, credentialDigest: credential_digest })),
                S2_db: dbEnvelope,
                S3_messages: messages,
                S4_results: { responses, result, agentRow },
                S5_ipc: ipc.filter((entry: any) => entry?.candidate === candidate.id),
                S6_audit: audit.filter((entry: any) => entry?.candidate === candidate.id && entry?.caseId === caseId),
                S7_render: events,
                S8_model_input: messages.map((message: any) => ({ role: message.role, content: message.content })),
            };
            rows.push({ candidate: candidate.id, caseId, responses, queued, result, agentRow,
                fidelity: candidate.broker ? (brokerMode === 'child' ? 'real-disposable-stdio-child' : 'in-memory-protocol-self-test') : 'in-process-disposable-use-time-gate',
                sinks: Object.fromEntries(Object.entries(sinks).map(([name, value]) => [name, { detections: detections(value) }])),
            });
        }
    }
    (ctx.state as any).db.close();
    return { rows, stops, ipc, audit };
}

async function drainOne(ctx: any, agentId: string) {
    const loop = ctx.fns.agent.workerLoop(ctx);
    const deadline = Date.now() + 3_000;
    let completed = false;
    try {
        while (Date.now() < deadline) {
            const row = ctx.fns.db.select(ctx, { sql: 'SELECT run_state, next_run_at FROM agents WHERE id = ?', params: [agentId] })[0];
            if (row.run_state === 'idle' && row.next_run_at == null) { completed = true; break; }
            await Bun.sleep(5);
        }
    } finally {
        (ctx.state as any).workerLoopRunning = false;
        ctx.fns.agent.wakeWorker(ctx);
        await loop;
    }
    assert(completed, `workerLoop shutdown deadline exceeded for ${agentId}`);
}

async function makeContainedContext(dbPath: string) {
    const db = new Database(dbPath, { create: true });
    db.exec('PRAGMA journal_mode = WAL');
    for (const path of MIGRATION_PATHS) db.exec(await readFile(resolve(repo, path), 'utf8'));
    const ctx: any = {
        env: { PORT: '31337' }, routes: {}, state: { db, agent: {} },
        fns: {
            db: { exec: dbExec, select: dbSelect },
            session: {
                load: (inner: any, opts: any) => inner.state.agent[opts.id] ?? null,
                appendMessage, appendEvent, appendEventWithHtml, appendUserMessage, appendErrorEvent,
                getMessages, getEvents, syncAgentState,
            },
            agent: { renderEventHtml, workerLoop, wakeWorker, wakeWaiters: () => {} },
            settings: { getNumber: () => undefined },
            events: { emit: () => {}, emitAgentsChanged: () => {} },
            self: { describe: async () => ({ schemaVersion: 1, provenance: 'r032-v6-synthetic-self' }) },
        },
    };
    return ctx;
}

function seedAgent(ctx: any, id: string) {
    const now = Date.now();
    ctx.fns.db.exec(ctx, { sql: `INSERT INTO agents
        (id, model, system_prompt, scratchpad, created_at, updated_at, run_state, last_processed_msg_idx)
        VALUES (?, ?, '', '{}', ?, ?, 'idle', -1)`, params: [id, 'r032-v6:safe-gate', now, now] });
    const agent = {
        id, model: 'r032-v6:safe-gate', systemPrompt: '', scratchpad: {}, messages: [], events: [],
        cursors: {}, subscribers: new Set(), waiters: [], isStreaming: false,
        abortController: null, parentId: null, forkOffset: null, currentJobId: null, drainPromise: null,
    };
    ctx.state.agent[id] = agent;
    return agent;
}

export async function selfTest() {
    const result = await runSuite(':memory:', 'memory');
    assert.equal(result.rows.length, CANDIDATES.length * CASES.length);
    assert(result.rows.every((row) => row.sinks.S0_request.detections.length === 0 || row.sinks.S0_request.detections.includes('raw')));
    assert(result.rows.every((row) => Object.entries(row.sinks).filter(([name]) => name !== 'S0_request').every(([, sink]: any) => sink.detections.length === 0)));
    assert(CANDIDATES.every((candidate) => CASES.every((caseId) => result.rows.some((row) => row.candidate === candidate.id && row.caseId === caseId))));
    assert.equal(detections({ deliberate: RAW }).includes('raw'), true);
    assert.equal(detections({ digest: hash(RAW) }).length, 0);
    const row = (candidate: string, caseId: string) => result.rows.find((item) => item.candidate === candidate && item.caseId === caseId)!;
    assert.equal(row('CAN-03', 'immediate-missing').responses[0].status, 403);
    assert.equal(row('CAN-03', 'immediate-sufficient').result.use.allow, true);
    assert.equal(row('CAN-03', 'use-expired').result.use.allow, false);
    assert.equal(row('CAN-03', 'use-revoked').result.use.allow, false);
    assert.equal(row('CAN-04', 'use-replay').result.use.allow, false);
    assert.equal(row('CAN-04', 'use-reduced').result.use.allow, false);
    assert.equal(row('CAN-03', 'use-missing').result.use.allow, false);
    assert.equal(row('CAN-03', 'mixed-principals-coalesced').result.use.reason, 'mixed-principals-deny');
    assert.equal(row('CAN-06', 'failure-broker').responses[0].status, 403);
    assert.equal(row('COM-03', 'restart-stale').result.use.allow, false);
    assert.equal(row('COM-03', 'restart-recovery').result.use.allow, true);
    assert.equal(row('CAN-01', 'immediate-missing').result.use.allow, true);
    assert.equal(row('CAN-03', 'immediate-sufficient').result.worker.claimRunState, 'running');
    assert.equal(row('CAN-03', 'immediate-sufficient').result.worker.frontier, 0);
    return { rows: result.rows.length, candidates: CANDIDATES.length, cases: CASES.length, sinks: 9 };
}

async function preflight(reviewPath: string) {
    const freezePath = resolve(import.meta.dir, 'freeze.json');
    const freezeBytes = await readFile(freezePath);
    const freeze: any = JSON.parse(freezeBytes.toString());
    assert.equal(await command(['git', 'rev-parse', 'HEAD']), FREEZE_HEAD);
    assert.equal(await command(['git', 'status', '--short', '--', 'src']), '');
    assert.equal(freeze.head, FREEZE_HEAD);
    for (const [path, expected] of Object.entries(freeze.sourceHashes)) {
        assert.equal(hash(await readFile(resolve(repo, path))), expected, `source drift: ${path}`);
    }
    for (const [path, expected] of Object.entries(freeze.instrumentHashes)) {
        assert.equal(hash(await readFile(resolve(repo, path))), expected, `instrument drift: ${path}`);
    }
    const absoluteReview = resolve(repo, reviewPath);
    assert(absoluteReview.startsWith(resolve(repo, '.protocols/reviews/') + '/'), 'review must be under .protocols/reviews');
    const review = JSON.parse(await readFile(absoluteReview, 'utf8'));
    assert.equal(review.status, 'accepted-precollection');
    assert.equal(review.freezeSha256, hash(freezeBytes));
    return { freeze, freezeSha256: hash(freezeBytes), review };
}

async function collect(reviewPath: string) {
    installStopGuards();
    const pre = await preflight(reviewPath); // must finish before temp creation or child spawn
    const temp = await mkdtemp(resolve(tmpdir(), 'r032-v6-'));
    const runDir = resolve(repo, '.protocols/experiments/runs/R-032', RUN_ID);
    try {
        const result = await runSuite(resolve(temp, 'carrier.sqlite'), 'child');
        const artifacts: Record<string, unknown> = {
            'results.json': result.rows,
            'manifest.json': { candidates: CANDIDATES, cases: CASES, committedEntries: 37, sinkStages: ['S0','S1','S2','S3','S4','S5','S6','S7','S8'], completeMatrix: false },
            'provenance.json': { runId: RUN_ID, head: FREEZE_HEAD, freezeSha256: pre.freezeSha256, review: pre.review, environment: pre.freeze.environment, stops: result.stops, sourceHashes: pre.freeze.sourceHashes, instrumentHashes: pre.freeze.instrumentHashes },
        };
        await mkdir(runDir, { recursive: false });
        for (const [name, value] of Object.entries(artifacts)) await writeFile(resolve(runDir, name), JSON.stringify(value, null, 2) + '\n');
    } finally {
        await rm(temp, { recursive: true, force: true });
    }
}

function installStopGuards() {
    const stop = (name: string) => () => { throw new Error(`STOP-03:${name}`); };
    (Bun as any).serve = stop('real-listener');
    (Bun as any).connect = stop('real-socket');
    (globalThis as any).fetch = stop('network-fetch');
    (globalThis as any).WebSocket = class { constructor() { throw new Error('STOP-03:websocket'); } };
}

async function command(args: string[]) {
    const child = Bun.spawn(args, { cwd: repo, env: { PATH: process.env.PATH ?? '/usr/bin:/bin' }, stdout: 'pipe', stderr: 'pipe' });
    const [stdout, stderr, code] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited]);
    assert.equal(code, 0, `${args.join(' ')}: ${stderr}`);
    return stdout.trim();
}

if (import.meta.main) {
    const collectIndex = process.argv.indexOf('--collect');
    if (collectIndex === -1) throw new Error('collection locked: run self-test.ts or pass --collect <accepted-review.json> after independent pre-review');
    const reviewPath = process.argv[collectIndex + 1];
    if (!reviewPath) throw new Error('--collect requires an accepted review file');
    await collect(reviewPath);
}
