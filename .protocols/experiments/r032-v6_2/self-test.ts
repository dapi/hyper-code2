import assert from 'node:assert/strict';
import { HEAD, IDS, SINKS, assertSemanticResults, semanticFixture } from './semantic-contract';

assert.equal(HEAD, 'c02b9ece0a1404d84428a2dce0a91599f954e83e');
assert.equal(IDS.length, 9);
assert.equal(SINKS.length, 8);
const fixture = semanticFixture();
const result = assertSemanticResults(fixture);
console.log(JSON.stringify({ status: 'WIP-author-self-test-only', collectionAuthorized: false, ...result,
    rootRows: fixture.roots.length, detectorPositiveReceipts: fixture.controls.positives.length }));
