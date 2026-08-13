import assert from 'node:assert/strict';
import { runRuntimeMatrix, SOURCE_HEAD, COMMITTED_ENTRIES, detectorControlReceipts, validateDetectorControlReceipts, sanitizeRowsForCarrier } from './runtime';
import { validateRuntimeRows, type RuntimeRow } from './validator';
import { sentinelForms } from '../r018-sentinel-lib';

assert.equal(SOURCE_HEAD, '18ea94437390bcf822df0165f79246fab0da436e');
assert.equal(COMMITTED_ENTRIES.length, 37);
const log = console.log; console.log = () => {};
let rows: RuntimeRow[];
try { rows = await runRuntimeMatrix(); } finally { console.log = log; }
const valid = validateRuntimeRows(rows!);

function mustReject(name: string, mutate: (copy: RuntimeRow[]) => void) {
    const copy = structuredClone(rows!); mutate(copy);
    assert.throws(() => validateRuntimeRows(copy), undefined, name);
}
mustReject('empty', (copy) => copy.splice(0));
mustReject('duplicate', (copy) => { copy[1] = structuredClone(copy[0]!); });
mustReject('decision tamper', (copy) => { copy.find((r) => r.candidate === 'CAN-03' && r.caseId === 'use-expired')!.decisions.use!.allow = true; });
mustReject('cursor tamper', (copy) => { copy.find((r) => r.candidate === 'CAN-03' && r.caseId === 'immediate-sufficient')!.worker.cursorAfter = -1; });
mustReject('root tamper', (copy) => { copy.find((r) => r.candidate === 'CAN-06' && r.caseId === 'immediate-sufficient')!.root.parentCalls = 1; });
mustReject('sink tamper', (copy) => { copy[0]!.sinks.S3_transcript_messages.value += sentinelForms()[0]!.values[0]!; });
mustReject('receipt tamper', (copy) => { copy.find((r) => r.caseId === 'immediate-sufficient')!.sinks.S0_request.detections = []; });
mustReject('parent allocation tamper', (copy) => { copy.find((r) => r.candidate === 'CAN-06')!.root.parentAllocated = true; });
mustReject('transition order tamper', (copy) => { copy.find((r) => r.caseId === 'restart-recovery')!.transitions.reverse(); });
mustReject('transition value tamper', (copy) => { copy.find((r) => r.caseId === 'use-expired')!.transitions[0]!.from=201; });
mustReject('boundary tamper', (copy) => { copy.find((r) => r.caseId === 'restart-recovery')!.restartBoundary!.afterStore = 'sqlite-memory-before'; });
mustReject('broker schema tamper', (copy) => { const row=copy.find((r) => r.candidate === 'CAN-06' && r.caseId === 'immediate-sufficient')!; const exchanges=JSON.parse(row.sinks.S5_broker_ipc_serialized.value); exchanges[0].extra=true; row.sinks.S5_broker_ipc_serialized.value=JSON.stringify(exchanges); });
mustReject('broker digest tamper', (copy) => { const row=copy.find((r) => r.candidate === 'CAN-06' && r.caseId === 'immediate-sufficient')!; const exchanges=JSON.parse(row.sinks.S5_broker_ipc_serialized.value); exchanges[0].requestDigest='0'.repeat(64); row.sinks.S5_broker_ipc_serialized.value=JSON.stringify(exchanges); });
mustReject('broker coordinated state forgery', (copy) => { const row=copy.find((r) => r.candidate === 'CAN-06' && r.caseId === 'use-expired')!; const exchanges=JSON.parse(row.sinks.S5_broker_ipc_serialized.value); exchanges[1].request.expiresAt=200; exchanges[1].requestDigest=new Bun.CryptoHasher('sha256').update(JSON.stringify(exchanges[1].request)).digest('hex'); row.sinks.S5_broker_ipc_serialized.value=JSON.stringify(exchanges); row.sinks.S5_broker_ipc_serialized.detections=[]; });
mustReject('root receipt extras tamper', (copy) => { (copy.find((r) => r.candidate === 'CAN-06' && r.caseId === 'immediate-sufficient')!.root.receipts[0] as any).extra=true; });
mustReject('inventory path tamper', (copy) => { copy[0]!.inventory.entries[0]!.path='src/not-real.ts'; });
mustReject('inventory hash tamper', (copy) => { copy[0]!.inventory.entries[0]!.sha256='0'.repeat(64); });
mustReject('response error tamper', (copy) => { copy.find((r) => r.candidate === 'CAN-03'&&r.caseId==='immediate-missing')!.responses[0]!.errorCode='wrong'; });
mustReject('response status tamper', (copy) => { copy.find((r) => r.caseId==='immediate-sufficient')!.responses[0]!.status=201; });
mustReject('sink vocabulary tamper', (copy) => { delete (copy[0]!.sinks as any).S7_persisted_event_payload_projection_html_omitted; });
mustReject('projection alias tamper', (copy) => { copy[0]!.sinks.S2_sqlite_authority_rows.value=copy[0]!.sinks.S1_authority_envelope_projection.value; });
mustReject('envelope schema tamper', (copy) => { const row=copy.find((r)=>r.worker.envelopeCount>0)!;const value=JSON.parse(row.sinks.S1_authority_envelope_projection.value);value[0].extra=true;row.sinks.S1_authority_envelope_projection.value=JSON.stringify(value); });
mustReject('DB schema tamper', (copy) => { const row=copy[0]!;const value=JSON.parse(row.sinks.S2_sqlite_authority_rows.value);value.table='wrong';row.sinks.S2_sqlite_authority_rows.value=JSON.stringify(value); });
mustReject('S1 S2 coordinated divergence', (copy) => { const row=copy.find((r)=>r.worker.envelopeCount>0)!;const a=JSON.parse(row.sinks.S1_authority_envelope_projection.value);const b=JSON.parse(row.sinks.S2_sqlite_authority_rows.value);a[0].authority.scope='forged';b.rows[0].scope='forged';row.sinks.S1_authority_envelope_projection.value=JSON.stringify(a);row.sinks.S2_sqlite_authority_rows.value=JSON.stringify(b); });
mustReject('S0 schema tamper', (copy) => { const row=copy[0]!;const value=JSON.parse(row.sinks.S0_request.value);value[0].extra=true;row.sinks.S0_request.value=JSON.stringify(value); });
mustReject('S0 principal scope tamper', (copy) => { const row=copy.find((r)=>r.caseId==='immediate-sufficient')!;const value=JSON.parse(row.sinks.S0_request.value);value[0].scope='ordinary';row.sinks.S0_request.value=JSON.stringify(value); });
mustReject('S0 header tamper', (copy) => { const row=copy.find((r)=>r.caseId==='immediate-sufficient')!;const value=JSON.parse(row.sinks.S0_request.value);value[0].authorization=null;row.sinks.S0_request.value=JSON.stringify(value);row.sinks.S0_request.detections=[]; });
mustReject('S0 body binding tamper', (copy) => { const row=copy.find((r)=>r.caseId==='immediate-sufficient')!;const value=JSON.parse(row.sinks.S0_request.value);value[0].bodyDigest='0'.repeat(64);row.sinks.S0_request.value=JSON.stringify(value); });
mustReject('S3 transcript tamper', (copy) => { const row=copy.find((r)=>r.worker.reached)!;const value=JSON.parse(row.sinks.S3_transcript_messages.value);value[0].content='safe:forged';row.sinks.S3_transcript_messages.value=JSON.stringify(value); });
mustReject('S4 result tamper', (copy) => { const row=copy[0]!;const value=JSON.parse(row.sinks.S4_safe_gate_result.value);value.worker.cursorBefore=9;row.sinks.S4_safe_gate_result.value=JSON.stringify(value); });
mustReject('S6 audit tamper', (copy) => { const row=copy[0]!;const value=JSON.parse(row.sinks.S6_audit_record.value);value.caseId='forged';row.sinks.S6_audit_record.value=JSON.stringify(value); });
mustReject('S7 event tamper', (copy) => { const row=copy.find((r)=>r.worker.reached)!;const value=JSON.parse(row.sinks.S7_persisted_event_payload_projection_html_omitted.value);value[0].type='forged';row.sinks.S7_persisted_event_payload_projection_html_omitted.value=JSON.stringify(value); });
mustReject('S8 projection tamper', (copy) => { const row=copy.find((r)=>r.worker.reached)!;const value=JSON.parse(row.sinks.S8_transcript_rows_not_model_input.value);value[0].role='assistant';row.sinks.S8_transcript_rows_not_model_input.value=JSON.stringify(value); });
mustReject('RuntimeRow extra key', (copy) => { (copy[0] as any).extra=true; });
mustReject('sink receipt extra key', (copy) => { (copy[0]!.sinks.S6_audit_record as any).extra=true; });
mustReject('S7 omitted-html contract tamper', (copy) => { const row=copy.find((r)=>r.worker.reached)!;const value=JSON.parse(row.sinks.S7_persisted_event_payload_projection_html_omitted.value);value[0].htmlOmitted=false;row.sinks.S7_persisted_event_payload_projection_html_omitted.value=JSON.stringify(value); });
const controls=detectorControlReceipts(); assert.equal(validateDetectorControlReceipts(controls),true);
const badControls=structuredClone(controls);badControls.positives[0]!.detected=false;assert.throws(()=>validateDetectorControlReceipts(badControls));
const duplicateControls=structuredClone(controls);duplicateControls.positives[1]=structuredClone(duplicateControls.positives[0]!);assert.throws(()=>validateDetectorControlReceipts(duplicateControls));
assert.throws(()=>sanitizeRowsForCarrier(rows! as any),undefined,'unvalidated rows rejected');
assert.throws(()=>sanitizeRowsForCarrier({rows:valid.rows,summary:valid.summary} as any),undefined,'forged token rejected');
const sanitized=sanitizeRowsForCarrier(valid); assert.equal(Object.hasOwn(sanitized.rows[0]!.sinks,'S0_request'),false); assert.match(sanitized.sha256,/^[a-f0-9]{64}$/);
rows![0]!.registrationCount=0;assert.equal(valid.rows[0]!.registrationCount,37,'validated token snapshots rows');rows![0]!.registrationCount=37;
for(const form of sentinelForms())for(const value of form.values){const rawBeyondS0=structuredClone(rows!);rawBeyondS0[0]!.sinks.S6_audit_record.value+=value;assert.throws(()=>validateRuntimeRows(rawBeyondS0),undefined,`carrier ${form.id}`)}

log(JSON.stringify({ status: 'runtime-author-self-test-only', collectionAuthorized: false, ...valid.summary, tamperNegatives: 42, carrierFormNegatives:9, detectorPositiveReceipts:controls.positives.length, sanitizedBytes:sanitized.stableBytes.length }));
