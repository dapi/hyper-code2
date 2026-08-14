import { describe, expect, test } from 'bun:test';
import { workspaceSessionDbPath } from './workspaceDbPath.entry';

describe('workspaceSessionDbPath', () => {
    test('always selects state below the canonical workspace', () => {
        expect(workspaceSessionDbPath('/tmp/project')).toBe('/tmp/project/.hyper/_runtime/sessions');
    });
});
