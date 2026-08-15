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

export type MainDependencies = {
    startRuntime?: typeof startRuntime;
    runTerminal?: typeof runTerminal;
    runTui?: (opts: {
        ctx: Context;
        agent: types.agent.Agent;
        workspace: string;
        initialPrompt?: string;
        exitSignal?: AbortSignal;
    }) => Promise<void>;
    isInteractiveTty?: () => boolean;
    supportsKittyKeyboard?: () => boolean;
};

// Ctrl+Enter is the TUI's only submit binding, so a TTY alone is not enough:
// terminals that cannot report modified Enter would leave the operator with no
// way to submit. Keep this conservative; a false negative retains the fully
// functional line adapter, while a false positive makes the TUI unusable.
export function supportsKittyKeyboard(
    env: Record<string, string | undefined> = process.env,
): boolean {
    const term = env.TERM?.toLowerCase();
    // Multiplexers do not reliably forward the protocol to their outer
    // terminal, including when KITTY_WINDOW_ID remains inherited from it.
    if (
        !term ||
        term === 'dumb' ||
        term.includes('screen') ||
        term.includes('tmux')
    )
        return false;
    if (env.KITTY_WINDOW_ID || term.includes('kitty')) return true;
    return ['wezterm', 'ghostty'].includes(
        env.TERM_PROGRAM?.toLowerCase() ?? '',
    );
}

// Keep the CLI's workspace/runtime boundary in the shared prompt composer so
// it applies to terminal agents, browser-created agents, and rehydrated agents
// alike. The value is intentionally runtime-only rather than persisted in each
// agent's custom instructions: it reflects the current installation roots.
export async function configureRuntimePathInstructions(
    ctx: Context,
    workspace: string,
): Promise<void> {
    const roots = await ctx.fns.project.roots(ctx);
    (ctx.state as any).runtimePathInstructions = runtimePathInstructions({
        workspace,
        roots,
    });
}

export default async function main(
    argv: string[],
    deps: MainDependencies = {},
): Promise<number> {
    const start = deps.startRuntime ?? startRuntime;
    const terminal = deps.runTerminal ?? runTerminal;
    let forcedShutdown = false;
    try {
        const command = parseArgs(argv);
        if (command.kind === 'help') {
            console.log(helpText());
            return 0;
        }
        if (command.kind === 'version') {
            const pkg = await Bun.file(
                new URL('../package.json', import.meta.url),
            ).json();
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
            console.log(
                'Concurrent hcode processes for the same workspace are unsupported in this preview.',
            );
            const serveExit = new AbortController();
            const onSignal = () => serveExit.abort();
            process.once('SIGINT', onSignal);
            process.once('SIGTERM', onSignal);
            let runtime: Awaited<ReturnType<typeof startRuntime>> | undefined;
            try {
                runtime = await start({
                    workspace,
                    dbPath,
                    http: true,
                    env: command.port ? { PORT: String(command.port) } : {},
                    configurePromptContext: (ctx) =>
                        configureRuntimePathInstructions(ctx, workspace),
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
        // Install both process-level handlers before bootstrap. The worker is
        // started inside startRuntime(), so a Ctrl+C in any later bootstrap
        // step must still reach runtime.shutdown() rather than taking Bun's
        // default immediate-exit path. runTerminal replaces SIGINT with its
        // stop-then-exit lifecycle once the line adapter is active.
        const onBootstrapSigint = () => terminalExit.abort('SIGINT');
        const onSigterm = () => terminalExit.abort('SIGTERM');
        process.once('SIGINT', onBootstrapSigint);
        process.once('SIGTERM', onSigterm);
        let runtime: Awaited<ReturnType<typeof startRuntime>> | undefined;
        try {
            runtime = await start({
                workspace,
                dbPath,
                http: false,
                quiet: true,
                configurePromptContext: (ctx) =>
                    configureRuntimePathInstructions(ctx, workspace),
            });
            if (!terminalExit.signal.aborted) {
                const loaded = await runtime.ctx.fns.workspace.instructions(
                    runtime.ctx,
                    { workspace },
                );
                if (!terminalExit.signal.aborted) {
                    // Keep an explicit CLI model completely independent of
                    // discovery so it remains a one-shot override.
                    const selected = command.model
                        ? { model: command.model, detected: false, alternatives: [] as string[] }
                        : await runtime.ctx.fns.llm.selectDefaultModel(runtime.ctx);
                    const model = selected.model;
                    if (!terminalExit.signal.aborted) {
                        const prompt = [
                            'You are running in TRUSTED MODE with unrestricted local agent execution.',
                            loaded.text,
                        ]
                            .filter(Boolean)
                            .join('\n\n');
                        const agent = runtime.ctx.fns.agent.start(runtime.ctx, {
                            model,
                            systemPrompt: prompt,
                        });
                        if (selected.detected) {
                            // Cache discovery immediately, so later launches
                            // do not repeat subscription and local probes.
                            // The terminal adapters remove it if this first
                            // request proves the candidate unusable.
                            runtime.ctx.fns.settings.set(runtime.ctx, {
                                module: 'llm', scopeType: 'global', key: 'defaultModel', value: selected.model,
                            });
                            // This is deliberately not scratchpad state.
                            (agent as any).__hcodeDetectedDefaultModel = selected.model;
                            (agent as any).__hcodeModelAlternatives = selected.alternatives;
                        }
                        const interactiveTty =
                            deps.isInteractiveTty?.() ??
                            Boolean(
                                process.stdin.isTTY && process.stdout.isTTY,
                            );
                        const interactive =
                            interactiveTty &&
                            (deps.supportsKittyKeyboard?.() ??
                                supportsKittyKeyboard());
                        if (interactive) {
                            const tui =
                                deps.runTui ??
                                (await import('../src/cli/runTui.entry'))
                                    .default;
                            await tui({
                                ctx: runtime.ctx,
                                agent,
                                workspace,
                                initialPrompt: command.prompt,
                                exitSignal: terminalExit.signal,
                            });
                        } else {
                            await terminal({
                                ctx: runtime.ctx,
                                agent,
                                workspace,
                                initialPrompt: command.prompt,
                                registerInterrupt: (handler) => {
                                    process.off('SIGINT', onBootstrapSigint);
                                    process.on('SIGINT', handler);
                                    return () => process.off('SIGINT', handler);
                                },
                                exitSignal: terminalExit.signal,
                            });
                        }
                    }
                }
            }
        } finally {
            process.off('SIGINT', onBootstrapSigint);
            process.off('SIGTERM', onSigterm);
            const result = await runtime?.shutdown();
            forcedShutdown = result?.forced ?? false;
        }
        return forcedShutdown ? FORCED_SHUTDOWN_EXIT_CODE : 0;
    } catch (error: any) {
        console.error(`hcode: ${error?.message ?? error}`);
        if (error instanceof CliUsageError)
            console.error('Run `hcode --help` for usage.');
        // A forced shutdown leaves uncooperative adapter work alive. The
        // entrypoint must call process.exit() in that case even when the
        // terminal also reported an error.
        if (forcedShutdown) return FORCED_SHUTDOWN_EXIT_CODE;
        return error?.exitCode ?? 1;
    }
}

function waitForExitSignal(signal: AbortSignal): Promise<void> {
    if (signal.aborted) return Promise.resolve();
    return new Promise((resolve) =>
        signal.addEventListener('abort', () => resolve(), { once: true }),
    );
}

function helpText() {
    return `Usage:
  hcode [-C <directory>] [-m <model>] [prompt]
  hcode serve [-C <directory>] [--port <port>]

Commands:
  (default)  Start the full-screen TUI in a terminal; line mode when redirected
  serve      Start the existing browser server explicitly

Options:
  -C, --cwd <directory>  Select and canonicalize the workspace
  -m, --model <model>    Override the configured terminal model
  --port <port>          Browser server port (serve only)
  -h, --help             Show this help
  --version              Show the package version`;
}
