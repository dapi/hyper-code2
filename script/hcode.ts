import parseArgs, { CliUsageError } from '../src/cli/parseArgs.entry';
import runTerminal from '../src/cli/runTerminal.entry';
import runtimePathInstructions from '../src/cli/runtimePathInstructions.entry';
import { workspaceSessionDbPath } from '../src/cli/workspaceDbPath.entry';
import resolveWorkspace from '../src/runtime/resolveWorkspace.entry';
import startRuntime from '../src/runtime/start.entry';

// This exit code is consumed by hcode.entry.ts. It is intentionally distinct
// from ordinary CLI errors so only a shutdown that left uncooperative work
// alive invokes process.exit().
export const FORCED_SHUTDOWN_EXIT_CODE = 125;

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
        // The runtime loads workspace overlays and creates durable state, so
        // make its unrestricted authority explicit before either can happen.
        console.log('TRUSTED MODE — unrestricted agent execution');
        // The CLI's durable state is always scoped to the selected workspace.
        // `src/$main.ts` intentionally remains the only entrypoint that can
        // inherit DB_PATH for compatibility with the existing browser server.
        const dbPath = workspaceSessionDbPath(workspace);
        if (command.kind === 'serve') {
            console.log('Concurrent hcode processes for the same workspace are unsupported in this preview.');
            const serveExit = new AbortController();
            const onSignal = () => serveExit.abort();
            process.once('SIGINT', onSignal);
            process.once('SIGTERM', onSignal);
            let runtime: Awaited<ReturnType<typeof startRuntime>> | undefined;
            let forcedShutdown = false;
            try {
                runtime = await startRuntime({
                    workspace,
                    dbPath,
                    http: true,
                    env: command.port ? { PORT: String(command.port) } : {},
                });
                await waitForExitSignal(serveExit.signal);
            } finally {
                process.off('SIGINT', onSignal);
                process.off('SIGTERM', onSignal);
                const result = await runtime?.shutdown();
                forcedShutdown = result?.forced ?? false;
            }
            return forcedShutdown ? FORCED_SHUTDOWN_EXIT_CODE : 0;
        }

        const terminalExit = new AbortController();
        const onSigterm = () => terminalExit.abort('SIGTERM');
        process.once('SIGTERM', onSigterm);
        let runtime: Awaited<ReturnType<typeof startRuntime>> | undefined;
        let forcedShutdown = false;
        try {
            runtime = await startRuntime({ workspace, dbPath, http: false, quiet: true });
            if (!terminalExit.signal.aborted) {
                const loaded = await runtime.ctx.fns.workspace.instructions(runtime.ctx, { workspace });
                if (!terminalExit.signal.aborted) {
                    const model = command.model ?? runtime.ctx.fns.settings.modelDefault(runtime.ctx);
                    const roots = await runtime.ctx.fns.project.roots(runtime.ctx);
                    if (!terminalExit.signal.aborted) {
                        const prompt = [
                            'You are running in TRUSTED MODE with unrestricted local agent execution.',
                            runtimePathInstructions({ workspace, roots }),
                            loaded.text,
                        ].filter(Boolean).join('\n\n');
                        const agent = runtime.ctx.fns.agent.start(runtime.ctx, { model, systemPrompt: prompt });
                        await runTerminal({
                            ctx: runtime.ctx,
                            agent,
                            workspace,
                            initialPrompt: command.prompt,
                            exitSignal: terminalExit.signal,
                        });
                    }
                }
            }
        } finally {
            process.off('SIGTERM', onSigterm);
            const result = await runtime?.shutdown();
            forcedShutdown = result?.forced ?? false;
        }
        return forcedShutdown ? FORCED_SHUTDOWN_EXIT_CODE : 0;
    } catch (error: any) {
        console.error(`hcode: ${error?.message ?? error}`);
        if (error instanceof CliUsageError) console.error('Run `hcode --help` for usage.');
        return error?.exitCode ?? 1;
    }
}

function waitForExitSignal(signal: AbortSignal): Promise<void> {
    if (signal.aborted) return Promise.resolve();
    return new Promise((resolve) => signal.addEventListener('abort', () => resolve(), { once: true }));
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
