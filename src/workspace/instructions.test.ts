import { afterAll, describe, expect, test } from 'bun:test';
import { mkdir, realpath, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import instructions from './instructions';

const base = join(tmpdir(), `hyper-code2-instructions-${process.pid}-${Date.now()}`);
afterAll(async () => {
    await rm(base, { recursive: true, force: true });
    await rm(`${base}-plain`, { recursive: true, force: true });
});

describe('workspace.instructions', () => {
    test('loads AGENTS.md from Git root to selected workspace', async () => {
        const nested = join(base, 'a', 'b');
        await mkdir(nested, { recursive: true });
        Bun.spawnSync(['git', 'init', '-q', base]);
        await writeFile(join(base, 'AGENTS.md'), 'root rule');
        await writeFile(join(base, 'a', 'AGENTS.md'), 'near rule');
        const result = await instructions({} as any, { workspace: nested });
        const canonicalBase = await realpath(base);
        expect(result.paths).toEqual([join(canonicalBase, 'AGENTS.md'), join(canonicalBase, 'a', 'AGENTS.md')]);
        expect(result.text.indexOf('root rule')).toBeLessThan(result.text.indexOf('near rule'));
    });

    test('uses only the selected directory outside Git', async () => {
        const plain = `${base}-plain`;
        await mkdir(plain, { recursive: true });
        await writeFile(join(plain, 'AGENTS.md'), 'local rule');
        const result = await instructions({} as any, { workspace: plain });
        expect(result.paths).toEqual([join(await realpath(plain), 'AGENTS.md')]);
    });

    test('forces Git diagnostics to the C locale before matching non-repository output', async () => {
        const plain = `${base}-plain`;
        const originalSpawnSync = Bun.spawnSync;
        let options: any;
        (Bun as any).spawnSync = (_cmd: string[], received: any) => {
            options = received;
            return {
                exitCode: 128,
                stdout: Buffer.from(''),
                stderr: Buffer.from('fatal: not a git repository (or any of the parent directories): .git'),
            };
        };
        try {
            await expect(instructions({} as any, { workspace: plain })).resolves.toBeDefined();
            expect(options.env.LC_ALL).toBe('C');
        } finally {
            (Bun as any).spawnSync = originalSpawnSync;
        }
    });

    test('fails rather than dropping instruction discovery when Git cannot run', async () => {
        const plain = `${base}-plain`;
        await mkdir(plain, { recursive: true });
        const originalSpawnSync = Bun.spawnSync;
        (Bun as any).spawnSync = () => { throw new Error('Executable not found in $PATH: "git"'); };
        try {
            await expect(instructions({} as any, { workspace: plain }))
                .rejects.toThrow('cannot discover Git root');
        } finally {
            (Bun as any).spawnSync = originalSpawnSync;
        }
    });

    test('preserves a non-repository Git diagnostic', async () => {
        const plain = `${base}-plain`;
        const originalSpawnSync = Bun.spawnSync;
        (Bun as any).spawnSync = () => ({
            exitCode: 128,
            stdout: Buffer.from(''),
            stderr: Buffer.from('fatal: detected dubious ownership in repository'),
        });
        try {
            await expect(instructions({} as any, { workspace: plain }))
                .rejects.toThrow('fatal: detected dubious ownership in repository');
        } finally {
            (Bun as any).spawnSync = originalSpawnSync;
        }
    });
});
