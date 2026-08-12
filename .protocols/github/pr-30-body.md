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

- UC-005 instrument v2 proves the macOS experiment boundary and honest
  failure reporting, but the repeated live task did not retain a reusable
  capability; the remaining task families are stopped for owner review.
- R-018 has provisional evidence that a deterministic synthetic declared-secret
  value can reach sampled sinks. The collector missed the plan's OS-containment
  preconditions, so the cycle remains open.
- R-029 inventories 36 committed-source dispatch entries and exercises 11
  representative mocks. Complete route/control reconciliation and independent
  review remain pending; no socket was opened.
- Issue #27 has a separate failing regression reproduction for mutable fork
  inheritance; no storage design or runtime fix is included here.

## Boundaries

- no production runtime code is changed by the corrective evidence batch;
- no security, capability-surface or persistence mechanism is selected;
- TUI remains a supporting option, while multi-user/team workflow stays future
  scope;
- R-001, R-018 and R-029 still require explicit owner dispositions before
  delivery handoffs.

## Validation

- `bunx tsc --noEmit`
- `bun test --timeout 5000` — 408 passed, 3 skipped, 0 failed
- `bun test ./.protocols/experiments/r018-sentinel.test.ts` — 11 passed
- deterministic R-029 static/mock replay — passed
- all checked-in evidence-carrier checksums — passed
- `memory-bank-cli lint` — passed
- `memory-bank-cli doctor` — 0 errors; known CI-gate and deep-navigation warnings
- `git diff --check`
