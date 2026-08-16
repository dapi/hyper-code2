---
title: "ADR-002: Generation-Owned Runtime Lifecycle"
doc_kind: adr
doc_function: canonical
purpose: "Defines the bounded lifecycle contract for reversible runtime-loaded ctx.fns behavior."
derived_from:
  - ../research/R-043/decision.md
  - ../epics/EP-003/charter.md
  - ../use-cases/UC-004-hot-reload-capability.md
  - ../engineering/architecture.md
status: active
decision_status: accepted
date: 2026-08-15
decision_makers:
  - Danil Pismenny
consulted:
  - Codex
informed: []
audience: humans_and_agents
must_not_define:
  - current_system_state
  - implementation_plan
---

# ADR-002: Generation-Owned Runtime Lifecycle

## Context

EP-003 requires reversible runtime extension effects with truthful replacement,
removal/fallback, partial-failure, quiescence and teardown semantics. The current
loader already validates source bytes/version and records function provenance, but
registry assignment is not a lifecycle owner: it does not reconcile removed names,
coordinate namespace publication, track managed in-flight calls or dispose a
retired generation. Direct function values captured by callers cannot be revoked
by replacing a registry property.

## Decision Boundaries

- Applies to runtime-loaded `ctx.fns` function generations and their managed invocation boundary.
- Applies to replacement, removal/fallback, staged publication, quiescence, disposal and lifecycle evidence.
- Does not replace execution identity, action journal, budgets/depth, transcript/fork, SelfDescriptor or security-boundary ownership.
- Does not claim to sandbox the process or revoke direct captured references.

## Decision Drivers

1. Preserve `ctx.fns`, Bun-first procedural composition and existing marker/runtime contracts.
2. Make replacement and removal semantics explicit and observable.
3. Prevent partial namespace publication on reload failure.
4. Avoid disposing a retired generation while a managed call still uses it.
5. Keep SelfDescriptor read-only and truthful.
6. Avoid a wholesale plugin/process isolation framework.

## Considered Options

| Option | Benefits | Costs | Disposition |
| --- | --- | --- | --- |
| `A-01` Replacement-only loader | Minimal change; preserves current behavior | No removal reconciliation, quiescence or teardown contract | Rejected: insufficient for EP-003 |
| `A-02` Generation-owned registry with staged publication, managed leases, quiescence and explicit disposal | Covers the required bounded lifecycle while preserving current runtime shape | Requires a lifecycle boundary and adversarial fixtures; captured references remain unmanaged | Selected |
| `A-03` Worker/process isolation per extension | Stronger reference isolation and teardown | Changes the runtime model, adds operational complexity and exceeds EP-003 scope | Rejected: separate security/isolation initiative |

## Decision

Adopt `A-02` as the lifecycle contract for `ctx.fns`:

- one logical function name has at most one active managed generation;
- reload stages and validates a replacement set before publishing it;
- new managed calls resolve through the active generation;
- managed in-flight calls hold leases and may finish under the existing execution/cancellation owner;
- a retired generation is disposed only after managed quiescence, with idempotent/best-effort disposal and observable failure;
- a removed overlay falls back to an existing base candidate on the next accepted reload; a name with no candidate becomes explicitly unavailable;
- direct references captured before replacement are uncontained and are not claimed to be revoked;
- `self.describe` reports lifecycle/source truth but does not own revocation or disposal.

This is a bounded in-process lifecycle contract, not an adversarial containment
or authority boundary.

## Consequences

### Positive

- Reload behavior has an explicit owner and generation model.
- Namespace reload can preserve the prior active generation when staging fails.
- In-flight behavior and teardown become testable rather than implicit.
- SelfDescriptor can remain a separate observation surface.

### Negative

- The managed invocation boundary must be adopted by callers that require lifecycle guarantees.
- Disposal hooks and lease bookkeeping add runtime complexity.
- Captured direct references can continue to execute after registry replacement.

### Neutral / Organizational

- Execution/action/transcript/security owners remain authoritative for their contracts.
- Feature delivery must provide removal/fallback, partial-failure, concurrent-call and disposal fixtures.
- Any stronger isolation requirement must be separately routed.

## Risks And Mitigation

- Lease leaks could prevent disposal: add timeout/diagnostic evidence and bounded failure handling.
- A caller may bypass the managed boundary: label the call uncontained and do not overstate guarantees.
- Disposal may fail: preserve the new active generation, record failure, and make retry policy explicit in the feature contract.
- Loader/source drift could invalidate provenance: retain current source version/hash checks and SelfDescriptor fail-closed behavior.

## Confirmation

- Owner: FT-046 implementation and reviewers.
- Evidence: focused tests for staged namespace failure, removed overlay/base fallback, absent-name unavailability, managed in-flight lease/quiescence, idempotent disposal and disposal failure; SelfDescriptor regression tests; full Bun suite after dependency restoration.
- Evidence location: FT-046 Feature Flow package and its delivery verification record.

## Reconsideration Conditions

Reconsider or supersede this ADR if managed callers cannot be adopted without
breaking existing runtime contracts, if lease/disposal overhead is unacceptable,
or if the system requires actual reference isolation or adversarial containment.

## Follow-up

- [R-043](../research/R-043/README.md) records the evidence and decision rationale.
- EP-003 W2 / #46 must be routed through Feature Flow before implementation.
- `self.describe` remains the canonical read-only descriptor owner.

## Related Links

- [EP-003 roadmap](../epics/EP-003/roadmap.md)
- [UC-004 Hot-Reload](../use-cases/UC-004-hot-reload-capability.md)
