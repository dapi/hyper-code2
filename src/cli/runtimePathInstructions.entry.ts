import { dirname } from 'node:path';

type RuntimeRoot = { name: string; dir: string };

// The shipped core prompt describes the HyperCode runtime using relative
// paths. In CLI mode cwd is deliberately the user's workspace, while the
// runtime remains installed elsewhere. Make that boundary explicit for every
// terminal agent so workspace edits are never mistaken for hot-reloadable core
// source edits.
export default function runtimePathInstructions(opts: {
    workspace: string;
    roots: RuntimeRoot[];
}): string {
    const sourceRoot = opts.roots.find((root) => root.name === 'src')?.dir;
    const installationRoot = sourceRoot ? dirname(sourceRoot) : null;
    const roots = opts.roots
        .map((root) => `  - ${root.name}: ${root.dir}`)
        .join('\n') || '  - unavailable';
    const runtimeDocs = installationRoot
        ? `${installationRoot}/CLAUDE.md and ${installationRoot}/docs/architecture.md`
        : 'the installed runtime documentation';

    return [
        '## CLI workspace and runtime paths (auto-injected)',
        `- Selected workspace and process cwd: ${opts.workspace}`,
        '- Relative paths used by §bash and ctx.fns.files.* target that selected workspace.',
        '- Installed HyperCode runtime roots (these are distinct from the workspace):',
        roots,
        `- The core prompt references src/..., .hyper/..., CLAUDE.md, and docs/architecture.md. In this CLI session those references mean the installed runtime only; use absolute paths under ${installationRoot ?? 'the roots above'} (for example ${runtimeDocs}).`,
        '- ctx.fns.repl.load only reloads the installed runtime roots listed above. It does not load files from the selected workspace, including its .hyper/ directory.',
        '- Do not describe or treat workspace files as runtime source or hot-reload extensions. Edit and inspect workspace files according to the user task; inspect runtime files only when the task is about HyperCode itself.',
    ].join('\n');
}
