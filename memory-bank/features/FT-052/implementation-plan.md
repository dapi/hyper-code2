---
title: "FT-052: Implementation Plan"
doc_kind: feature
doc_function: derived
purpose: "Grounded execution plan for FT-052 without redefining its problem or selected solution."
derived_from:
  - brief.md
  - design.md
  - ../../engineering/testing-policy.md
  - ../../engineering/git-workflow.md
status: active
audience: humans_and_agents
must_not_define:
  - ft_052_scope
  - ft_052_selected_design
  - ft_052_validation_profile
---

# FT-052: Implementation Plan

## Grounding Evidence

- Grounded repository revision: `f32969899782fd3109a0d5a0e4e2dcfc6c83756f`

| Grounding ID | Inspected path / command | Observed fact | Plan impact |
| --- | --- | --- | --- |
| `GRND-01` | `src/cli/createTuiView.entry.ts` | View renders status and owns OpenTUI keypress handling; existing `onInterrupt` callback is used for Ctrl+C. | Implement timer/status/Escape in this view. |
| `GRND-02` | `src/cli/runTui.entry.ts` | Runner owns active/stopping flags, calls `agent.stop`, and resets status after `startTurn` finally. | Reuse lifecycle; do not add a second stop path. |
| `GRND-03` | `src/cli/runTui.test.ts`, `src/cli/createTuiView.test.ts` | Deterministic renderer/input tests cover live deltas, completion, failure, interruption and disposal. | Extend nearest suites for all new acceptance cases. |
| `GRND-04` | `memory-bank/engineering/testing-policy.md`, `.github/workflows/test.yml` | Required checks are frozen-lock install, typecheck and full Bun tests; CI mirrors them. | Run targeted checks during iteration and all required checks before closure. |

## Implementation Priming

1. `src/cli/createTuiView.entry.ts` — `TuiViewOptions`, `setRunState`, `onKeypress` — refs `GRND-01`, `SOL-01`–`SOL-04`; required before `STEP-01`.
2. `src/cli/runTui.entry.ts` — `startTurn` finally and `onInterrupt` — refs `GRND-02`, `SD-02`; required before `STEP-02`.
3. `src/cli/createTuiView.test.ts` and `src/cli/runTui.test.ts` — renderer/input lifecycle tests — ref `GRND-03`; required before `STEP-03`.

## Test Strategy

| Surface | Canonical refs | Automated coverage | Commands |
| --- | --- | --- | --- |
| View status/timer | `REQ-01`, `REQ-02`, `SC-01`, `SC-02`, `CHK-01`, `CHK-02` | Captured frame plus elapsed tick while live content is present | `bun test src/cli/createTuiView.test.ts src/cli/runTui.test.ts --timeout 5000` |
| Input/lifecycle | `REQ-03`, `SC-03`, `NEG-01` | Escape active/idle behavior and stop callback/run usability | same targeted command |
| Terminal outcomes | `REQ-04`, `SC-04`, `SC-05`, `NEG-02` | completion, failure, interruption and dispose clear working status | same targeted command |
| Repository | `EC-04` | typecheck, all tests, CI test workflow | `bunx tsc --noEmit`; `bun test --timeout 5000` |

No manual-only gap is planned.

## Preconditions and Workstreams

- `PRE-01`: FT-052 brief/design are active and current; all code writes stay in the listed CLI/test paths.
- `WS-1`: implement view-local timer and Escape routing (`REQ-01`–`REQ-04`, `SOL-*`).
- `WS-2`: add deterministic rendering and lifecycle regression tests (`CHK-01`–`CHK-05`).

## Steps and Checkpoints

| Step | Goal | Touchpoints | Verifies | Evidence |
| --- | --- | --- | --- | --- |
| `STEP-01` | Add elapsed status lifecycle and Escape key dispatch | `src/cli/createTuiView.entry.ts` | `CHK-01`, `CHK-02`, `CHK-03` | `EVID-01`–`EVID-03` |
| `STEP-02` | Confirm runner lifecycle returns to idle/failure without timer residue | `src/cli/runTui.entry.ts` if needed | `CHK-04`, `CHK-05` | `EVID-04`, `EVID-05` |
| `STEP-03` | Add and run targeted regression coverage | `src/cli/createTuiView.test.ts`, `src/cli/runTui.test.ts` | all feature checks | test output / `EVID-*` |
| `STEP-04` | Run full validation and review diff | repository | `EC-04` | typecheck, test, review, CI |

- `CP-01`: targeted TUI tests green and frame/input evidence captured.
- `CP-02`: full local checks and clean implementation review on final candidate.

## Risks / Stop Conditions

- `ER-01`: OpenTUI key name differs from `escape`; verify with renderer tests before changing behavior.
- `ER-02`: timer survives disposal; assert cleanup and stop before closure.
- `STOP-01`: if implementation requires changes to agent/browser/line contracts, stop and update canonical design/routing before continuing.

## Ready for Acceptance

All `REQ-*` scenarios and negative cases have automated evidence, local required
checks are green, implementation review is clean, CI is terminal and green, and
the final diff contains no out-of-scope changes.
