export type CliCommand =
    | { kind: 'help' }
    | { kind: 'version' }
    | { kind: 'terminal'; workspace: string; model?: string; prompt?: string }
    | { kind: 'serve'; workspace: string; port?: number };

export class CliUsageError extends Error {
    exitCode = 2;
}

export default function parseArgs(argv: string[]): CliCommand {
    let kind: 'terminal' | 'serve' = 'terminal';
    let workspace = process.cwd();
    let model: string | undefined;
    let port: number | undefined;
    const positional: string[] = [];

    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index]!;
        if (arg === 'serve' && index === 0) { kind = 'serve'; continue; }
        if (arg === '-h' || arg === '--help') return { kind: 'help' };
        if (arg === '--version') return { kind: 'version' };
        if (arg === '-C' || arg === '--cwd') {
            workspace = requiredValue(argv, ++index, arg);
            continue;
        }
        if (arg === '-m' || arg === '--model') {
            if (kind === 'serve') throw new CliUsageError(`${arg} is only valid in terminal mode`);
            model = requiredValue(argv, ++index, arg);
            continue;
        }
        if (arg === '--port') {
            if (kind !== 'serve') throw new CliUsageError('--port requires serve mode');
            const raw = requiredValue(argv, ++index, arg);
            port = Number(raw);
            if (!Number.isInteger(port) || port < 1 || port > 65535) {
                throw new CliUsageError(`invalid port: ${raw}`);
            }
            continue;
        }
        if (arg.startsWith('-')) throw new CliUsageError(`unknown option: ${arg}`);
        positional.push(arg);
    }

    if (kind === 'serve') {
        if (positional.length) throw new CliUsageError('serve does not accept a prompt');
        return { kind, workspace, ...(port ? { port } : {}) };
    }
    if (positional.length > 1) throw new CliUsageError('expected at most one prompt argument');
    return { kind, workspace, ...(model ? { model } : {}), ...(positional[0] ? { prompt: positional[0] } : {}) };
}

function requiredValue(argv: string[], index: number, option: string): string {
    const value = argv[index];
    if (!value || value.startsWith('-')) throw new CliUsageError(`${option} requires a value`);
    return value;
}
