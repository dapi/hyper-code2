# R-018 Keychain-Contained Carrier Independent Review

Date: 2026-08-13

Reviewer: separate Codex review agent

Reviewed carrier: `20260813-keychain-contained-static-mock-03`

## Sign-off

Signed off for the named experimental containment controls and the sampled
secret-transit finding.

The review verified:

- deny-default profile with no `mach-lookup` allowance;
- reads limited to Bun, repository and disposable root, and writes limited to
  the disposable root;
- matching profile, manifest, containment and instrument hashes;
- denied `com.apple.securityd` and `com.apple.securityd.xpc` policy probes;
- denied direct read of the operator login keychain path;
- failed deterministic nonexistent service/account lookup while named Mach
  denials were active;
- exact six-key child environment, disposable HOME/TMPDIR and no provider-auth
  environment material;
- strict containment sequence 1, detector controls sequence 2 and injection
  sequence 3;
- valid carrier checksums and unchanged earlier carriers.

This is bounded to the recorded macOS platform, profile, named services and
path. It does not prove denial of every credential store or choose a production
isolation or non-transit mechanism.
