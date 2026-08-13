import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { buildCarrier, launchContained } from './collector-infra';
import { semanticFixture } from './semantic-contract';

const root = await mkdtemp(resolve(tmpdir(), 'r032-v62-author-'));
try {
    const paths = { root, home: resolve(root, 'home'), tmp: resolve(root, 'tmp') };
    const receipt = await launchContained(resolve(import.meta.dir, '../../..'), paths, { id: 'CAN-06', allow: true, parentHomeProbe: resolve(process.env.HOME ?? '/nonexistent', '.ssh') });
    assert.equal(receipt.receipt.rootCalls, 1);
    assert(receipt.receipt.probes.every((probe: any) => probe.denied));
    assert.deepEqual(receipt.envKeys, ['HOME','PATH','R032_V62_CHILD','TMPDIR']);
    const semantic = semanticFixture();
    const built = buildCarrier([], semantic, receipt, { authorSelfTest: true });
    assert.match(built.executionDigest, /^[a-f0-9]{64}$/);
    console.log(JSON.stringify({ status: 'WIP-infra-self-test', collectionAuthorized: false,
        probes: receipt.receipt.probes, stdoutDigest: receipt.stdoutDigest, stderrDigest: receipt.stderrDigest,
        executionDigest: built.executionDigest }));
} finally { await rm(root, { recursive: true, force: true }); }
