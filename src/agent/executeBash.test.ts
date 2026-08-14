import { describe, test, expect } from 'bun:test';
import executeBashFn from './executeBash';

const ctx: any = {};
const executeBash = (c: any, code: string, signal?: AbortSignal) => executeBashFn(c, { code, signal });

describe('agent.executeBash', () => {
    test('successful exit returns stdout', async () => {
        const r = await executeBash(ctx, 'echo hello');
        expect(r).toEqual({ output: 'hello', isError: false });
    });

    test('non-zero exit returns [exit N] + stderr', async () => {
        const r = await executeBash(ctx, 'echo oops 1>&2; exit 7');
        expect(r.isError).toBe(true);
        expect(r.output).toContain('[exit 7]');
        expect(r.output).toContain('oops');
    });

    test('non-zero exit with stdout includes both', async () => {
        const r = await executeBash(ctx, 'echo before; echo bad 1>&2; exit 1');
        expect(r.isError).toBe(true);
        expect(r.output).toContain('[exit 1]');
        expect(r.output).toContain('bad');
        expect(r.output).toContain('stdout:\nbefore');
    });

    test('empty output → "(no output)"', async () => {
        const r = await executeBash(ctx, 'true');
        expect(r).toEqual({ output: '(no output)', isError: false });
    });

    test('only stderr on success → "(stderr)" prefix', async () => {
        const r = await executeBash(ctx, 'echo only-err 1>&2');
        expect(r.isError).toBe(false);
        expect(r.output).toBe('(stderr)\nonly-err');
    });

    test('trailing newline trimmed from stdout', async () => {
        const r = await executeBash(ctx, 'printf "x\\n\\n"');
        expect(r.output).toBe('x');
    });

    test('aborts the entire shell process group when its turn is stopped', async () => {
        const controller = new AbortController();
        const startedAt = Date.now();
        // The background sleep inherits bash's stdout/stderr pipes. Killing
        // only bash would leave Promise.all waiting for it to exit.
        const running = executeBash(ctx, 'sleep 2 & wait', controller.signal);
        setTimeout(() => controller.abort('stopped_by_user'), 20);

        const result = await running;
        expect(Date.now() - startedAt).toBeLessThan(1_000);
        expect(result.isError).toBe(true);
    }, 2_000);
});
