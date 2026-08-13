import { describe, expect, test } from 'bun:test';

import { CANDIDATES, CELLS, executeV3, EXPECTED_REQUEST_DIGESTS } from './r033-v3-semantics';

describe('R-033 v3 semantic adapters', () => {
    test('executes the full symmetric matrix', () => {
        const rows = CANDIDATES.flatMap(candidate => CELLS.map(cell => executeV3(candidate, cell)));
        expect(rows).toHaveLength(70);
        for (const candidate of CANDIDATES) expect(rows.filter(row => row.candidate === candidate)).toHaveLength(14);
    });

    test('matches frozen full request and auth controls', () => {
        for (const cell of ['CC-03', 'CC-04', 'CC-05', 'CC-06']) {
            const row: any = executeV3('CAND-01', cell);
            expect(row.observed.transport.requestDigest).toBe(EXPECTED_REQUEST_DIGESTS[cell]);
            expect(row.observed.transport.requestMatched).toBe(true);
            expect(row.observed.transport.authMatched).toBe(true);
        }
    });

    test('executes failure, outcome, retry and discovery semantics', () => {
        expect(executeV3('CAND-01', 'CC-07')).toMatchObject({ status: 'pass', stableError: 'CREDENTIAL_REFERENCE_INVALID', dispatches: 0 });
        expect(executeV3('CAND-01', 'CC-08')).toMatchObject({ status: 'pass', stableError: 'CREDENTIAL_RESOLVER_UNAVAILABLE', dispatches: 0 });
        expect(executeV3('CAND-01', 'CC-09')).toMatchObject({ status: 'pass', stableError: 'SECRET_CLASSIFICATION_LOST', dispatches: 0 });
        expect((executeV3('CAND-01', 'CC-10') as any).observed.serialization.value).toBe('TypeError');
        expect(executeV3('CAND-01', 'CC-11')).toMatchObject({ status: 'pass', observed: { boundedReuse: 'CREDENTIAL_USE_LIMIT', cancel: 'OPERATION_CANCELLED' } });
        expect(executeV3('CAND-01', 'CC-13')).toMatchObject({ status: 'pass', observed: { discoveryFailure: 'CREDENTIAL_RESOLVER_UNAVAILABLE' } });
    });

    test('keeps standalone provenance redaction failures observable', () => {
        const failures = CELLS.map(cell => executeV3('CAND-04', cell)).filter(row => row.status === 'fail');
        expect(failures).toHaveLength(10);
    });
});
