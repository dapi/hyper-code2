export const CHILD_ENVIRONMENT_KEYS = ["HOME", "LANG", "LC_ALL", "NO_COLOR", "PATH", "TMPDIR"];

export type KeychainContainmentProbe = {
  environment: {
    expectedKeys: string[];
    actualKeys: string[];
    exactAllowlist: boolean;
    credentialLikeKeys: string[];
    disposableHome: boolean;
    disposableTmp: boolean;
    exactPath: boolean;
  };
  probes: {
    repoReadAllowed: boolean;
    operatorHomeFileReadDenied: boolean;
    outsideRootWriteDenied: boolean;
    insideRootWriteAllowed: boolean;
    networkListenDenied: boolean;
    operatorKeychainFileReadDenied: boolean;
    checkoutOverlayReadDeniedBySandboxCheck: boolean;
    keychainMachServicesDeniedBySandboxCheck: boolean;
    nonexistentKeychainLookupFailedWithSecuritydMachLookupDenied: boolean;
  };
};

function escapeProfile(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

export function buildSandboxProfile(opts: {
  runRoot: string;
  repoRoot: string;
  checkoutOverlayDir: string;
  bunExecutable: string;
  deniedReadRoots: string[];
}): string {
  const escapedRun = escapeProfile(opts.runRoot);
  const escapedRepo = escapeProfile(opts.repoRoot);
  const escapedCheckoutOverlay = escapeProfile(opts.checkoutOverlayDir);
  const escapedBun = escapeProfile(opts.bunExecutable);
  const deniedReadRoots = [...new Set(opts.deniedReadRoots)].map(escapeProfile);
  if (deniedReadRoots.length === 0) throw new Error("at least one denied read root is required");
  const readFilter = deniedReadRoots.length === 1
    ? `(require-not (subpath "${deniedReadRoots[0]}"))`
    : `(require-all ${deniedReadRoots.map((root) => `(require-not (subpath "${root}"))`).join(" ")})`;
  return `(version 1)
(deny default)
(allow process*)
(allow sysctl-read)
(allow file-read-metadata)
(allow file-read* ${readFilter})
(allow file-read* (literal "${escapedBun}") (subpath "${escapedRepo}") (subpath "${escapedRun}"))
(deny file-read* (subpath "${escapedCheckoutOverlay}"))
(allow file-write* (subpath "${escapedRun}"))`;
}

export function keychainContainmentPassed(report: KeychainContainmentProbe): boolean {
  return report.environment.exactAllowlist
    && report.environment.actualKeys.join("\0") === CHILD_ENVIRONMENT_KEYS.join("\0")
    && report.environment.expectedKeys.join("\0") === CHILD_ENVIRONMENT_KEYS.join("\0")
    && report.environment.credentialLikeKeys.length === 0
    && report.environment.disposableHome
    && report.environment.disposableTmp
    && report.environment.exactPath
    && Object.values(report.probes).every(Boolean);
}

export function assertLiveContainment(mode: "mock" | "live", osSandboxEnforced: boolean): void {
  if (mode === "live" && !osSandboxEnforced) {
    throw new Error("live mode requires macOS sandbox-exec containment");
  }
}
