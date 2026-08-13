import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { resolve } from 'node:path';

const sha = (value: Uint8Array | string) => createHash('sha256').update(value).digest('hex');

export async function resolveHeadWithoutSpawn(repo: string) {
    const gitPath = await resolveGitDir(repo);
    const head = (await readFile(resolve(gitPath, 'HEAD'), 'utf8')).trim();
    if (!head.startsWith('ref: ')) return head;
    const ref = head.slice(5);
    try { return (await readFile(resolve(gitPath, ref), 'utf8')).trim(); } catch {}
    const common = await commonGitDir(gitPath);
    try { return (await readFile(resolve(common, ref), 'utf8')).trim(); } catch {}
    const packed = await readFile(resolve(common, 'packed-refs'), 'utf8');
    const row = packed.split('\n').find((line) => line.endsWith(` ${ref}`));
    assert(row, `unresolved HEAD ref ${ref}`);
    return row!.split(' ')[0]!;
}

async function commonGitDir(gitPath: string) {
    try { return realpath(resolve(gitPath, (await readFile(resolve(gitPath, 'commondir'), 'utf8')).trim())); }
    catch { return gitPath; }
}

async function resolveGitDir(repo: string) {
    const dotGit = resolve(repo, '.git');
    const stat = await Bun.file(dotGit).stat();
    if (stat.isDirectory()) return realpath(dotGit);
    const pointer = (await readFile(dotGit, 'utf8')).trim();
    assert(pointer.startsWith('gitdir: '));
    return realpath(resolve(repo, pointer.slice(8)));
}

export async function auditFrozenFiles(repo: string, expected: Record<string, string>) {
    const actual: Record<string, string> = {};
    for (const [path, digest] of Object.entries(expected)) {
        const bytes = await readFile(resolve(repo, path));
        actual[path] = sha(bytes);
        assert.equal(actual[path], digest, `frozen file drift: ${path}`);
    }
    return { method: 'direct-.git-ref-and-file-hash-no-subprocess', files: Object.keys(actual).length, actual };
}
