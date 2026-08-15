---
title: "FT-052: Design"
doc_kind: feature
doc_function: canonical
purpose: "Solution-space design for the TUI working status timer and Escape input routing."
derived_from:
  - brief.md
  - ../../features/FT-009/design.md
status: active
audience: humans_and_agents
must_not_define:
  - ft_052_scope
  - ft_052_acceptance_criteria
  - implementation_sequence
---

# FT-052: Design

## Design Pack

| Artifact | Relation | Direct canonical ownership | Readiness |
| --- | --- | --- | --- |
| `design.md` | `root` | `SOL-*`, `SD-*`, `C4-*`, `INV-*`, `FM-*` below | active |
| `../../features/FT-009/design.md` | `external-dependency` | Existing TUI architecture and lifecycle seam | active |

## C4 Applicability and Architecture Coverage

| C4 ID | Decision | Reason |
| --- | --- | --- |
| `C4-01` | `C3` component boundary | Existing runner/view boundary gains a timer and key branch; no new process, storage or network component. |

Components, connectors, configuration, behavioral semantics and quality/evolution
concerns are covered by `FT-009`'s C3 view and the local decisions below. Physical
view is `N/A`: line/browser/runtime topology is unchanged.

## Selected Solution

- `SOL-01` The view starts a wall-clock elapsed counter when `setRunState('running')` is called, refreshes it once per second, and clears it on any non-running state or `dispose`.
- `SOL-02` While running, the status text is `◦ Working (Ns • esc to interrupt)`; stopping/completion/failure use the existing status family and never retain the timer hint.
- `SOL-03` The view maps the OpenTUI `escape` key to the existing `onInterrupt` callback. `runTui` already distinguishes active from idle, so only active Escape requests stop; idle Escape retains established exit behavior.
- `SOL-04` Timer callbacks only mutate the status renderable and request a render; they do not touch live/durable transcript state or await work.

## Accepted Decisions and Invariants

- `SD-01` Whole seconds are calculated from `Date.now()` relative to the running state start, avoiding interval drift; display starts at `0s`.
- `SD-02` Timer ownership is view-local and one timer exists per view; terminal lifecycle remains runner-owned.
- `INV-01` No timer callback may update a disposed view.
- `INV-02` Escape is never converted into composer submission while an active turn exists.
- `FM-01` Completion, failure, interruption and renderer disposal all clear the interval; stale callbacks are harmless and cannot keep the process alive.

## 4+1 Viewpoint / Correspondence

| View | Status | Refs |
| --- | --- | --- |
| Logical | covered | `REQ-01`–`REQ-04`, `SC-01`–`SC-05` |
| Process | covered | `SOL-01`–`SOL-04`, `SD-01`–`SD-02`, `INV-01`–`INV-02`, `FM-01` |
| Development | covered | `src/cli/createTuiView.entry.ts`, `src/cli/runTui.entry.ts`, nearest tests |
| Physical | N/A | `CON-01`, `NS-01` |
| Scenarios (+1) | covered | `SC-*`, `NEG-*`, `CHK-*` in `brief.md` |

Each scenario maps to `REQ-*` in `brief.md`, the affected view/runner symbols,
and the corresponding `CHK-*`; no new API, event, schema, or browser contract is
introduced.

## Design Verification

| Analysis | Required | Method | Result / evidence |
| --- | --- | --- | --- |
| Contract compatibility | yes | Preserve `TuiView` callback contract and existing status states | No line/browser/API changes; targeted tests |
| State/transition completeness | yes | Exercise running, stopping, idle, failed and dispose | `CHK-03`–`CHK-05` |
| Failure propagation | yes | Delayed rejection and renderer cleanup tests | Existing failure tests plus new timer cleanup coverage |
| Concurrency/ordering | yes | Delayed live stream while timer ticks | `CHK-02` |
| Security boundary | no | No authority or trust change | `NS-01`, `NS-02` |
| Capacity/latency | no | One lightweight interval per active TUI | `SOL-04` |
| Migration/evolution | no | No persisted or external contract | `NS-01` |
