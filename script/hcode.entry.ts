import main, { FORCED_SHUTDOWN_EXIT_CODE } from './hcode';

const exitCode = await main(process.argv.slice(2));
if (exitCode === FORCED_SHUTDOWN_EXIT_CODE) {
    // A marker adapter ignored AbortSignal and left live event-loop work after
    // the runtime's bounded cleanup. Return from the executable only after
    // explicitly terminating that work.
    process.exit(exitCode);
}
process.exitCode = exitCode;
