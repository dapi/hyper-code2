import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sha256, stableJson } from "./r031-offline-lib";

const configPath = process.argv[2];
assert(configPath, "config path required");
const config = JSON.parse(await readFile(configPath, "utf8")) as {
    caseId: string;
    brokerDir: string;
    requestPath: string;
    responsePath: string;
    outputPath: string;
    repositoryProbePath: string;
    operatorHomeProbePath: string;
    outboundProbePort: number;
    envelope: unknown;
};

const environmentKeys = Object.keys(process.env).sort();
const allowedEnvironmentKeys = ["HOME", "LANG", "LC_ALL", "NO_COLOR", "PATH", "TMPDIR"];
assert.deepEqual(environmentKeys, allowedEnvironmentKeys);
assert(!environmentKeys.some(key => /api|auth|credential|secret|token/i.test(key)), "agent child received auth-like environment key");

let networkListenProbeDenied = false;
try {
    const listener = Bun.listen({ hostname: "127.0.0.1", port: 0, socket: { data() {} } });
    listener.stop();
} catch {
    networkListenProbeDenied = true;
}
assert(networkListenProbeDenied, "R031_STOP_02: agent child network-listen probe was not denied");

let outboundConnectProbeDenied = false;
try {
    const socket = await Bun.connect({ hostname: "127.0.0.1", port: config.outboundProbePort, socket: { data() {} } });
    socket.end();
} catch {
    outboundConnectProbeDenied = true;
}
assert(outboundConnectProbeDenied, "R031_STOP_02: agent child outbound loopback connect was not denied");

let repositoryReadProbeDenied = false;
try {
    await readFile(config.repositoryProbePath);
} catch {
    repositoryReadProbeDenied = true;
}
assert(repositoryReadProbeDenied, "R031_STOP_02: agent child can read the operator repository");

let operatorHomeReadProbeDenied = false;
try {
    await readFile(config.operatorHomeProbePath);
} catch {
    operatorHomeReadProbeDenied = true;
}
assert(operatorHomeReadProbeDenied, "R031_STOP_02: agent child can read operator HOME");

let processSpawnProbeDenied = false;
try {
    const spawned = Bun.spawn(["/usr/bin/true"], { stdout: "ignore", stderr: "ignore" });
    processSpawnProbeDenied = await spawned.exited !== 0;
} catch {
    processSpawnProbeDenied = true;
}
assert(processSpawnProbeDenied, "R031_STOP_02: agent child can spawn a process");

const request = { caseId: config.caseId, sequence: 1, envelope: config.envelope };
await writeFile(config.requestPath, stableJson(request));
const deadline = Date.now() + 30_000;
while (!await Bun.file(config.responsePath).exists()) {
    if (Date.now() > deadline) throw new Error(`mock broker timeout: ${config.caseId}`);
    await Bun.sleep(10);
}
const response = JSON.parse(await readFile(config.responsePath, "utf8"));
assert.equal(response.ok, true);
assert.equal(response.mode, "offline-mock");
assert.equal(response.requestSha256, sha256(stableJson(request)));

await writeFile(config.outputPath, stableJson({
    schemaVersion: 1,
    caseId: config.caseId,
    pid: process.pid,
    environmentKeys,
    authLikeEnvironmentKeys: [],
    networkListenProbeDenied,
    outboundConnectProbeDenied,
    repositoryReadProbeDenied,
    operatorHomeReadProbeDenied,
    processSpawnProbeDenied,
    deniedNetworkOperations: ["bind/listen:tcp-loopback", "connect:tcp-loopback-established-listener"],
    brokerTransport: "filesystem",
    brokerMode: response.mode,
    providerCalls: response.providerCalls,
    requestSha256: response.requestSha256,
    brokerResponseVerified: true,
}));
