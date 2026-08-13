import assert from 'node:assert/strict';
import { CASES, CANDIDATES, COMMITTED_ENTRIES, SOURCE_PATHS, selfTest } from './collector';

assert.equal(COMMITTED_ENTRIES.length, 37);
assert.equal(new Set(COMMITTED_ENTRIES).size, 37);
assert.equal(new Set(SOURCE_PATHS).size, SOURCE_PATHS.length);
assert.equal(CANDIDATES.length, 9);
assert(CASES.includes('mixed-principals-coalesced'));
assert(CASES.includes('restart-recovery'));

const log = console.log;
console.log = () => {};
let result;
try { result = await selfTest(); } finally { console.log = log; }
log(JSON.stringify({ status: 'author-self-test-only', ...result }));
