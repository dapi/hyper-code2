import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { sentinelForms, detectSentinel } from '../r018-sentinel-lib';

export const HEAD = 'c02b9ece0a1404d84428a2dce0a91599f954e83e';
export const SENTINEL = "R018-NONSECRET-e\u0301:'%/+/\u{10FFFF}";
export const IDS = ['CAN-01','CAN-02','CAN-03','CAN-04','CAN-05','CAN-06','COM-01','COM-02','COM-03'] as const;
export const BROKER_IDS = new Set(['CAN-06', 'COM-03']);
export const SINKS = ['authority-envelope','sqlite-authority','transcript-message','safe-gate-result','broker-ipc','audit','rendered-event','transcript-row-not-model-input'] as const;

export class CallableRootSpy {
    calls = 0;
    invoke() { this.calls++; return { invoked: true, ordinal: this.calls }; }
}

export type ParentAdapter = { id: typeof IDS[number]; root?: CallableRootSpy };
export function parentAdapter(id: typeof IDS[number]): ParentAdapter {
    return BROKER_IDS.has(id) ? { id } : { id, root: new CallableRootSpy() };
}

export function invokeParentRoot(adapter: ParentAdapter, allow: boolean) {
    if (!allow) return { calls: adapter.root?.calls ?? 0, invoked: false };
    assert(adapter.root, `${adapter.id}: parent root is absent by contract`);
    const receipt = adapter.root.invoke();
    return { calls: adapter.root.calls, invoked: receipt.invoked };
}

export function invokeChildOnlyRoot(id: 'CAN-06' | 'COM-03', allow: boolean, childRoot: CallableRootSpy) {
    assert(BROKER_IDS.has(id));
    return allow ? childRoot.invoke() : { invoked: false, ordinal: childRoot.calls };
}

export class GenerationStore {
    constructor(readonly instance: string, readonly generation: number) {}
    use(boundGeneration: number | null) {
        return boundGeneration === this.generation
            ? { allow: true, reason: 'generation-current', store: this.instance }
            : { allow: false, reason: boundGeneration == null ? 'generation-missing' : 'generation-stale', store: this.instance };
    }
    restart(nextInstance: string) { return new GenerationStore(nextInstance, this.generation + 1); }
}

export function restartRecovery() {
    const beforeStore = new GenerationStore('process-before', 1);
    const bound = beforeStore.generation;
    const before = beforeStore.use(bound);
    const afterStore = beforeStore.restart('process-after');
    const stale = afterStore.use(bound);
    const rebound = afterStore.generation;
    const recovered = afterStore.use(rebound);
    return { before, stale, recovered, beforeGeneration: bound, afterGeneration: rebound,
        distinctBoundary: beforeStore !== afterStore && beforeStore.instance !== afterStore.instance };
}

const sinkAdapters = Object.fromEntries(SINKS.map((sink) => [sink, (safe: unknown) => typeof safe === 'string' ? safe : JSON.stringify({ sink, safe })])) as Record<typeof SINKS[number], (safe: unknown) => string>;

export function detectorReceipts() {
    const positives = sentinelForms(SENTINEL).flatMap((form) => form.values.flatMap((value) => SINKS.map((sink) => {
        const projected = sinkAdapters[sink](value);
        const hits = detectSentinel(projected, [form]);
        return { form: form.id, sink, expected: true, detected: hits.length > 0, valueDigest: sha(value) };
    })));
    const safeCandidate = Object.fromEntries(SINKS.map((sink) => [sink, sinkAdapters[sink]({ credentialDigest: sha(SENTINEL) })]));
    const negative = SINKS.map((sink) => ({ sink, detectedForms: detectSentinel(safeCandidate[sink], sentinelForms(SENTINEL)).map((hit) => hit.formId) }));
    return { positives, negative, rawStableValueIncluded: false };
}

export function assertSemanticResults(input: { roots: Array<{ id: string; allow: boolean; parentCalls: number; childCalls: number }>; restart: ReturnType<typeof restartRecovery>; controls: ReturnType<typeof detectorReceipts> }) {
    assert.equal(input.roots.length, IDS.length * 2);
    for (const row of input.roots) {
        const broker = BROKER_IDS.has(row.id);
        assert.equal(row.parentCalls, broker ? 0 : Number(row.allow), `${row.id}: parent root`);
        assert.equal(row.childCalls, broker ? Number(row.allow) : 0, `${row.id}: child root`);
    }
    assert(input.restart.distinctBoundary);
    assert.equal(input.restart.before.allow, true);
    assert.equal(input.restart.stale.allow, false);
    assert.equal(input.restart.recovered.allow, true);
    assert.notEqual(input.restart.before.store, input.restart.recovered.store);
    assert(input.controls.positives.every((row) => row.detected));
    assert(input.controls.negative.every((row) => row.detectedForms.length === 0));
    assert.equal(input.controls.rawStableValueIncluded, false);
    return { passed: true, assertions: 'shared-author-and-collection-suite' };
}

export function semanticFixture() {
    const roots = IDS.flatMap((id) => [false, true].map((allow) => {
        const parent = parentAdapter(id);
        const child = new CallableRootSpy();
        if (BROKER_IDS.has(id)) invokeChildOnlyRoot(id as 'CAN-06'|'COM-03', allow, child);
        else invokeParentRoot(parent, allow);
        return { id, allow, parentCalls: parent.root?.calls ?? 0, childCalls: child.calls };
    }));
    return { roots, restart: restartRecovery(), controls: detectorReceipts() };
}

function sha(value: string) { return createHash('sha256').update(value).digest('hex'); }
