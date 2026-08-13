## What changed

- adopted the governed Memory Bank and accepted PRD-002 for a self-extending
  agent harness;
- synchronized product, domain and use-case traceability, including explicit
  goals for reflection, sleep and context consolidation;
- created EP-001 and triaged the pre-PRD GitHub backlog into evidence-led
  research, bug-fix and future-delivery routes;
- added reproducible UC-005, secret-transit and network-authority instruments
  with sanitized, checksummed evidence carriers;
- routed the next evidence wave into R-031/R-032/R-033 and preserved the
  immutable-fork blocker as research #34 instead of inventing a storage fix.

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
  processes. This is not live/model evidence.
- R-032 frames a symmetric comparison of network authority target contracts,
  explicitly separating reachability, caller authority and residual process
  authority. Collection has not started and no mechanism is selected.
- R-033 has an independently reviewed source/authority inventory and a frozen
  14-cell candidate matrix covering provider refresh, model discovery, root
  context, settings, arbitrary DB access and shared-process file/shell/keychain
  authority. Candidate prototype evidence has not been collected.
- Issue #27 remains open: Bug Fix Flow proved that any correct fix selects a
  new persistent-data contract. Research #34 owns that prerequisite; #28 owns
  historical migration. No storage design or runtime fix is included here.

## Boundaries

- no production runtime code is changed by the corrective evidence batch;
- no security, capability-surface or persistence mechanism is selected;
- TUI remains a supporting option, while multi-user/team workflow stays future
  scope;
- next-wave research remains `collecting`; live/model runs, candidate security
  prototypes, owner dispositions and any architecture/delivery handoffs remain
  separately gated.

## Validation

- `bunx tsc --noEmit`
- `bun test --timeout 5000` — 408 passed, 3 skipped, 0 failed
- `bun test ./.protocols/experiments/r018-sentinel.test.ts` — 11 passed
- `bun test ./.protocols/experiments/r031-offline-comparison.test.ts` — 2 passed,
  37 assertions
- deterministic R-029 static/mock replay — passed
- all checked-in evidence-carrier checksums, including R-031 — passed
- `memory-bank-cli lint` — passed
- `memory-bank-cli doctor` — 0 errors; known CI-gate and deep-navigation warnings
- `git diff --check`
