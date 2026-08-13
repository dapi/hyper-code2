## What changed

- adopted the governed Memory Bank and accepted PRD-002 for a self-extending
  agent harness;
- synchronized product, domain and use-case traceability, including explicit
  goals for reflection, sleep and context consolidation;
- created EP-001 and triaged the pre-PRD GitHub backlog into evidence-led
  research, bug-fix and future-delivery routes;
- added reproducible UC-005, secret-transit and network-authority instruments
  with sanitized, checksummed evidence carriers.

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
- Issue #27 has a separate failing regression reproduction for mutable fork
  inheritance; no storage design or runtime fix is included here.

## Boundaries

- no production runtime code is changed by the corrective evidence batch;
- no security, capability-surface or persistence mechanism is selected;
- TUI remains a supporting option, while multi-user/team workflow stays future
  scope;
- all three owner dispositions are recorded; any delivery handoff, target
  contract comparison or architecture choice still requires separate routing
  and approval.

## Validation

- `bunx tsc --noEmit`
- `bun test --timeout 5000` — 408 passed, 3 skipped, 0 failed
- `bun test ./.protocols/experiments/r018-sentinel.test.ts` — 11 passed
- deterministic R-029 static/mock replay — passed
- all checked-in evidence-carrier checksums — passed
- `memory-bank-cli lint` — passed
- `memory-bank-cli doctor` — 0 errors; known CI-gate and deep-navigation warnings
- `git diff --check`
