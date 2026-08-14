import { afterAll, describe, expect, test } from 'bun:test';
import { mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import resolveWorkspace from './resolveWorkspace.entry';

const base = join(process.cwd(), '.test-tmp', `workspace-${process.pid}-${Date.now()}`);
afterAll(() => rm(base, { recursive: true, force: true }));

describe('resolveWorkspace', () => {
    test('returns the canonical directory path', async () => {
        const target = join(base, 'target');
        const link = join(base, 'link');
        await mkdir(target, { recursive: true });
        await symlink(target, link);
        expect(await resolveWorkspace(link)).toBe(target);
    });

    test('rejects missing paths and files', async () => {
        await expect(resolveWorkspace(join(base, 'missing'))).rejects.toThrow('does not exist');
        const file = join(base, 'file');
        await writeFile(file, 'x');
        await expect(resolveWorkspace(file)).rejects.toThrow('not a directory');
    });
});
