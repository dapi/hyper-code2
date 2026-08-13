import { describe, expect, test } from "bun:test";

import {
  CHILD_ENVIRONMENT_KEYS,
  assertLiveContainment,
  buildSandboxProfile,
  keychainContainmentPassed,
  type KeychainContainmentProbe,
} from "./uc005-v2-containment.ts";

function passingReport(): KeychainContainmentProbe {
  return {
    environment: {
      expectedKeys: [...CHILD_ENVIRONMENT_KEYS],
      actualKeys: [...CHILD_ENVIRONMENT_KEYS],
      exactAllowlist: true,
      credentialLikeKeys: [],
      disposableHome: true,
      disposableTmp: true,
      exactPath: true,
    },
    probes: {
      repoReadAllowed: true,
      operatorHomeFileReadDenied: true,
      outsideRootWriteDenied: true,
      insideRootWriteAllowed: true,
      networkListenDenied: true,
      operatorKeychainFileReadDenied: true,
      checkoutOverlayReadDeniedBySandboxCheck: true,
      keychainMachServicesDeniedBySandboxCheck: true,
      nonexistentKeychainLookupFailedWithSecuritydMachLookupDenied: true,
    },
  };
}

describe("UC-005 v2 child containment", () => {
  test("live mode fails closed when the OS sandbox is unavailable", () => {
    expect(() => assertLiveContainment("live", false))
      .toThrow("live mode requires macOS sandbox-exec containment");
    expect(() => assertLiveContainment("live", true)).not.toThrow();
    expect(() => assertLiveContainment("mock", false)).not.toThrow();
  });

  test("sandbox profile does not grant Mach lookup to agent children", () => {
    const profile = buildSandboxProfile({
      runRoot: "/private/tmp/uc005-run",
      repoRoot: "/Users/operator/code/hyper-code2",
      checkoutOverlayDir: "/Users/operator/code/hyper-code2/.hyper",
      bunExecutable: "/opt/homebrew/bin/bun",
      deniedReadRoots: ["/Users/operator", "/private/var/auth-home"],
    });

    expect(profile).not.toContain("(allow mach-lookup");
    expect(profile).toContain("(deny default)");
    expect(profile).toContain('(require-not (subpath "/Users/operator"))');
    expect(profile).toContain('(require-not (subpath "/private/var/auth-home"))');
    expect(profile).toContain('(deny file-read* (subpath "/Users/operator/code/hyper-code2/.hyper"))');
  });

  test("containment gate requires the synthetic Keychain lookup and named service denials", () => {
    expect(keychainContainmentPassed(passingReport())).toBe(true);

    const missingSyntheticProbe = passingReport();
    missingSyntheticProbe.probes.nonexistentKeychainLookupFailedWithSecuritydMachLookupDenied = false;
    expect(keychainContainmentPassed(missingSyntheticProbe)).toBe(false);

    const missingMachDenial = passingReport();
    missingMachDenial.probes.keychainMachServicesDeniedBySandboxCheck = false;
    expect(keychainContainmentPassed(missingMachDenial)).toBe(false);

    const missingOverlayDenial = passingReport();
    missingOverlayDenial.probes.checkoutOverlayReadDeniedBySandboxCheck = false;
    expect(keychainContainmentPassed(missingOverlayDenial)).toBe(false);
  });
});
