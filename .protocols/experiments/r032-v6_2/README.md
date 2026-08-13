# R-032 V6.2 clean additive author package — WIP

Status: `WIP / collectionUnauthorized`. This package is bound to source HEAD
`c4a617fce088ea5ad959e2664cab853533677ab8`, but it is deliberately not an
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

The bounded infrastructure wave added a direct `.git`/worktree-ref outer gate
without subprocesses, frozen-file hashing, minimal-env sandbox launcher,
disposable HOME/TMPDIR, connect/listen/home/outside-write/Mach-exec probes,
whole-child deadline/kill logic, stdout/stderr digests, and carrier builders for
row hashes, controls, containment/provenance/manifest artifacts and
`SHA256SUMS`. `buildCarrier` calls the same `assertSemanticResults` suite before
constructing artifacts and the writer accepts only that built object.

The package remains WIP because the following must still pass and be completed
independently reviewed together before an exact freeze exists:

- the real 37-entry `loadRoutes → match → captured fetch → POST → SQLite →
  workerLoop` collector wired to this semantic suite;
- minimal-environment parent relaunch of the complete collector, rather than
  only its contained broker child;
- a working deny-default Bun child readable allowlist. The current author
  containment test exits `134` before emitting a receipt, so the profile is not
  accepted and no freeze is honest;
- no-spawn index/worktree cleanliness parsing beyond the implemented HEAD/ref
  and frozen-file verification;
- integration of the real 144-row runtime result set and cross-candidate
  controls into the implemented carrier builder.

Author-only check:

```bash
bun .protocols/experiments/r032-v6_2/self-test.ts
bun .protocols/experiments/r032-v6_2/infra-self-test.ts
```

The semantic test passes in memory. The infrastructure test intentionally
remains failing at the sandbox profile (`exit 134`); this is a visible STOP
condition, not a waived gate. It creates only a disposable OS-temp directory,
removes it in `finally`, and writes no evidence carrier.

## Future exact review gate

Review must reject any future freeze unless it verifies all items above, proves
that collection calls `assertSemanticResults` on the full result set before its
first write, and confirms the stable carrier contains no raw sentinel value.
