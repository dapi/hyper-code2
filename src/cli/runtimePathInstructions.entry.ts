import { dirname, resolve } from 'node:path';

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
    // project.roots omits a missing .hyper directory. Startup can create that
    // directory later for its database, at which point it becomes a reloadable
    // overlay, so describe it even during a fresh-install bootstrap.
    const runtimeRoots = installationRoot && !opts.roots.some((root) => root.name === '.hyper')
        ? [...opts.roots, { name: '.hyper', dir: resolve(installationRoot, '.hyper') }]
        : opts.roots;
    const roots = runtimeRoots
        .map((root) => `  - ${root.name}: ${root.dir}`)
        .join('\n') || '  - unavailable';
    const runtimeDocs = installationRoot
        ? `${installationRoot}/CLAUDE.md and ${installationRoot}/docs/architecture.md`
        : 'the installed runtime documentation';
    const workspaceIsInstallation = installationRoot !== null
        && resolve(opts.workspace) === resolve(installationRoot);

    const boundaryInstructions = workspaceIsInstallation
        ? [
            '- The selected workspace is the HyperCode installation. Relative paths used by §bash and ctx.fns.files.* therefore address that runtime checkout.',
            '- Here src/... is shipped runtime source, and .hyper/... is the installed hot-reloadable overlay once it exists. ctx.fns.repl.load can reload files from both roots.',
            '- Treat files outside src/ and .hyper/ as ordinary workspace files; inspect or edit runtime files when the user task calls for a HyperCode change.',
        ]
        : [
            '- Relative paths used by §bash and ctx.fns.files.* target the selected workspace.',
            '- ctx.fns.repl.load reloads the installed runtime roots listed above. It does not load files from the selected workspace, including its .hyper/ directory.',
            '- Do not describe or treat workspace files as runtime source or hot-reload extensions. Edit and inspect workspace files according to the user task; inspect runtime files only when the task is about HyperCode itself.',
        ];

    return [
        '## CLI workspace and runtime paths (auto-injected)',
        `- Selected workspace and process cwd: ${opts.workspace}`,
        `- Installed HyperCode runtime roots${workspaceIsInstallation ? ' (these coincide with the workspace)' : ' (these are distinct from the workspace)'}:`,
        roots,
        `- The core prompt references src/..., .hyper/..., CLAUDE.md, and docs/architecture.md. In this CLI session those references mean the installed runtime only; use absolute paths under ${installationRoot ?? 'the roots above'} (for example ${runtimeDocs}).`,
        ...boundaryInstructions,
    ].join('\n');
}
