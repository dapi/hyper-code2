import { access, readFile, realpath } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';

export type WorkspaceInstructions = { paths: string[]; text: string };

export default async function (
    _ctx: Context,
    opts: { workspace: string },
): Promise<WorkspaceInstructions> {
    const workspace = await realpath(resolve(opts.workspace));
    const root = (await gitRoot(workspace)) ?? workspace;
    const rel = relative(root, workspace);
    if (rel.startsWith(`..${sep}`) || rel === '..') {
        throw new Error(`workspace is outside Git root: ${workspace}`);
    }

    const directories = [root];
    if (rel) {
        let current = root;
        for (const part of rel.split(sep)) {
            current = join(current, part);
            directories.push(current);
        }
    }

    const paths: string[] = [];
    for (const directory of directories) {
        const candidate = join(directory, 'AGENTS.md');
        try {
            await access(candidate);
            paths.push(candidate);
        } catch {}
    }

    const sections: string[] = [];
    for (const path of paths) {
        let body: string;
        try {
            body = await readFile(path, 'utf8');
        } catch (error: any) {
            throw new Error(`cannot read instructions ${path}: ${error?.message ?? error}`);
        }
        sections.push(`## Instructions from ${path}\n\n${body.trim()}`);
    }
    return { paths, text: sections.join('\n\n') };
}

async function gitRoot(workspace: string): Promise<string | null> {
    let result: ReturnType<typeof Bun.spawnSync>;
    try {
        result = Bun.spawnSync(['git', '-C', workspace, 'rev-parse', '--show-toplevel'], {
            stdout: 'pipe',
            stderr: 'pipe',
        });
    } catch (error: any) {
        throw new Error(`cannot discover Git root for ${workspace}: ${error?.message ?? error}`);
    }
    const stderr = result.stderr?.toString().trim() ?? '';
    if (result.exitCode !== 0) {
        // `rev-parse` uses this precise diagnostic for the one case where an
        // instruction search may safely fall back to the selected directory.
        // Other failures (for example dubious ownership) must not silently
        // drop root-to-workspace AGENTS.md files.
        if (result.exitCode === 128 && /not a git repository \(or any of the parent directories\)/i.test(stderr)) {
            return null;
        }
        throw new Error(`cannot discover Git root for ${workspace}: ${stderr || `git exited with status ${result.exitCode}`}`);
    }
    const value = result.stdout?.toString().trim() ?? '';
    return value ? resolve(value) : null;
}
