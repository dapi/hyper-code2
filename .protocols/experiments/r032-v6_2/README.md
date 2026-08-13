# R-032 V6.2 clean additive author package — WIP

Status: `WIP / collectionUnauthorized`. This package is bound to source HEAD
`7828ad9bb3f1d8084598f20cfa6738a628609cc5`, but it is deliberately not an
exact ready freeze. No V6.2 collection may run and no earlier V6/V6.1 review can
authorize it.

V6.2 starts clean rather than editing either rejected collector. The files here
freeze and self-test only the semantic contracts that must be shared verbatim by
the eventual collector:

- independently invoked callable authority roots;
- broker candidates whose parent adapter has no root callable;
- child-only callable root invocation for CAN-06/COM-03;
- actual sink adapter functions with governed R-018 forms and sanitized,
  recomputable form/sink receipts;
- a generation store whose restart recovery creates a distinct store instance
  and records pre-restart denial plus post-recovery authorization;
- one exported semantic assertion suite that author tests and collection must
  both call before any carrier write.

The package remains WIP because the following must still be implemented and
independently reviewed together before an exact freeze exists:

- the real 37-entry `loadRoutes → match → captured fetch → POST → SQLite →
  workerLoop` collector wired to this semantic suite;
- minimal-environment parent relaunch;
- deny-default child profile with an exact readable allowlist;
- disposable HOME/TMPDIR plus connect/listen/home/outside-write/Mach probes;
- captured stdout/stderr digests and enforced whole-run deadline;
- a no-spawn outer Git HEAD/index/worktree preflight before review/hash checks;
- full carrier row hashes, `SHA256SUMS`, execution/containment digests, actual
  environment receipts and cross-candidate controls.

Author-only check:

```bash
bun .protocols/experiments/r032-v6_2/self-test.ts
```

It runs in memory, writes no carrier, creates no temp directory, opens no
listener/network connection and spawns no process.

## Future exact review gate

Review must reject any future freeze unless it verifies all items above, proves
that collection calls `assertSemanticResults` on the full result set before its
first write, and confirms the stable carrier contains no raw sentinel value.
