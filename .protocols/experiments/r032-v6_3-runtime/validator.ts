import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { detectSentinel, sentinelForms } from '../r018-sentinel-lib';

export const CANDIDATE_IDS = ['CAN-01','CAN-02','CAN-03','CAN-04','CAN-05','CAN-06','COM-01','COM-02','COM-03'] as const;
export const CASE_IDS = [
    'immediate-missing','immediate-insufficient','immediate-sufficient',
    'use-expired','use-revoked','use-replay','use-reduced','use-missing',
    'mixed-principals-coalesced','failure-verifier','failure-policy','failure-broker','failure-stale',
    'restart-stale','restart-missing','restart-recovery',
] as const;
export const SINK_IDS = ['S0_request','S1_authority_envelope_projection','S2_sqlite_authority_rows','S3_transcript_messages','S4_safe_gate_result','S5_broker_ipc_serialized','S6_audit_record','S7_persisted_event_payload_projection_html_omitted','S8_transcript_rows_not_model_input'] as const;
export const INVENTORY_PATHS = [
 'src/$route_GET.ts','src/agent/$route_$id_DELETE.ts','src/agent/$route_$id_GET.ts','src/agent/$route_$id_POST.ts','src/agent/$route_$id_archive_POST.ts','src/agent/$route_$id_delete_POST.ts','src/agent/$route_$id_events.html_GET.ts','src/agent/$route_$id_events_GET.ts','src/agent/$route_$id_fork_POST.ts','src/agent/$route_$id_messages_delete_POST.ts','src/agent/$route_$id_status_GET.ts','src/agent/$route_$id_statusbar_GET.ts','src/agent/$route_$id_stop_POST.ts','src/agent/$route_new_GET.ts','src/agent/$route_new_POST.ts','src/agent/$script_chat.js','src/dev/$route_fail_GET.ts','src/events/$route__GET.ts','src/events/$route_client.js_GET.ts','src/files/$route_GET.ts','src/files/$route__POST.ts','src/files/$route__PUT.ts','src/files/$route_close_POST.ts','src/files/$script_editor.js','src/repl/$route__POST.ts','src/self/$route_GET.ts','src/settings/$route__GET.ts','src/settings/$route_codex_login_POST.ts','src/settings/$route_codex_logout_POST.ts','src/settings/$route_declared_GET.ts','src/settings/$route_declared_POST.ts','src/settings/$route_env_POST.ts','src/settings/$route_kimi_login_POST.ts','src/settings/$route_kimi_logout_POST.ts','src/ui/$route_control.js_GET.ts','src/ui/$route_eval_result_POST.ts','src/ui/$route_ping_GET.ts',
] as const;
export type CandidateId = typeof CANDIDATE_IDS[number];
export type CaseId = typeof CASE_IDS[number];

export function detectSerializedForms(serialized:string, forms=sentinelForms()) {
    const hits=new Set(detectSentinel(serialized,forms).map(hit=>hit.formId));
    try {
        const visit=(value:unknown)=>{if(typeof value==='string')for(const hit of detectSentinel(value,forms))hits.add(hit.formId);else if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')Object.values(value).forEach(visit)};
        visit(JSON.parse(serialized));
    } catch {}
    return [...hits].sort();
}

const BROKER = new Set<CandidateId>(['CAN-06','COM-03']);
const CONTROLLED = new Set<CandidateId>(['CAN-03','CAN-04','CAN-06','COM-01','COM-02','COM-03']);
const IDENTITY_OR_CAPABILITY = new Set<CandidateId>(['CAN-03','CAN-04','COM-01','COM-02','COM-03']);
const POLICY = new Set<CandidateId>(['CAN-03','CAN-04','CAN-05','CAN-06','COM-01','COM-02','COM-03']);
const sha = (value:string) => createHash('sha256').update(value).digest('hex');
const EXPECTED_INVENTORY_DIGEST = 'd1091f46df6c4d5375ab7f7b62e43cec72eb0db49b5f1129d5b9a1420efc145a';

export type RuntimeRow = {
    candidate: CandidateId;
    caseId: CaseId;
    registrationCount: number;
    responses: Array<{ status: number; errorCode: string | null }>;
    queued: boolean;
    decisions: { enqueue: { allow: boolean; reason: string } | null; use: { allow: boolean; reason: string } | null };
    root: { parentAllocated: boolean; parentCalls: number; childCalls: number; owner: 'parent'|'broker-transport'|'none'; receipts: unknown[] };
    worker: { reached: boolean; claimRunState: string | null; frontier: number | null; envelopeCount: number; cursorBefore: number; cursorAfter: number; lastError: string | null };
    transitions: Array<{ name: string; from: unknown; to: unknown }>;
    restartBoundary: null | { schema: 'r032-reconstructed-store-v1'; beforeStore: string; afterStore: string; beforeGeneration: number; afterGeneration: number; serializedDigest: string };
    inventory: { count: number; entries: Array<{ path: string; sha256: string }>; digest: string };
    sinks: Record<typeof SINK_IDS[number], { value: string; detections: string[] }>;
};

export type ValidatedRuntimeRun = Readonly<{ rows: readonly RuntimeRow[]; summary: Readonly<{ passed:true; rows:144; matrix:'9x16'; validatorInput:'runtime-rows-only' }> }>;
const validatedRuns = new WeakSet<object>();
function deepFreeze(value:any):any { if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))deepFreeze(child)}return value; }
export function assertValidatedRuntimeRun(value:unknown): asserts value is ValidatedRuntimeRun { assert(value&&typeof value==='object'&&validatedRuns.has(value as object),'validated runtime token required'); }

function controlled(id: CandidateId) { return CONTROLLED.has(id); }

function expectedEnqueue(id: CandidateId, caseId: CaseId) {
    if (!controlled(id)) return { allow: true, reason: 'ambient-authority-gap' };
    if (caseId === 'immediate-missing') return { allow: false, reason: 'enqueue-context-missing' };
    if (caseId === 'immediate-insufficient') return { allow: false, reason: 'enqueue-scope-deny' };
    if (caseId === 'failure-verifier' && IDENTITY_OR_CAPABILITY.has(id)) return { allow: false, reason: 'verifier-unavailable' };
    if (caseId === 'failure-policy' && POLICY.has(id)) return { allow: false, reason: 'policy-unavailable' };
    if (caseId === 'failure-broker' && BROKER.has(id)) return { allow: false, reason: 'broker-unavailable' };
    return { allow: true, reason: BROKER.has(id) ? 'broker-enqueue-allow' : 'enqueue-authorized' };
}

function expectedUse(id: CandidateId, caseId: CaseId) {
    if (!controlled(id)) return { allow: true, reason: 'ambient-authority-gap' };
    const reasons: Partial<Record<CaseId,string>> = {
        'use-expired': 'use-expired', 'use-revoked': 'use-revoked', 'use-replay': 'use-replay',
        'use-reduced': 'use-scope-deny', 'use-missing': 'use-context-missing',
        'mixed-principals-coalesced': 'mixed-principals-deny', 'failure-stale': 'use-generation-stale',
        'restart-stale': 'use-generation-stale', 'restart-missing': 'use-context-missing',
    };
    if (reasons[caseId]) return { allow: false, reason: reasons[caseId]! };
    return { allow: true, reason: BROKER.has(id) ? 'broker-use-allow' : 'use-authorized' };
}

export function validateRuntimeRows(rows: RuntimeRow[]) {
    assert(Array.isArray(rows), 'rows must be an array');
    assert.equal(rows.length, CANDIDATE_IDS.length * CASE_IDS.length, 'exact 9x16 row count');
    const keys = new Set(rows.map((row) => `${row.candidate}/${row.caseId}`));
    assert.equal(keys.size, rows.length, 'duplicate candidate/case row');
    for (const id of CANDIDATE_IDS) for (const caseId of CASE_IDS) assert(keys.has(`${id}/${caseId}`), `missing ${id}/${caseId}`);

    for (const row of rows) {
        assert.deepEqual(Object.keys(row).sort(),['candidate','caseId','decisions','inventory','queued','registrationCount','responses','restartBoundary','root','sinks','transitions','worker']);
        assert(CANDIDATE_IDS.includes(row.candidate)); assert(CASE_IDS.includes(row.caseId));
        assert.equal(row.registrationCount, 37, `${row.candidate}/${row.caseId}: registration count`);
        assert.equal(row.inventory.count, 37);
        assert.deepEqual(row.inventory.entries.map((entry) => entry.path), [...INVENTORY_PATHS]);
        assert(row.inventory.entries.every((entry) => /^[a-f0-9]{64}$/.test(entry.sha256)));
        assert.equal(row.inventory.digest, sha(JSON.stringify(row.inventory.entries)));
        assert.equal(row.inventory.digest, EXPECTED_INVENTORY_DIGEST, 'inventory/source hash drift');
        const enqueue = expectedEnqueue(row.candidate, row.caseId);
        assert.deepEqual(row.decisions.enqueue, enqueue, `${row.candidate}/${row.caseId}: enqueue decision`);
        assert.equal(row.responses[0]?.status, enqueue.allow ? 200 : 403, `${row.candidate}/${row.caseId}: response`);
        assert.equal(row.responses[0]?.errorCode, enqueue.allow ? null : enqueue.reason);
        assert.equal(row.responses.length, enqueue.allow && row.caseId === 'mixed-principals-coalesced' ? 2 : 1, `${row.candidate}/${row.caseId}: response count`);
        assert(row.responses.every((response) => response.status === (enqueue.allow ? 200 : 403)));
        assert(row.responses.every((response) => response.errorCode === (enqueue.allow ? null : enqueue.reason)));
        assert.equal(row.queued, enqueue.allow, `${row.candidate}/${row.caseId}: queue state`);
        const expected = enqueue.allow ? expectedUse(row.candidate, row.caseId) : null;
        assert.deepEqual(row.decisions.use, expected, `${row.candidate}/${row.caseId}: use decision`);
        assert.equal(row.worker.reached, enqueue.allow, `${row.candidate}/${row.caseId}: worker reached`);
        assert.equal(row.worker.claimRunState, enqueue.allow ? 'running' : null);
        assert.equal(row.worker.frontier, enqueue.allow ? (row.caseId === 'mixed-principals-coalesced' ? 1 : 0) : null);
        const expectedEnvelopeCount = !enqueue.allow || row.caseId === 'use-missing' || row.caseId === 'restart-missing'
            ? 0 : row.caseId === 'mixed-principals-coalesced' ? 2 : 1;
        assert.equal(row.worker.envelopeCount, expectedEnvelopeCount, `${row.candidate}/${row.caseId}: envelope count`);
        assert.equal(row.worker.cursorBefore, -1);
        assert.equal(row.worker.cursorAfter, expected?.allow ? row.worker.frontier : -1, `${row.candidate}/${row.caseId}: cursor outcome`);
        assert.equal(Boolean(row.worker.lastError), Boolean(expected && !expected.allow), `${row.candidate}/${row.caseId}: error outcome`);
        assert.equal(row.worker.lastError, expected && !expected.allow ? `R032_V63_DENY:${expected.reason}` : null);
        const allowedRoot = Boolean(expected?.allow);
        assert.equal(row.root.parentAllocated, !BROKER.has(row.candidate), `${row.candidate}/${row.caseId}: parent allocation`);
        assert.equal(row.root.parentCalls, BROKER.has(row.candidate) ? 0 : Number(allowedRoot), `${row.candidate}/${row.caseId}: parent root`);
        assert.equal(row.root.childCalls, BROKER.has(row.candidate) ? Number(allowedRoot) : 0, `${row.candidate}/${row.caseId}: broker root`);
        assert.equal(row.root.owner, allowedRoot ? (BROKER.has(row.candidate) ? 'broker-transport' : 'parent') : 'none');
        assert.equal(row.root.receipts.length, Number(allowedRoot), `${row.candidate}/${row.caseId}: root receipt count`);
        if (allowedRoot) {
            assert.equal((row.root.receipts[0] as any)?.invoked, true);
            assert.equal((row.root.receipts[0] as any)?.owner, BROKER.has(row.candidate) ? `broker:${row.candidate}` : `parent:${row.candidate}`);
        }
        const transitionNames: Partial<Record<CaseId,string[]>> = {
            'use-expired':['expiry'], 'use-revoked':['revocation'], 'use-replay':['replay'], 'use-reduced':['attenuation'],
            'use-missing':['propagation-removal'], 'failure-stale':['generation-stale'], 'restart-stale':['generation-stale'],
            'restart-missing':['propagation-removal'], 'restart-recovery':['restart-boundary','rebind-after-restart'],
        };
        assert.deepEqual(row.transitions.map((item) => item.name), enqueue.allow ? (transitionNames[row.caseId] ?? []) : [], `${row.candidate}/${row.caseId}: transitions`);
        const exactTransitions: Partial<Record<CaseId,Array<{name:string;from:unknown;to:unknown}>>> = {
            'use-expired':[{name:'expiry',from:200,to:99}], 'use-revoked':[{name:'revocation',from:0,to:1}],
            'use-replay':[{name:'replay',from:0,to:1}], 'use-reduced':[{name:'attenuation',from:'privileged',to:'ordinary'}],
            'use-missing':[{name:'propagation-removal',from:1,to:0}], 'failure-stale':[{name:'generation-stale',from:2,to:1}],
            'restart-stale':[{name:'generation-stale',from:2,to:1}], 'restart-missing':[{name:'propagation-removal',from:1,to:0}],
            'restart-recovery':[{name:'restart-boundary',from:'sqlite-memory-before',to:'sqlite-memory-after'},{name:'rebind-after-restart',from:2,to:3}],
        };
        assert.deepEqual(row.transitions, enqueue.allow ? (exactTransitions[row.caseId] ?? []) : []);
        if (row.caseId === 'restart-recovery' && enqueue.allow) {
            assert(row.transitions.some((t) => t.name === 'restart-boundary' && t.from !== t.to));
            assert.equal(row.decisions.use?.allow, true);
            assert.deepEqual(Object.keys(row.restartBoundary!).sort(), ['afterGeneration','afterStore','beforeGeneration','beforeStore','schema','serializedDigest']);
            assert.equal(row.restartBoundary?.schema, 'r032-reconstructed-store-v1');
            assert.notEqual(row.restartBoundary?.beforeStore, row.restartBoundary?.afterStore);
            assert.equal(row.restartBoundary?.beforeGeneration, 2);
            assert.equal(row.restartBoundary?.afterGeneration, 3);
            assert.equal(row.restartBoundary!.serializedDigest,sha(JSON.stringify({generation:3,source:'restart-rebind'})));
        } else assert.equal(row.restartBoundary, null);
        for (const receipt of row.root.receipts as any[]) {
            assert.deepEqual(Object.keys(receipt).sort(), ['invoked','ordinal','owner','schema']);
            assert.equal(receipt.schema, 'r032-root-v1'); assert.equal(receipt.ordinal, 1);
        }
        assert.deepEqual(Object.keys(row.sinks).sort(), [...SINK_IDS].sort());
        for(const sinkId of SINK_IDS)assert.deepEqual(Object.keys(row.sinks[sinkId]).sort(),['detections','value']);
        const requests:any[]=JSON.parse(row.sinks.S0_request.value);
        assert.deepEqual(requests,expectedRequestProjection(row.candidate,row.caseId,enqueue.allow));
        assert.notEqual(row.sinks.S1_authority_envelope_projection.value, row.sinks.S2_sqlite_authority_rows.value, 'envelope and DB projections must be distinct');
        const envelopeProjection:any[]=JSON.parse(row.sinks.S1_authority_envelope_projection.value);
        assert(Array.isArray(envelopeProjection));
        for(const envelope of envelopeProjection){assert.deepEqual(Object.keys(envelope).sort(),['authority','messageIndex']);assert.deepEqual(Object.keys(envelope.authority).sort(),['expiresAt','generation','principalLabel','replayed','revoked','scope'])}
        const sqliteProjection:any=JSON.parse(row.sinks.S2_sqlite_authority_rows.value);
        assert.deepEqual(Object.keys(sqliteProjection).sort(),['columns','rows','table']);assert.equal(sqliteProjection.table,'r032_v63_envelopes');
        assert.deepEqual(sqliteProjection.columns,['agent_id','message_idx','principal_label','scope','expires_at','revoked','replayed','generation']);assert.equal(sqliteProjection.rows.length,envelopeProjection.length);
        assert(sqliteProjection.rows.every((dbRow:any)=>dbRow.agent_id===`${row.candidate.toLowerCase()}-${row.caseId}`));
        const normalizedDb=sqliteProjection.rows.map((dbRow:any)=>({messageIndex:dbRow.message_idx,authority:{principalLabel:dbRow.principal_label,scope:dbRow.scope,generation:dbRow.generation,expiresAt:dbRow.expires_at,revoked:Boolean(dbRow.revoked),replayed:Boolean(dbRow.replayed)}}));
        assert.deepEqual(envelopeProjection,normalizedDb,'S1 envelope must normalize exactly from S2 rows');
        assert.deepEqual(envelopeProjection,expectedEnvelopeProjection(row.candidate,row.caseId,enqueue.allow),'S1/S2 exact authority state');
        const transcript:any[]=JSON.parse(row.sinks.S3_transcript_messages.value);
        assert.deepEqual(transcript,expectedTranscript(row.candidate,row.caseId,enqueue.allow));
        assert.deepEqual(JSON.parse(row.sinks.S4_safe_gate_result.value),{decisions:row.decisions,worker:row.worker,root:row.root});
        assert.deepEqual(JSON.parse(row.sinks.S6_audit_record.value),{candidate:row.candidate,caseId:row.caseId,decisions:row.decisions});
        assert.deepEqual(JSON.parse(row.sinks.S7_persisted_event_payload_projection_html_omitted.value),expectedEventProjection(transcript,expected));
        assert.deepEqual(JSON.parse(row.sinks.S8_transcript_rows_not_model_input.value),transcript);
        const exchanges:any[]=JSON.parse(row.sinks.S5_broker_ipc_serialized.value);
        const reachesBrokerEnqueue=BROKER.has(row.candidate)&&!(row.caseId==='failure-policy'||(row.candidate==='COM-03'&&row.caseId==='failure-verifier'));
        const expectedExchanges=Number(reachesBrokerEnqueue)+Number(reachesBrokerEnqueue&&enqueue.allow&&row.caseId!=='mixed-principals-coalesced');
        assert.equal(exchanges.length, expectedExchanges, `${row.candidate}/${row.caseId}: broker exchanges`);
        const expectedPhases:string[]=[];if(reachesBrokerEnqueue)expectedPhases.push('enqueue');if(reachesBrokerEnqueue&&enqueue.allow&&row.caseId!=='mixed-principals-coalesced')expectedPhases.push('use');
        assert.deepEqual(exchanges.map(exchange=>exchange.request.phase),expectedPhases);
        for(const exchange of exchanges){
            assert.deepEqual(Object.keys(exchange).sort(), exchange.rootReceipt ? ['request','requestDigest','response','responseDigest','rootReceipt','schema'] : ['request','requestDigest','response','responseDigest','schema']);
            assert.equal(exchange.schema,'r032-broker-exchange-v1'); assert.equal(exchange.request.candidate,row.candidate);assert.equal(exchange.request.caseId,row.caseId);
            assert.deepEqual(Object.keys(exchange.request).sort(),['brokerAvailable','candidate','caseId','expectedGeneration','expiresAt','generation','now','phase','principalLabel','replayed','revoked','scope']);
            assert.deepEqual(Object.keys(exchange.response).sort(),exchange.rootReceipt?['allow','reason','rootOrdinal']:['allow','reason']);
            assert.equal(exchange.requestDigest,sha(JSON.stringify(exchange.request))); assert.equal(exchange.responseDigest,sha(JSON.stringify(exchange.response)));
            if(exchange.rootReceipt){assert.deepEqual(exchange.rootReceipt,row.root.receipts[0]);assert.equal(exchange.response.rootOrdinal,exchange.rootReceipt.ordinal)}
            const phaseDecision=exchange.request.phase==='enqueue'?row.decisions.enqueue:row.decisions.use;
            assert.equal(exchange.response.allow,phaseDecision?.allow);assert.equal(exchange.response.reason,phaseDecision?.reason);
            const expectedState=expectedBrokerState(row.caseId,exchange.request.phase);
            assert.deepEqual(exchange.request,{candidate:row.candidate,caseId:row.caseId,phase:exchange.request.phase,...expectedState});
        }
        assert.equal(exchanges.filter(exchange=>exchange.rootReceipt).length,row.root.childCalls);
        for (const sink of SINK_IDS) {
            const receipt = row.sinks[sink];
            assert.equal(typeof receipt.value, 'string');
            const recomputed = detectSerializedForms(receipt.value);
            assert.deepEqual(receipt.detections.slice().sort(), recomputed, `${row.candidate}/${row.caseId}/${sink}: recompute`);
            if (sink !== 'S0_request') assert.equal(recomputed.length, 0, `${row.candidate}/${row.caseId}/${sink}: sentinel escaped`);
            else assert.deepEqual(recomputed, row.caseId === 'immediate-missing' ? [] : ['S3'], `${row.candidate}/${row.caseId}: S0 fixture`);
        }
    }
    const token:any={rows:deepFreeze(structuredClone(rows)),summary:Object.freeze({passed:true as const,rows:144 as const,matrix:'9x16' as const,validatorInput:'runtime-rows-only' as const})};
    deepFreeze(token);validatedRuns.add(token);return token as ValidatedRuntimeRun;
}

function expectedBrokerState(caseId:CaseId,phase:'enqueue'|'use') {
    let principalLabel:'present'|'missing'='present',scope:string|null='privileged',generation=2,expectedGeneration=2,expiresAt=200,revoked=false,replayed=false;
    if(phase==='enqueue'){if(caseId==='immediate-missing'){principalLabel='missing';scope=null}else if(caseId==='immediate-insufficient')scope='ordinary'}
    else {if(caseId==='use-missing'||caseId==='restart-missing'){principalLabel='missing';scope=null}if(caseId==='use-reduced')scope='ordinary';if(caseId==='use-expired')expiresAt=99;if(caseId==='use-revoked')revoked=true;if(caseId==='use-replay')replayed=true;if(caseId==='failure-stale'||caseId==='restart-stale')generation=1;if(caseId==='restart-recovery'){generation=3;expectedGeneration=3}}
    return {principalLabel,scope,generation,expectedGeneration,expiresAt,now:100,revoked,replayed,brokerAvailable:caseId!=='failure-broker'};
}

function expectedEnvelopeProjection(candidate:CandidateId,caseId:CaseId,enqueueAllowed:boolean) {
    if(!enqueueAllowed||caseId==='use-missing'||caseId==='restart-missing')return [];
    let principalLabel='present',scope:string|null='privileged',generation=2,expiresAt=200,revoked=false,replayed=false;
    if(!controlled(candidate)&&caseId==='immediate-missing'){principalLabel='missing';scope=null}if(!controlled(candidate)&&caseId==='immediate-insufficient')scope='ordinary';
    if(caseId==='use-reduced')scope='ordinary';if(caseId==='use-expired')expiresAt=99;if(caseId==='use-revoked')revoked=true;if(caseId==='use-replay')replayed=true;
    if(caseId==='failure-stale'||caseId==='restart-stale')generation=1;if(caseId==='restart-recovery')generation=3;
    const count=caseId==='mixed-principals-coalesced'?2:1;
    return Array.from({length:count},(_,messageIndex)=>({messageIndex,authority:{principalLabel,scope,generation,expiresAt,revoked,replayed}}));
}

function expectedRequestProjection(candidate:CandidateId,caseId:CaseId,enqueueAllowed:boolean) {
    const count=enqueueAllowed&&caseId==='mixed-principals-coalesced'?2:1;
    return Array.from({length:count},(_,index)=>{
        const principal=`principal-${index===0?'a':'b'}`;let principalLabel:'present'|'missing'='present',scope:string|null='privileged';
        if(caseId==='immediate-missing')principalLabel='missing';else if(caseId==='immediate-insufficient')scope='ordinary';
        const body=`safe:${candidate}:${caseId}:${principal}`;
        return {schema:'r032-request-v1',method:'POST',path:`/agent/${candidate.toLowerCase()}-${caseId}`,authorization:principalLabel==='present'?sentinelForms().find(form=>form.id==='S3')!.values[0]:null,principalLabel,scope,bodyLabel:'safe-nonsentinel',bodyDigest:sha(body)};
    });
}

function expectedTranscript(candidate:CandidateId,caseId:CaseId,enqueueAllowed:boolean) {
    if(!enqueueAllowed)return [];
    const count=caseId==='mixed-principals-coalesced'?2:1;
    return Array.from({length:count},(_,index)=>({role:'user',content:`safe:${candidate}:${caseId}:principal-${index===0?'a':'b'}`}));
}

function expectedEventProjection(transcript:Array<{role:string;content:string}>,expected:{allow:boolean;reason:string}|null) {
    const projected:any[]=transcript.map((message,index)=>({type:'user',text:message.content,messageIdx:index,htmlOmitted:true}));
    if(expected&&!expected.allow)projected.push({type:'error',errorCode:`R032_V63_DENY:${expected.reason}`,eventHtmlOmitted:true});
    return projected;
}
