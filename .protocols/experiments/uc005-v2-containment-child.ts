import { readFile, writeFile } from "node:fs/promises";

import {
  CHILD_ENVIRONMENT_KEYS,
  keychainContainmentPassed,
  type KeychainContainmentProbe,
} from "./uc005-v2-containment.ts";

type Config = {
  outputPath: string;
  insideWriteProbe: string;
  outsideWriteProbe: string;
  homeProbePath: string;
  disposableHome: string;
  disposableTmp: string;
  expectedPath: string;
  repoProbePath: string;
  sandboxPolicyProbePath: string;
  checkoutOverlayProbePath: string;
  operatorKeychainPath: string;
};

const configPath = process.argv[2];
if (!configPath) throw new Error("usage: bun uc005-v2-containment-child.ts <config.json>");
const config = await Bun.file(configPath).json() as Config;

async function denied(operation: () => Promise<unknown>): Promise<boolean> {
  try {
    await operation();
    return false;
  } catch {
    return true;
  }
}

const actualEnvironment = Object.keys(process.env).sort();
const credentialLikeKeys = actualEnvironment.filter((key) =>
  /(?:AUTH|BEARER|CREDENTIAL|SECRET|TOKEN|API_?KEY|OPENAI|ANTHROPIC|CODEX|CLAUDE)/i.test(key)
);
const repoReadAllowed = await Bun.file(config.repoProbePath).exists();
const operatorHomeFileReadDenied = await denied(async () => { await readFile(config.homeProbePath); });
const outsideRootWriteDenied = await denied(async () => { await writeFile(config.outsideWriteProbe, "must-not-exist"); });
const networkListenDenied = await denied(async () => {
  const server = Bun.listen({
    hostname: "127.0.0.1",
    port: 0,
    socket: { data() {} },
  });
  server.stop(true);
});
const operatorKeychainFileReadDenied = await denied(async () => { await readFile(config.operatorKeychainPath); });

const policyProbe = Bun.spawn([config.sandboxPolicyProbePath, config.checkoutOverlayProbePath], {
  env: process.env,
  stdout: "pipe",
  stderr: "pipe",
});
const [policyProbeStdout, policyProbeStderr, policyProbeExitCode] = await Promise.all([
  new Response(policyProbe.stdout).text(),
  new Response(policyProbe.stderr).text(),
  policyProbe.exited,
]);
const policyProbeResult = policyProbeStdout.trim()
  ? JSON.parse(policyProbeStdout.trim()) as Record<string, boolean>
  : {};

// This deterministic, nonexistent service/account pair proves that a child can
// launch the same Keychain CLI available to generated bash while the sandbox
// still prevents it from reaching securityd. It never requests an existing item.
const syntheticKeychainProbe = Bun.spawn([
  "/usr/bin/security",
  "find-generic-password",
  "-s", "com.hyper-code2.uc005-v2.nonexistent",
  "-a", "uc005-v2-contained-probe",
  config.operatorKeychainPath,
], {
  env: process.env,
  stdout: "pipe",
  stderr: "pipe",
});
const [securityStdout, securityStderr, securityExitCode] = await Promise.all([
  new Response(syntheticKeychainProbe.stdout).text(),
  new Response(syntheticKeychainProbe.stderr).text(),
  syntheticKeychainProbe.exited,
]);

await writeFile(config.insideWriteProbe, "inside-write-ok\n");
const report: KeychainContainmentProbe = {
  environment: {
    expectedKeys: CHILD_ENVIRONMENT_KEYS,
    actualKeys: actualEnvironment,
    exactAllowlist: actualEnvironment.join("\0") === CHILD_ENVIRONMENT_KEYS.join("\0"),
    credentialLikeKeys,
    disposableHome: process.env.HOME === config.disposableHome,
    disposableTmp: process.env.TMPDIR === config.disposableTmp,
    exactPath: process.env.PATH === config.expectedPath,
  },
  probes: {
    repoReadAllowed,
    operatorHomeFileReadDenied,
    outsideRootWriteDenied,
    insideRootWriteAllowed: await Bun.file(config.insideWriteProbe).exists(),
    networkListenDenied,
    operatorKeychainFileReadDenied,
    checkoutOverlayReadDeniedBySandboxCheck:
      policyProbeExitCode === 0
      && policyProbeResult.checkoutOverlayReadDenied === true,
    keychainMachServicesDeniedBySandboxCheck:
      policyProbeExitCode === 0
      && policyProbeStderr === ""
      && policyProbeResult["com.apple.securitydDenied"] === true
      && policyProbeResult["com.apple.securityd.xpcDenied"] === true,
    nonexistentKeychainLookupFailedWithSecuritydMachLookupDenied:
      securityExitCode !== 0
      && securityStdout === ""
      && securityStderr.length > 0
      && policyProbeExitCode === 0,
  },
};
await Bun.write(config.outputPath, JSON.stringify({
  schemaVersion: 1,
  runner: "uc005-v2-containment-child.ts@1",
  phase: "pre-broker-containment",
  sandbox: {
    implementation: "macOS sandbox-exec deny-default profile",
    machLookupPolicy: "deny-default; no mach-lookup allow rule",
  },
  ...report,
  passed: keychainContainmentPassed(report),
}, null, 2));
