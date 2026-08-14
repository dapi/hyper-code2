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

    test('identifies an installation workspace and its prospective overlay', () => {
        const text = runtimePathInstructions({
            workspace: '/opt/hcode',
            // A fresh installation has no .hyper yet; startup creates it after
            // this prompt context is configured.
            roots: [{ name: 'src', dir: '/opt/hcode/src' }],
        });

        expect(text).toContain('Installed HyperCode runtime roots (these coincide with the workspace):');
        expect(text).toContain('.hyper: /opt/hcode/.hyper');
        expect(text).toContain('src/... is shipped runtime source');
        expect(text).toContain('.hyper/... is the installed hot-reloadable overlay once it exists');
        expect(text).toContain('ctx.fns.repl.load can reload files from both roots');
        expect(text).not.toContain('does not load files from the selected workspace');
    });
});
