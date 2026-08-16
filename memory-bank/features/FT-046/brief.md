---
title: "FT-046: Generation-Owned Runtime Lifecycle"
doc_kind: feature
doc_function: canonical
purpose: "Delivery-unit для управляемых поколений ctx.fns с атомарным reload, leases и disposal."
derived_from:
  - ../../flows/feature.md
  - ../../epics/EP-003/charter.md
  - ../../epics/EP-003/roadmap.md
  - ../../adr/ADR-002-generation-owned-runtime-lifecycle.md
  - ../../use-cases/UC-004-hot-reload-capability.md
status: active
delivery_status: in_progress
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - solution_space
---

# FT-046: Generation-Owned Runtime Lifecycle

## What

### Problem

`ctx.fns` reload already validates source stability and records provenance, но
replacement is not one lifecycle contract: namespace reload can publish entries
sequentially, removed names can remain callable, and in-flight/disposal behavior
is implicit. This leaves UC-004 and ADR-002 without executable evidence.

### Outcome

The runtime exposes a bounded managed lifecycle for loaded functions: a reload
publishes a validated set atomically, removed candidates become unavailable or
fall back on the next reload, managed calls hold generation leases, and retired
generations are disposed after quiescence. Existing direct references remain
explicitly unmanaged.

| Metric ID | Metric | Baseline | Target | Measurement method |
| --- | --- | --- | --- | --- |
| `MET-01` | Lifecycle contract scenarios | No managed lifecycle evidence | All `SC-*` and `NEG-*` pass | Bun regression tests |
| `MET-02` | Partial publication on failed namespace reload | Possible by sequential assignment | Zero observable partial publication | Atomic reload fixture |

### Scope

- `REQ-01` Stage and validate a namespace reload before publishing its function set.
- `REQ-02` Track active/retired generations and source receipts without changing durable session schema.
- `REQ-03` Provide a managed invocation boundary with per-generation leases.
- `REQ-04` Dispose retired generations after managed quiescence; record disposal failure without replacing the new active generation.
- `REQ-05` Reconcile removed names on reload: resolve base fallback when present, otherwise expose unavailable state rather than retaining a removed overlay.
- `REQ-06` Preserve existing `ctx.fns`, source provenance and SelfDescriptor semantics.

### Non-Scope

- `NS-01` No process sandbox, worker isolation or security boundary.
- `NS-02` No forced migration of every existing direct `ctx.fns` caller to managed invocation.
- `NS-03` No replacement of execution identity, action journal, cancellation policy, transcript/fork or SelfDescriptor ownership.
- `NS-04` No durable schema or persistent generation history.
- `NS-05` No marker protocol changes, provider receipts or route/script reload semantics.

## Constraints And Assumptions

- `CON-01` ADR-002 is accepted and canonical for the lifecycle boundary.
- `CON-02` Core implementation remains under `src/`; `.hyper/` is never a dependency.
- `CON-03` Managed calls use the existing procedural `(ctx, opts)` convention; direct function references are unmanaged by definition.
- `CON-04` Disposal is best-effort and observable; it cannot invalidate an already captured direct reference.

## Design Requirement Decision

| Decision | Reason | Downstream owner |
| --- | --- | --- |
| `Design required: yes` | Changes runtime state transitions, concurrency semantics and a reusable invocation boundary; ADR-002 must be realized without inventing semantics in the execution plan. | `design.md` |

## Validation Profile Decision

| Profile | Triggers / rationale | Downgrade approval |
| --- | --- | --- |
| `standard` | Runtime contract and concurrency/failure behavior change inside the existing process; no external deployment or persistent migration. | none |

## Verify

### Exit Criteria

- `EC-01` A failed namespace reload leaves the prior active set observable and does not publish a partial set.
- `EC-02` Overlay removal falls back to base or becomes unavailable; stale removed functions are not retained after accepted reload.
- `EC-03` Managed in-flight calls complete under leases; disposal occurs only after quiescence and is idempotent/observable on failure.
- `EC-04` Existing provenance/SelfDescriptor tests remain truthful and direct references are documented as unmanaged.

### Acceptance Scenarios

- `SC-01` A namespace with two functions is reloaded while the second import fails; both previous functions remain active and receipts unchanged.
- `SC-02` An overlay function is removed and reload is requested; the base function becomes effective, or the function is explicitly unavailable when no base candidate exists.
- `SC-03` A managed invocation spans a reload; the old generation is retired but not disposed until the invocation releases its lease.
- `SC-04` A retired function exposes `dispose`; it runs once after quiescence, and a disposal error is recorded without breaking the active replacement.
- `SC-05` A direct function reference captured before reload can still run; the runtime reports this as outside the managed lifecycle boundary.

### Negative Cases

- `NEG-01` A failed staging/import never partially mutates `ctx.fns`, `functionSources` or active lifecycle state.
- `NEG-02` A missing candidate is not silently represented by a stale old receipt.
- `NEG-03` Disposal failure does not roll back or remove the successfully published active generation.

### Checks And Evidence

| Check ID | Covers | How to check | Expected result | Evidence |
| --- | --- | --- | --- | --- |
| `CHK-01` | `REQ-01`, `SC-01`, `NEG-01` | `bun test src/repl/load.test.ts` | Atomic staging and existing reload regressions pass | `EVID-01` |
| `CHK-02` | `REQ-05`, `SC-02`, `NEG-02` | lifecycle/reload fixtures | Fallback/unavailable truth is explicit | `EVID-02` |
| `CHK-03` | `REQ-03..04`, `SC-03..04`, `NEG-03` | managed invocation fixtures | Lease/quiescence/disposal contract passes | `EVID-03` |
| `CHK-04` | `REQ-06`, `SC-05` | SelfDescriptor and direct-reference regression | Existing descriptor remains truthful; unmanaged limit is visible | `EVID-04` |
| `CHK-05` | all | typecheck, focused tests, full suite | Required local validation complete or blockers recorded | `EVID-05` |

### Evidence Contract

- `EVID-01` Atomic namespace reload test output.
- `EVID-02` Overlay removal/fallback and absent-name test output.
- `EVID-03` Lease, quiescence and disposal test output.
- `EVID-04` Existing loader/SelfDescriptor regression output.
- `EVID-05` Typecheck/full-suite result and any environment limitation.
