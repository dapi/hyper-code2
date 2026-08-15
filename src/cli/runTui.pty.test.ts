import { afterEach, describe, expect, test } from 'bun:test';
import { mkdir, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dir, '../..');
const fixtureRoot = join(repoRoot, '.test-tmp', 'hcode-tui-pty');

afterEach(async () => {
    await rm(fixtureRoot, { recursive: true, force: true });
});

describe('runTui host PTY', () => {
    test('enters and restores alternate screen and cursor on idle Ctrl+C exit', async () => {
        const workspace = join(fixtureRoot, 'workspace');
        await mkdir(workspace, { recursive: true });
        const command = [
            join(repoRoot, 'hcode'),
            '-C',
            workspace,
            '-m',
            'mock:test',
        ];
        const innerCommand = [
            'before=$(stty -g)',
            `${command.map(shellQuote).join(' ')}; code=$?`,
            'after=$(stty -g)',
            `printf '\\n__STTY_BEFORE__%s\\n__STTY_AFTER__%s\\n' "$before" "$after"`,
            'exit "$code"',
        ].join('; ');
        const scriptCommand =
            process.platform === 'darwin'
                ? `script -q /dev/null sh -c ${shellQuote(innerCommand)}`
                : `script -qec ${shellQuote(innerCommand)} /dev/null`;
        const proc = Bun.spawn({
            cmd: ['sh', '-c', `(sleep 15; printf '\\003') | ${scriptCommand}`],
            cwd: workspace,
            env: {
                ...process.env,
                BUN_BIN: process.execPath,
                TERM: 'xterm-256color',
            },
            stdin: 'ignore',
            stdout: 'pipe',
            stderr: 'pipe',
        });
        const stdout = new Response(proc.stdout).text();
        const stderr = new Response(proc.stderr).text();

        try {
            const exitCode = await Promise.race([
                proc.exited,
                Bun.sleep(30_000).then(() => {
                    throw new Error('PTY child did not exit');
                }),
            ]);
            const output = await stdout;
            const errorOutput = await stderr;

            expect(exitCode).toBe(0);
            expect(errorOutput).toBe('');
            const entered = output.indexOf('\x1b[?1049h');
            const restored = output.lastIndexOf('\x1b[?1049l');
            const cursorHidden = output.indexOf('\x1b[?25l');
            const cursorShown = output.lastIndexOf('\x1b[?25h');
            expect(entered).toBeGreaterThanOrEqual(0);
            expect(restored).toBeGreaterThan(entered);
            expect(cursorHidden).toBeGreaterThanOrEqual(0);
            expect(cursorShown).toBeGreaterThan(cursorHidden);
            expect(output.match(/\x1b\[\?1049h/g)).toHaveLength(1);
            expect(output.match(/\x1b\[\?1049l/g)).toHaveLength(1);
            const before = output.match(/__STTY_BEFORE__([^\r\n]+)/)?.[1];
            const after = output.match(/__STTY_AFTER__([^\r\n]+)/)?.[1];
            expect(before).toBeTruthy();
            expect(after).toBe(before);
        } finally {
            try {
                proc.kill('SIGKILL');
            } catch {}
        }
    }, 40_000);
});

function shellQuote(value: string): string {
    return `'${value.replaceAll("'", "'\\''")}'`;
}
