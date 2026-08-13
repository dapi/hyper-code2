import assert from 'node:assert/strict';
import { HEAD, IDS, SINKS, assertSemanticResults, semanticFixture } from './semantic-contract';

assert.equal(HEAD, '7828ad9bb3f1d8084598f20cfa6738a628609cc5');
assert.equal(IDS.length, 9);
assert.equal(SINKS.length, 8);
const fixture = semanticFixture();
const result = assertSemanticResults(fixture);
console.log(JSON.stringify({ status: 'WIP-author-self-test-only', collectionAuthorized: false, ...result,
    rootRows: fixture.roots.length, detectorPositiveReceipts: fixture.controls.positives.length }));
