import assert from 'node:assert/strict';
import { HEAD, IDS, SINKS, assertSemanticResults, semanticFixture } from './semantic-contract';

assert.equal(HEAD, 'c4a617fce088ea5ad959e2664cab853533677ab8');
assert.equal(IDS.length, 9);
assert.equal(SINKS.length, 8);
const fixture = semanticFixture();
const result = assertSemanticResults(fixture);
console.log(JSON.stringify({ status: 'WIP-author-self-test-only', collectionAuthorized: false, ...result,
    rootRows: fixture.roots.length, detectorPositiveReceipts: fixture.controls.positives.length }));
