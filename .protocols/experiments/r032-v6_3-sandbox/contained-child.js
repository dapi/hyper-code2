const MAX_INPUT_BYTES = 4096;
const chunks = [];
let inputBytes = 0;
for await (const chunk of Bun.stdin.stream()) {
    inputBytes += chunk.byteLength;
    if (inputBytes > MAX_INPUT_BYTES) fail('INPUT_TOO_LARGE');
    chunks.push(chunk);
}
const request = JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
ensure(request && request.schemaVersion === 2, 'REQUEST_SCHEMA');
for (const key of ['operatorHomePath', 'keychainPath', 'outsideReadProbe', 'outsideWriteProbe', 'selfExecutable', 'expectedCwd']) {
    ensure(typeof request[key] === 'string', `REQUEST_${key}`);
}

const { dlopen, FFIType, ptr } = await import('bun:ffi');
const sandbox = dlopen('/usr/lib/system/libsystem_sandbox.dylib', {
    sandbox_check: { args: [FFIType.i32, FFIType.ptr, FFIType.i32, FFIType.ptr], returns: FFIType.i32 },
});

let receipt;
try {
    const check = sandbox.symbols.sandbox_check;
    receipt = {
        schemaVersion: 2,
        containmentPassedBeforeRoot: true,
        probes: {
            connect: pairedProbe(
                policyDenied(check, 'network-outbound'),
                await observeBehavior(async () => {
                    const socket = await Bun.connect({ hostname: '127.0.0.1', port: 9, socket: { data() {} } });
                    socket.end();
                }),
            ),
            bind: pairedProbe(
                policyDenied(check, 'network-bind'),
                await observeBehavior(() => {
                    const server = Bun.serve({ port: 0, fetch: () => new Response('probe') });
                    server.stop(true);
                }),
            ),
            outsideWrite: pairedProbe(
                policyDenied(check, 'file-write-create', 1, request.outsideWriteProbe),
                await observeBehavior(() => Bun.write(request.outsideWriteProbe, 'probe')),
            ),
            outsideRead: pairedProbe(
                policyDenied(check, 'file-read-data', 1, request.outsideReadProbe),
                await observeBehavior(() => Bun.file(request.outsideReadProbe).arrayBuffer()),
            ),
            nonBunExec: pairedProbe(
                policyDenied(check, 'process-exec', 1, '/usr/bin/id'),
                await observeSpawn(['/usr/bin/id']),
            ),
            forkOrDescendant: pairedProbe(
                policyDenied(check, 'process-fork'),
                await observeSpawn([request.selfExecutable, '--descendant-probe']),
            ),
            operatorHomeReadPolicy: {
                policyDenied: policyDenied(check, 'file-read-data', 1, request.operatorHomePath),
                behaviorAttempted: false,
            },
            keychainReadPolicy: {
                policyDenied: policyDenied(check, 'file-read-data', 1, request.keychainPath),
                behaviorAttempted: false,
            },
            securityd: {
                policyDenied: policyDenied(check, 'mach-lookup', 2, 'com.apple.securityd'),
                behaviorAttempted: false,
            },
            securitydXpc: {
                policyDenied: policyDenied(check, 'mach-lookup', 2, 'com.apple.securityd.xpc'),
                behaviorAttempted: false,
            },
        },
        rootCalls: 0,
    };
} finally {
    sandbox.close();
}

for (const [name, probe] of Object.entries(receipt.probes)) {
    ensure(probe.policyDenied === true, `POLICY_NOT_DENIED_${name}`);
    if ('behaviorSucceeded' in probe) ensure(probe.behaviorSucceeded === false, `BEHAVIOR_SUCCEEDED_${name}`);
}
ensure(Object.keys(process.env).sort().join(',') === 'HOME,PATH,R032_V63_CHILD,TMPDIR', 'ENV_KEYS');
ensure(process.env.R032_V63_CHILD === '1', 'ENV_MARKER');
ensure(process.cwd() === request.expectedCwd, 'CWD');

// The canary stands in for a privileged callable root. It is deliberately
// unreachable until every policy and behavioral assertion above has passed.
receipt.rootCalls += 1;
process.stdout.write(JSON.stringify(receipt) + '\n');

function pairedProbe(policy, behavior) {
    return { policyDenied: policy, behaviorSucceeded: behavior.succeeded };
}

async function observeBehavior(action) {
    try {
        await action();
        return { succeeded: true };
    } catch {
        return { succeeded: false };
    }
}

async function observeSpawn(argv) {
    try {
        const child = Bun.spawn(argv, { stdin: 'ignore', stdout: 'ignore', stderr: 'ignore' });
        await child.exited;
        return { succeeded: true };
    } catch {
        return { succeeded: false };
    }
}

function policyDenied(check, operationName, filterType = 0, filterValue = '') {
    const operation = Buffer.from(operationName + '\0');
    const value = Buffer.from(filterValue + '\0');
    return check(process.pid, ptr(operation), filterType, ptr(value)) === 1;
}

function ensure(condition, code) {
    if (!condition) fail(code);
}

function fail(code) {
    process.stderr.write(`R032_V63_${code}\n`);
    process.exit(2);
}
