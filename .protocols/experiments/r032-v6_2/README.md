# R-032 V6.2 clean additive author package — WIP

Status: `WIP / collectionUnauthorized`. This package is bound to source HEAD
`c02b9ece0a1404d84428a2dce0a91599f954e83e`, but it is deliberately not an
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
- a working deny-default Bun child readable allowlist. Canonicalizing disposable
  `/var` paths to `/private/var` did not fix the current author containment
  test: it exits `134` before emitting a receipt even when all probes are
  disabled. Diagnostic broad `file-read*` starts the child, proving an
  unenumerated Bun startup/import read remains; that profile is rejected because
  it would expose operator-home/credential and unrelated paths. The checked-in
  WIP profile itself still has repo-wide reads plus broad `process*` and
  `mach-lookup`; those are explicitly rejected placeholders, not accepted
  limitations or a collection boundary;
- no-spawn index/worktree cleanliness parsing beyond the implemented HEAD/ref
  and frozen-file verification;
- a result-derived validator over the real 144-row (9 candidates × 16 labels)
  runtime result set, including both broker-root ownership paths and
  cross-candidate controls. The fixture suite is detached from runtime rows;
  `buildCarrier` now rejects any other row count but does not misstate that
  count as semantic validation.

Author-only check:

```bash
bun .protocols/experiments/r032-v6_2/self-test.ts
bun .protocols/experiments/r032-v6_2/infra-self-test.ts
```

The detached semantic test passes in memory. The infrastructure test intentionally
remains failing at the sandbox profile (`exit 134`); this is a visible STOP
condition, not a waived gate. It creates only a disposable OS-temp directory,
removes it in `finally`, and writes no evidence carrier.

## Future exact review gate

Review must reject any future freeze unless it verifies all items above, proves
that collection calls a result-derived validator on all 144 runtime rows before
its first write, and confirms the stable carrier contains no raw sentinel value.
Calling the detached fixture-only `assertSemanticResults` is insufficient.
