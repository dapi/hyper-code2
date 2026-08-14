import { describe, expect, test } from 'bun:test';
import parseArgs from './parseArgs.entry';

describe('parseArgs', () => {
    test('defaults to terminal mode', () => {
        expect(parseArgs([])).toEqual({ kind: 'terminal', workspace: process.cwd() });
    });

    test('parses terminal workspace, model, and initial prompt', () => {
        expect(parseArgs(['-C', '/tmp/project', '-m', 'mock:echo', 'hello'])).toEqual({
            kind: 'terminal', workspace: '/tmp/project', model: 'mock:echo', prompt: 'hello',
        });
    });

    test('parses explicit serve mode', () => {
        expect(parseArgs(['serve', '--port', '3456', '-C', '/tmp/project'])).toEqual({
            kind: 'serve', workspace: '/tmp/project', port: 3456,
        });
    });

    test('rejects invalid combinations before startup', () => {
        expect(() => parseArgs(['--wat'])).toThrow('unknown option');
        expect(() => parseArgs(['--port', '3000'])).toThrow('requires serve');
        expect(() => parseArgs(['serve', '-m', 'x'])).toThrow('only valid');
        expect(() => parseArgs(['serve', '--port', '70000'])).toThrow('invalid port');
    });
});
