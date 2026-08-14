// Run a shell snippet from a §bash marker. Async (Bun.spawn, not spawnSync)
// so a long-running command doesn't block the event loop and freeze every
// other concurrent agent's LLM stream for the duration of the shell command.
//
// Output shape mirrors the agent's expectations:
// - exit 0:    return stdout (or stderr if stdout empty, or "(no output)")
// - exit !=0:  return "[exit N]\n<stderr>\nstdout:\n<stdout>", isError=true
export default async function (
    _ctx: Context,
    opts: { code: string; signal?: AbortSignal },
): Promise<{ output: string; isError: boolean }> {
    const { code } = opts;
    const proc = Bun.spawn({
        cmd: ['bash', '-c', code],
        stdout: 'pipe',
        stderr: 'pipe',
        // A non-interactive shell and its background children otherwise share
        // our process group. Make the shell a group leader so one abort can
        // terminate the whole command tree and close inherited output pipes.
        detached: true,
    });
    let killTimer: ReturnType<typeof setTimeout> | undefined;
    let terminationStarted = false;
    const signalProcessGroup = (signal: 'SIGTERM' | 'SIGKILL') => {
        try {
            // POSIX signals a process group when the pid is negative. Bun's
            // detached spawn uses setsid(), making the shell its leader.
            process.kill(-proc.pid, signal);
        } catch {
            // The shell can exit between observing abort and delivering the
            // signal. Keep best-effort direct termination for that race.
            try { proc.kill(signal); } catch {}
        }
    };
    const onAbort = () => {
        if (terminationStarted) return;
        terminationStarted = true;
        signalProcessGroup('SIGTERM');
        // A marker can deliberately or accidentally ignore SIGTERM. Escalate
        // while the output pipes are still open so shutdown stays bounded.
        killTimer = setTimeout(() => signalProcessGroup('SIGKILL'), 250);
    };
    opts.signal?.addEventListener('abort', onAbort, { once: true });
    if (opts.signal?.aborted) onAbort();

    let stdoutText: string;
    let stderrText: string;
    let exitCode: number;
    try {
        [stdoutText, stderrText, exitCode] = await Promise.all([
            new Response(proc.stdout).text(),
            new Response(proc.stderr).text(),
            proc.exited,
        ]);
    } finally {
        opts.signal?.removeEventListener('abort', onAbort);
        if (killTimer) clearTimeout(killTimer);
    }
    const stdout = stdoutText.trimEnd();
    const stderr = stderrText.trimEnd();
    if (exitCode !== 0) {
        const parts = [`[exit ${exitCode}]`];
        if (stderr) parts.push(stderr);
        if (stdout) parts.push('stdout:\n' + stdout);
        return { output: parts.join('\n'), isError: true };
    }
    return {
        output: stdout || (stderr ? '(stderr)\n' + stderr : '(no output)'),
        isError: false,
    };
}
