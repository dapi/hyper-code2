import { describe, expect, test } from 'bun:test';

import { CANDIDATES, CELLS, executeCell } from './r033-executable-adapters';

describe('R-033 executable disposable adapters', () => {
    test('executes a symmetric 70-cell matrix', () => {
        const results = CANDIDATES.flatMap(candidate => CELLS.map(cell => executeCell(candidate, cell)));
        expect(results).toHaveLength(70);
        for (const candidate of CANDIDATES) {
            expect(results.filter(result => result.candidate === candidate)).toHaveLength(14);
        }
    });

    test('transport placement matches independently frozen digests', () => {
        const bearer = executeCell('CAND-01', 'CC-03');
        const xApiKey = executeCell('CAND-01', 'CC-04');
        expect(bearer.transport?.authDigest).toBe('d3177e877ed48485413a652e3b1df8358c3a9828744821898aebe6ab76f32be1');
        expect(xApiKey.transport?.authDigest).toBe('c294132494666cd199ee9c99464ae2ee3c22e2f944238b3f4034ce12254b2e14');
    });

    test('every injected leak is detected as an executed failure', () => {
        for (const candidate of CANDIDATES) {
            for (const cell of CELLS) {
                const result = executeCell(candidate, cell, true);
                expect(result.status).toBe('fail');
                expect(result.reasons).toContain('PROHIBITED_SINK_HIT');
            }
        }
    });

    test('fail-closed cells derive their errors before dispatch', () => {
        for (const candidate of ['CAND-01', 'CAND-02', 'CAND-03', 'CAND-05'] as const) {
            expect(executeCell(candidate, 'CC-07')).toMatchObject({ status: 'pass', dispatchCount: 0, stableErrorCode: 'CREDENTIAL_REFERENCE_INVALID' });
            expect(executeCell(candidate, 'CC-08')).toMatchObject({ status: 'pass', dispatchCount: 0, stableErrorCode: 'CREDENTIAL_RESOLVER_UNAVAILABLE' });
            expect(executeCell(candidate, 'CC-09')).toMatchObject({ status: 'pass', dispatchCount: 0, stableErrorCode: 'SECRET_CLASSIFICATION_LOST' });
        }
    });
});
