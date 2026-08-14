import { describe, expect, test } from 'bun:test';
import runtimePathInstructions from './runtimePathInstructions.entry';

describe('runtimePathInstructions', () => {
    test('separates workspace-relative work from absolute runtime roots', () => {
        const text = runtimePathInstructions({
            workspace: '/work/project',
            roots: [
                { name: 'src', dir: '/opt/hcode/src' },
                { name: '.hyper', dir: '/opt/hcode/.hyper' },
            ],
        });

        expect(text).toContain('Selected workspace and process cwd: /work/project');
        expect(text).toContain('src: /opt/hcode/src');
        expect(text).toContain('.hyper: /opt/hcode/.hyper');
        expect(text).toContain('/opt/hcode/CLAUDE.md');
        expect(text).toContain('does not load files from the selected workspace, including its .hyper/ directory');
    });
});
