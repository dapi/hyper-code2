import parseArgs, { CliUsageError } from '../src/cli/parseArgs.entry';
import runTerminal from '../src/cli/runTerminal.entry';
import { workspaceSessionDbPath } from '../src/cli/workspaceDbPath.entry';
import resolveWorkspace from '../src/runtime/resolveWorkspace.entry';
import startRuntime from '../src/runtime/start.entry';

export default async function main(argv: string[]): Promise<number> {
    try {
        const command = parseArgs(argv);
        if (command.kind === 'help') {
            console.log(helpText());
            return 0;
        }
        if (command.kind === 'version') {
            const pkg = await Bun.file(new URL('../package.json', import.meta.url)).json();
            console.log(pkg.version ?? '0.0.0-dev');
            return 0;
        }

        const workspace = await resolveWorkspace(command.workspace);
        // The CLI's durable state is always scoped to the selected workspace.
        // `src/$main.ts` intentionally remains the only entrypoint that can
        // inherit DB_PATH for compatibility with the existing browser server.
        const dbPath = workspaceSessionDbPath(workspace);
        if (command.kind === 'serve') {
            console.log('TRUSTED MODE — unrestricted agent execution');
            console.log('Concurrent hcode processes for the same workspace are unsupported in this preview.');
            const runtime = await startRuntime({
                workspace,
                dbPath,
                http: true,
                env: command.port ? { PORT: String(command.port) } : {},
            });
            try {
                await waitForExitSignal();
            } finally {
                await runtime.shutdown();
            }
            return 0;
        }

        const runtime = await startRuntime({ workspace, dbPath, http: false, quiet: true });
        try {
            const loaded = await runtime.ctx.fns.workspace.instructions(runtime.ctx, { workspace });
            const model = command.model ?? runtime.ctx.fns.settings.modelDefault(runtime.ctx);
            const prompt = [
                'You are running in TRUSTED MODE with unrestricted local agent execution.',
                `Selected workspace: ${workspace}`,
                loaded.text,
            ].filter(Boolean).join('\n\n');
            const agent = runtime.ctx.fns.agent.start(runtime.ctx, { model, systemPrompt: prompt });
            await runTerminal({ ctx: runtime.ctx, agent, workspace, initialPrompt: command.prompt });
        } finally {
            await runtime.shutdown();
        }
        return 0;
    } catch (error: any) {
        console.error(`hcode: ${error?.message ?? error}`);
        if (error instanceof CliUsageError) console.error('Run `hcode --help` for usage.');
        return error?.exitCode ?? 1;
    }
}

function waitForExitSignal(): Promise<void> {
    return new Promise((resolve) => {
        process.once('SIGINT', resolve);
        process.once('SIGTERM', resolve);
    });
}

function helpText() {
    return `Usage:
  hcode [-C <directory>] [-m <model>] [prompt]
  hcode serve [-C <directory>] [--port <port>]

Commands:
  (default)  Start the line-oriented terminal client without HTTP
  serve      Start the existing browser server explicitly

Options:
  -C, --cwd <directory>  Select and canonicalize the workspace
  -m, --model <model>    Override the configured terminal model
  --port <port>          Browser server port (serve only)
  -h, --help             Show this help
  --version              Show the package version`;
}
