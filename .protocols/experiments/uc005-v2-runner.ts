import { mkdir, mkdtemp, readdir, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { deepEqual, inventory, sanitizeText, sha256File } from "./uc005-v2-lib.ts";

const repoRoot = resolve(import.meta.dir, "../..");
const mode = process.argv.includes("--live") ? "live" : "mock";
const model = process.env.UC005_MODEL ?? "codex:gpt-5.4";
const runId = process.env.UC005_RUN_ID ?? `${new Date().toISOString().replace(/[:.]/g, "-")}-${mode}`;
const artifactDir = resolve(process.env.UC005_ARTIFACT_DIR ?? join(import.meta.dir, "runs", runId));
const runRoot = await realpath(await mkdtemp(join(tmpdir(), `hyper-code2-uc005-v2-${mode}-`)));
const workspace = join(runRoot, "workspace");
const cleanHome = join(runRoot, "home");
const tempDir = join(runRoot, "tmp");
const brokerDir = join(runRoot, "broker");
const sentinel = `UC005_V2_SENTINEL_${crypto.randomUUID()}`;
await mkdir(join(workspace, "src/text"), { recursive: true });
await mkdir(join(workspace, ".hyper"), { recursive: true });
await mkdir(cleanHome, { recursive: true });
await mkdir(tempDir, { recursive: true });
await mkdir(brokerDir, { recursive: true });
await mkdir(artifactDir, { recursive: true });
if ((await readdir(artifactDir)).length > 0) {
  throw new Error(`artifact directory must be empty: ${artifactDir}`);
}
await Bun.write(join(workspace, "src/text/normalizeTag.ts"), `export default async function (_ctx: any, opts: { value: string }) {
  return opts.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}\n`);

const childScript = resolve(import.meta.dir, "uc005-v2-child.ts");
const restartScript = resolve(import.meta.dir, "uc005-v2-restart.ts");
const brokerScript = resolve(import.meta.dir, "uc005-v2-broker.ts");
const sandboxExec = Bun.which("sandbox-exec");
const osSandboxEnforced = process.platform === "darwin" && Boolean(sandboxExec);

function sandboxProfile(): string {
  const escapedRun = runRoot.replaceAll('"', '\\"');
  const escapedRepo = repoRoot.replaceAll('"', '\\"');
  const escapedBun = (Bun.which("bun") ?? process.execPath).replaceAll('"', '\\"');
  const escapedUserHome = (process.env.HOME ?? "/Users/__no_home__").replaceAll('"', '\\"');
  return `(version 1)
(deny default)
(allow process*)
(allow sysctl-read)
(allow mach-lookup)
(allow file-read-metadata)
(allow file-read* (require-not (subpath "${escapedUserHome}")))
(allow file-read* (literal "${escapedBun}") (subpath "${escapedRepo}") (subpath "${escapedRun}"))
(allow file-write* (subpath "${escapedRun}"))`;
}

async function spawnIsolated(script: string, configPath: string) {
  const base = [process.execPath, script, configPath];
  const command = osSandboxEnforced ? [sandboxExec!, "-p", sandboxProfile(), ...base] : base;
  const proc = Bun.spawn(command, {
    // Starting Bun in the repository could auto-load its .env before our script
    // changes cwd. Start inside the disposable workspace instead.
    cwd: workspace,
    env: {
      PATH: process.env.PATH ?? "/usr/bin:/bin",
      HOME: cleanHome,
      TMPDIR: tempDir,
      LANG: "C.UTF-8",
      LC_ALL: "C.UTF-8",
      NO_COLOR: "1",
    },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited,
  ]);
  return { exitCode, stdout, stderr };
}

const authHome = mode === "live" ? (process.env.UC005_AUTH_HOME ?? process.env.HOME) : undefined;
if (mode === "live" && !authHome) throw new Error("live mode requires UC005_AUTH_HOME or HOME");
const brokerConfigPath = join(runRoot, "broker.config.json");
await Bun.write(brokerConfigPath, JSON.stringify({ brokerDir, workspace, mode, authHome }));
const broker = Bun.spawn([process.execPath, brokerScript, brokerConfigPath], {
  cwd: workspace,
  env: {
    PATH: process.env.PATH ?? "/usr/bin:/bin", HOME: authHome ?? cleanHome, TMPDIR: tempDir,
    LANG: "C.UTF-8", LC_ALL: "C.UTF-8", NO_COLOR: "1",
  },
  stdout: "pipe", stderr: "pipe",
});
const phaseReports: any[] = [];
try {
for (const phase of ["baseline", "retain", "reuse"] as const) {
  const configPath = join(runRoot, `phase-${phase}.config.json`);
  const outputPath = join(runRoot, `phase-${phase}.sanitized.json`);
  await Bun.write(configPath, JSON.stringify({
    phase, mode, model, repoRoot, runRoot, workspace, outputPath, brokerDir, sentinel, maxLlmCalls: 6,
  }));
  const processResult = await spawnIsolated(childScript, configPath);
  const redactions = [runRoot, workspace, repoRoot, authHome ?? "", sentinel];
  await Bun.write(join(artifactDir, `phase-${phase}.stdout.log`), sanitizeText(processResult.stdout, redactions));
  await Bun.write(join(artifactDir, `phase-${phase}.stderr.log`), sanitizeText(processResult.stderr, redactions));
  if (processResult.exitCode !== 0 || !(await Bun.file(outputPath).exists())) {
    throw new Error(`phase ${phase} failed before report: exit=${processResult.exitCode}`);
  }
  const report = await Bun.file(outputPath).json();
  phaseReports.push({ ...report, processExitCode: processResult.exitCode });
  await Bun.write(join(artifactDir, `phase-${phase}.sanitized.json`), JSON.stringify(report, null, 2));
}
} finally {
  await Bun.write(join(brokerDir, "STOP"), "stop\n");
}
const brokerExit = await broker.exited;
const brokerStdout = await new Response(broker.stdout).text();
const brokerStderr = await new Response(broker.stderr).text();
await Bun.write(join(artifactDir, "broker.stdout.log"), sanitizeText(brokerStdout, [runRoot, workspace, repoRoot, authHome ?? "", sentinel]));
await Bun.write(join(artifactDir, "broker.stderr.log"), sanitizeText(brokerStderr, [runRoot, workspace, repoRoot, authHome ?? "", sentinel]));
if (brokerExit !== 0) throw new Error(`broker exited ${brokerExit}`);

const restartConfig = join(runRoot, "restart.config.json");
const restartOutput = join(runRoot, "restart.sanitized.json");
await Bun.write(restartConfig, JSON.stringify({ runRoot, workspace, outputPath: restartOutput, sentinel }));
const restartProcess = await spawnIsolated(restartScript, restartConfig);
if (restartProcess.exitCode !== 0 || !(await Bun.file(restartOutput).exists())) {
  throw new Error(`restart verifier failed before report: exit=${restartProcess.exitCode}`);
}
const restart = await Bun.file(restartOutput).json();
await Bun.write(join(artifactDir, "restart.sanitized.json"), JSON.stringify(restart, null, 2));
await Bun.write(join(artifactDir, "restart.stdout.log"), sanitizeText(restartProcess.stdout, [runRoot, workspace, repoRoot, sentinel]));
await Bun.write(join(artifactDir, "restart.stderr.log"), sanitizeText(restartProcess.stderr, [runRoot, workspace, repoRoot, sentinel]));

const gold: Record<string, unknown> = {
  baseline: ["priority", "customer-success", "r-d"],
  retain: ["a", "b-b"],
  reuse: { tags: ["enterprise", "customer-success"], csv: "enterprise,customer-success", count: 2 },
};
const validations = phaseReports.map((phase) => ({
  phase: phase.phase,
  gold: gold[phase.phase],
  toolResult: phase.observed.lastToolResult,
  finalAnswer: phase.observed.finalAnswer,
  toolMatchesGold: deepEqual(phase.observed.lastToolResult, gold[phase.phase]),
  finalMatchesGold: deepEqual(phase.observed.finalAnswer, gold[phase.phase]),
  finalMatchesTool: deepEqual(phase.observed.finalAnswer, phase.observed.lastToolResult),
  falseSuccess: phase.error == null && !deepEqual(phase.observed.lastToolResult, gold[phase.phase]) && deepEqual(phase.observed.finalAnswer, gold[phase.phase]),
}));
const capabilityPath = join(workspace, ".hyper/text/dedupeTags.ts");
if (await Bun.file(capabilityPath).exists()) {
  await Bun.write(join(artifactDir, "retained-capability.ts"), sanitizeText(
    await Bun.file(capabilityPath).text(),
    [runRoot, workspace, repoRoot, authHome ?? "", sentinel],
  ));
}
const artifacts = await inventory(artifactDir);
const instrumentFiles = [
  "uc005-v2-runner.ts",
  "uc005-v2-child.ts",
  "uc005-v2-restart.ts",
  "uc005-v2-lib.ts",
  "uc005-v2-broker.ts",
];
const instrumentChecksums = Object.fromEntries(await Promise.all(instrumentFiles.map(async (name) => [
  name,
  await sha256File(join(import.meta.dir, name)),
])));
const manifest = {
  schemaVersion: 2,
  runId,
  createdAt: new Date().toISOString(),
  mode,
  requestedModel: mode === "live" ? model : "mock:uc005-v2",
  modelIdentifierProvenance: mode === "live"
    ? "Configured request string; the current provider response does not expose a stronger immutable model snapshot."
    : "Versioned local mock reply fixture in uc005-v2-broker.ts.",
  instrument: {
    bunVersion: Bun.version,
    platform: `${process.platform}-${process.arch}`,
    sourceSha256: instrumentChecksums,
  },
  processBoundaries: {
    phasePids: phaseReports.map((phase) => ({ phase: phase.phase, pid: phase.pid })),
    restartPid: restart.pid,
    separatelySpawnedRestartVerifier: true,
    restartPidDifferentAtObservation: !phaseReports.some((phase) => phase.pid === restart.pid),
    brokerPid: broker.pid,
  },
  safetyClaims: {
    minimalChildEnvironment: true,
    disposableHomeAndTmp: true,
    osWriteSandboxEnforced: osSandboxEnforced,
    networkDeniedByOsSandbox: osSandboxEnforced,
    credentialsProvidedToAgentRuntime: false,
    credentialsOwnedByBroker: mode === "live",
    agentNetworkDeniedByOsSandbox: osSandboxEnforced,
    sentinelLeakDetected: phaseReports.some((phase) => phase.observed.sentinelLeakDetected === true),
    securityValidation: "experiment process boundary established; production HG-02 not established",
    limitation: mode === "live"
      ? "The agent child has disposable HOME and no provider credentials; a separate broker owns auth and network. This validates the experiment boundary, not the production runtime."
      : osSandboxEnforced
        ? "Agent writes are restricted to the disposable run root, network is denied, and reads under the user's home are denied except the repository and Bun executable. This validates the instrument, not production HG-02."
        : "Clean environment and disposable roots are used, but no OS sandbox was available; writes outside the monitored root cannot be ruled out.",
  },
  validations,
  restart: {
    ...restart,
    expected: ["restart", "fresh-process"],
    matchesGold: restart.callable === true && deepEqual(restart.value, ["restart", "fresh-process"]),
  },
  phaseErrors: phaseReports.map((phase) => ({ phase: phase.phase, error: phase.error })),
  artifactChecksumsBeforeManifest: artifacts,
};
await Bun.write(join(artifactDir, "report.json"), JSON.stringify(manifest, null, 2));
const checksumLines: string[] = [];
for (const name of Object.keys(await inventory(artifactDir)).sort()) {
  checksumLines.push(`${await sha256File(join(artifactDir, name))}  ${name}`);
}
await Bun.write(join(artifactDir, "SHA256SUMS"), checksumLines.join("\n") + "\n");
console.log(JSON.stringify({ artifactDir, ...manifest }, null, 2));
