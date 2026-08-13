## What changed

- adopted the governed Memory Bank and accepted PRD-002 for a self-extending
  agent harness;
- synchronized product, domain and use-case traceability, including explicit
  goals for reflection, sleep and context consolidation;
- created EP-001 and triaged the pre-PRD GitHub backlog into evidence-led
  research, bug-fix and future-delivery routes;
- added reproducible UC-005, secret-transit and network-authority instruments
  with sanitized, checksummed evidence carriers;
- routed the next evidence wave into R-031/R-032/R-033/R-034 and preserved the
  immutable-fork blocker instead of inventing a storage fix;
- added the separately governed EP-002 inspectable/bounded self-evolution
  initiative, validated R-035/R-036 contracts, and delivered FT-036's read-only
  `self.describe` plus loopback JSON surface without adding mutation authority.

## Why

The previous issue backlog mixed product outcomes with unaccepted architecture.
This change establishes an authoritative product contract first, then records
what the current runtime actually demonstrates before selecting implementation
mechanisms.

## Current evidence

- R-001 is terminal `inconclusive`: the tested runtime/model did not confirm
  retention/reuse under either fixed contract, and the unrun families require a
  separately routed changed contract rather than expansion of this cycle.
- R-018 reproduces deterministic synthetic secret transit to sampled persisted,
  rendered and model-bound sinks. Its immutable `-03` carrier corrects the
  earlier containment gap with named keychain/Mach controls; independent review
  signed off the bounded finding, now terminal `validated` without a mechanism.
- R-029 independently reconciles all 36 committed-source dispatch entries and
  108 dispatcher identity cases. Review signed off the bounded caller-control
  gap, now terminal `validated`; `.hyper`, middleware and interface reachability
  remain excluded.
- R-031 now has an independently reviewed offline symmetry control for four
  versioned discovery/retention variants over the same ordinary callables. V3
  crosses an explicit descriptor adapter, all variants retain ordinary
  composition, and 12 positive plus 12 false-success cases pass in fresh
  processes. A second reviewed mock boundary-envelope proves context symmetry
  and five named denied probes, but explicitly remains non-live because wider
  Bun process/read, Mach, full-agent and credential-boundary gaps remain.
- R-032 frames a symmetric comparison of network authority target contracts,
  explicitly separating reachability, caller authority and residual process
  authority. Its first two carriers are downgraded; corrected v3 is accepted
  only as bounded executable evidence for partial G1/G2/G5/G7 observations.
  V4 adds experiment-local lifecycle traces. V5 then executes the committed
  loader, matcher and captured dispatch over 36 entries, but authority policy,
  arbitrary overlays, real reachability, persistent restart and process
  separation remain open.
- R-033 has an independently reviewed source/authority inventory and a frozen
  14-cell candidate matrix covering provider refresh, model discovery, root
  context, settings, arbitrary DB access and shared-process file/shell/keychain
  authority. Earlier attempts are downgraded or rejected. Corrected V5.2 passed
  exact-freeze pre-review, one contained 70-row collection and independent
  post-review. Danil accepted the supported non-terminal direction:
  redaction-only is excluded as the standalone boundary and retained as defense
  in depth. R-033 remains synthesizing because no choice is made among
  `CAND-01/02/03/05`.
- Issue #27 remains open: Bug Fix Flow proved that any correct fix selects a
  new persistent-data contract. R-034 V3 establishes bounded feasibility for a
  constant-size immutable revision reference and a structural-sharing COW
  graph across W1-W5. Operability, reachability/orphans, concurrency, GC,
  faults, migration and production performance remain unresolved. #28 owns
  historical migration; no storage design or runtime fix is included here.
- EP-002 is in Execution after FT-036 delivered a source-grounded SelfDescriptor,
  effective-origin loader receipts and a loopback-only `GET /self` JSON route.
  The mutation ledger, activation/rollback and reflection slices remain
  separately gated; R-032 remains the owner of network-to-process authority.

## Boundaries

- FT-036 changes runtime code only for the delivered read-only SelfDescriptor,
  loader provenance receipts and loopback JSON route; it adds no mutation,
  credential, non-local exposure or production-deployment authority;
- no security, capability-surface or persistence mechanism is selected;
- TUI remains a supporting option, while multi-user/team workflow stays future
  scope;
- R-032 is terminal `inconclusive` for mechanism selection after an FPF
  scoped-claim review; its mechanism-neutral target contract is promoted.
  R-034 remains `collecting`, and R-033 has only a partial owner disposition.
  Live/model runs and architecture/delivery handoffs remain separately gated.

## Validation

- `bunx tsc --noEmit`
- `bun test --timeout 5000` — 414 passed, 3 skipped, 0 failed
- `bun test ./.protocols/experiments/r018-sentinel.test.ts` — 11 passed
- `bun test ./.protocols/experiments/r031-offline-comparison.test.ts` — 2 passed,
  37 assertions
- R-031 boundary, R-032 and R-033 experiment suites — passed; rejected and
  downgraded carriers remain labeled non-conforming evidence
- deterministic R-029 static/mock replay — passed
- all checked-in evidence-carrier checksums, including R-031 — passed
- `memory-bank-cli lint` — passed
- `memory-bank-cli doctor` — 0 errors; known CI-gate and deep-navigation warnings
- `git diff --check`
