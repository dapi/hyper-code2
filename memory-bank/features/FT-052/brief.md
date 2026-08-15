---
title: "FT-052: Codex-style TUI working status"
doc_kind: feature
doc_function: canonical
purpose: "Canonical problem-space contract for showing active TUI work, elapsed time and Escape interruption."
derived_from:
  - ../../flows/feature.md
  - ../../engineering/validation-profiles.md
  - ../../engineering/testing-policy.md
status: active
delivery_status: in_progress
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - solution_space
---

# FT-052: Codex-style TUI working status

## What

### Problem

An active TUI turn currently exposes live transcript content but does not give
the operator a compact, time-aware indication that work is in progress or a
discoverable Escape shortcut for the existing stop action.

### Outcome

| Metric ID | Metric | Baseline | Target | Measurement method |
| --- | --- | --- | --- | --- |
| `MET-01` | Active-run visibility | Status only says `running` | Active TUI status includes `Working`, whole elapsed seconds and `esc to interrupt` | Captured renderer frames and lifecycle tests |
| `MET-02` | Interrupt discoverability | Stop is only exposed through Ctrl+C | Escape is handled during an active run and returns to usable idle state | Input and run lifecycle tests |

### Scope

- `REQ-01` During an active TUI turn, render a working status with whole elapsed seconds and the `esc to interrupt` hint.
- `REQ-02` Advance elapsed time once per second without blocking live deltas or durable reconciliation.
- `REQ-03` Treat Escape as an interrupt request only while a turn is active; do not submit text or exit the TUI in that state.
- `REQ-04` Restore the established idle or failure status after completion, failure, or interruption, while preserving existing TUI, line-client and browser behavior.

### Non-Scope

- `NS-01` Changes to the line client, browser UI, agent stop semantics, or durable event schema.
- `NS-02` New keymap configuration, animations, sub-second precision, or a redesign of the TUI layout.

### Constraints / Assumptions

- `ASM-01` `runTui` remains the owner of active-turn and stop lifecycle; the view owns presentation timing and input dispatch.
- `CON-01` Bun/OpenTUI test conventions and deterministic mock providers remain required.
- `CON-02` Existing live assistant/thinking deltas and durable event reconciliation remain authoritative and unchanged.

## Design Requirement Decision

| Decision | Reason | Downstream owner |
| --- | --- | --- |
| `Design required: yes` | This changes a user-visible terminal interaction, timer lifecycle and active-input semantics across the TUI runner/view boundary. | [`design.md`](design.md) |

## Artifact Routing Decision

| Artifact | Decision | Trigger / reason | Route / owner |
| --- | --- | --- | --- |
| `design.md` | selected | TUI input and asynchronous status lifecycle cross the runner/view boundary | [`design.md`](design.md) |
| UI reference / separate contract | omitted | Existing captured TUI frames and compact local behavior are sufficient | none |

## Validation Profile Decision

| Profile | Triggers / rationale | Downgrade approval |
| --- | --- | --- |
| `standard` | Executable user-visible CLI behavior and asynchronous interaction change; no production action, schema migration, security boundary or release/deployment trigger. | `none` |

## Verify

### Exit Criteria

- `EC-01` Active TUI frames visibly contain `Working`, elapsed seconds and `esc to interrupt`, with elapsed values increasing once per second.
- `EC-02` Escape interrupts an active turn without submitting text or exiting; completion, failure and interruption restore a usable non-working status.
- `EC-03` Live/durable rendering remains intact and line-client/browser behavior is unchanged.
- `EC-04` Required targeted and full local checks pass, followed by clean implementation review and required CI.

### Traceability matrix

| Requirement ID | Acceptance refs | Checks | Evidence IDs |
| --- | --- | --- | --- |
| `REQ-01`, `REQ-02` | `EC-01`, `SC-01`, `SC-02` | `CHK-01`, `CHK-02` | `EVID-01`, `EVID-02` |
| `REQ-03` | `EC-02`, `SC-03`, `NEG-01` | `CHK-03` | `EVID-03` |
| `REQ-04` | `EC-02`, `EC-03`, `SC-04`, `SC-05`, `NEG-02` | `CHK-04`, `CHK-05` | `EVID-04`, `EVID-05` |

### Acceptance Scenarios

#### SC-01: Show active work

- Rule refs: `REQ-01`
- Given: the TUI has an active turn
- When: a frame is rendered
- Then: the status contains `Working`, whole seconds and `esc to interrupt`
- Checks: `CHK-01`

#### SC-02: Advance elapsed time without blocking

- Rule refs: `REQ-02`
- Given: a turn remains active while live deltas are emitted
- When: at least one second elapses
- Then: the status seconds increase and live content remains visible
- Checks: `CHK-02`

#### SC-03: Escape interrupts active work

- Rule refs: `REQ-03`
- Given: an active turn and composer text
- When: the operator presses Escape
- Then: the existing stop action is requested, no submission occurs, and the TUI remains open
- Checks: `CHK-03`

#### SC-04: Completion restores idle

- Rule refs: `REQ-04`
- Given: an active turn completes normally
- When: the durable result is reconciled
- Then: the working indicator disappears and idle status is shown
- Checks: `CHK-04`

#### SC-05: Failure or interruption restores non-working state

- Rule refs: `REQ-04`
- Given: an active turn fails or is interrupted
- When: the run reaches its terminal state
- Then: the timer is stopped and the existing failure/idle presentation remains usable
- Checks: `CHK-05`

### Negative / Edge Scenarios

#### NEG-01: Escape while idle exits as before

- Rule refs: `REQ-03`, `NS-01`
- Given: no turn is active
- When: Escape is pressed
- Then: existing idle interrupt/exit behavior is preserved
- Checks: `CHK-03`

#### NEG-02: Timer cleanup on every terminal path

- Rule refs: `REQ-04`
- Given: running, stopping, completed and failed lifecycle paths
- When: each path reaches its terminal state or the view is disposed
- Then: no timer continues updating a disposed view
- Checks: `CHK-05`

### Checks and Evidence

| Check ID | Covers | How to check | Expected result | Evidence ID |
| --- | --- | --- | --- | --- |
| `CHK-01` | `SC-01` | Targeted view render test | Working status text is present | `EVID-01` |
| `CHK-02` | `SC-02` | Timer lifecycle test with delayed turn | Seconds increase while live frame remains responsive | `EVID-02` |
| `CHK-03` | `SC-03`, `NEG-01` | Input/runTui tests | Active Escape stops only; idle behavior remains established | `EVID-03` |
| `CHK-04` | `SC-04` | Completion test | Status returns to idle and timer stops | `EVID-04` |
| `CHK-05` | `SC-05`, `NEG-02` | Failure/interruption/dispose tests | Failure/idle state is usable and no stale timer updates | `EVID-05` |

Evidence is the targeted test output, full local check output, CI result and
implementation review record attached to the issue/PR and Run Ledger.
