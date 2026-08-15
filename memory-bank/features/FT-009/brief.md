---
title: "FT-009: TUI MVP"
doc_kind: feature
doc_function: canonical
purpose: "Canonical problem and verification contract for a usable single-agent full-screen hcode TUI."
derived_from:
  - ../../flows/feature.md
  - ../../prd/PRD-002-self-extending-agent-harness.md
  - ../../product/vision.md
  - ../../domain/events.md
  - ../../domain/rules.md
  - ../../use-cases/UC-001-run-agent-task.md
status: active
delivery_status: done
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - solution_space
---

# FT-009: TUI MVP

## What

### Problem

The repository now ships a workspace-scoped `hcode` terminal client, but its
interactive surface is a sequential `readline` prompt. Provider output is only
shown after durable completion, input and output compete for the same terminal
lines, and the operator cannot inspect a stable conversation viewport while a
turn is running. The result is useful as a CLI preview but not a normal coding
agent TUI.

### Outcome

| Metric ID | Metric | Baseline | Target | Measurement method |
| --- | --- | --- | --- | --- |
| `MET-01` | Incremental visibility | Assistant/thinking text appears only after the provider finishes | A deterministic delayed provider visibly updates the active response before completion | TUI integration fixture with captured frames |
| `MET-02` | Terminal lifecycle integrity | Line mode does not own alternate-screen/raw-mode state | Every success, cancellation, signal, and renderer-failure fixture restores the parent terminal exactly once | Terminal-driver tests plus PTY smoke |
| `MET-03` | Interactive usability | One-line prompt with interleaved output | Stable conversation viewport, multiline composer, scrollback, status, and resize behavior in one TTY | Deterministic renderer/input tests and PTY smoke |

### Scope

- `REQ-01` In an interactive TTY, ordinary `hcode` starts a full-screen single-agent interface with a stable conversation viewport, multiline composer, scrollback, and a status area showing workspace, model, run state, and trusted execution mode.
- `REQ-02` Assistant and thinking deltas become visible before provider completion while final durable conversation events remain the authority after completion.
- `REQ-03` The interface renders operator messages, assistant/thinking output, marker/tool lifecycle, failures, and the existing browser-only HTML fallback without silently discarding activity.
- `REQ-04` The operator can submit multiline input, scroll through history, resize the terminal, cancel an active turn with `Ctrl+C`, and exit through a documented explicit control without corrupting durable input.
- `REQ-05` Whenever the TUI adapter exits—normally, after cancellation, after bootstrap/renderer failure, or because of process `SIGINT`/`SIGTERM`—it restores cursor visibility and terminal modes; active-turn cancellation alone leaves the TUI usable, and redirected/non-TTY operation retains line behavior.
- `REQ-06` The interface continuously and unmistakably identifies `TRUSTED MODE — unrestricted agent execution`; workspace scoping is never presented as containment.
- `REQ-07` Browser mode and the existing SQLite conversation/action invariants remain compatible.

### Non-Scope

- `NS-01` Session chooser, resume, fork/archive management, search, multiple active agents, configurable keymaps, or a complete command palette.
- `NS-02` Interactive child-process PTY handoff, streamed shell stdout/stderr production, or a shared ProcessRunner.
- `NS-03` Approval/diff workflows, OS sandboxing, or any new security claim.
- `NS-04` Semantic parity for arbitrary agent-authored HTML or a general structured UI protocol.
- `NS-05` Full durable replay/backpressure infrastructure, execution journal, or closure of the complete GitHub #5/#22 contracts beyond the minimum client-neutral events required by this delivery unit.

### Constraints / Assumptions

- `ASM-01` The MVP serves one newly created CLI agent in one process and one canonical workspace.
- `CON-01` Bun remains the runtime and the ordinary test suite remains deterministic and offline with `mock:*` providers.
- `CON-02` Durable messages/events are the final snapshot authority; ephemeral deltas may improve presentation but cannot rewrite the durable result.
- `CON-03` The TUI must not require HTTP or bind a socket.
- `CON-04` Existing trusted-local process authority remains unchanged and must be visible to the operator.
- `CON-05` The public executable remains `hcode`; stale `hyper`/`hypercode` names in open tracker text do not define this feature.

## Design Requirement Decision

| Decision | Reason | Downstream owner |
| --- | --- | --- |
| `Design required: yes` | The feature changes terminal interaction, event delivery, cancellation, and runtime adapter boundaries and requires a toolkit trade-off | Design pack with root [`design.md`](design.md) |

## Artifact Routing Decision

| Artifact | Decision | Trigger / reason | Route / owner |
| --- | --- | --- | --- |
| `design.md` | selected | Cross-component TUI, runtime-event, and terminal-lifecycle decisions | Planned sibling `design.md` |
| `ui-reference/README.md` | omitted | The compact terminal layout can be accepted through scenarios and captured test frames | `none` |
| separate event contract | omitted | The MVP event vocabulary is small enough to remain in the root design | `none` |

## Validation Profile Decision

| Profile | Triggers / rationale | Downgrade approval |
| --- | --- | --- |
| `standard` | User-visible CLI behavior, event delivery, cancellation, and terminal state change; no production action, migration, or new authority boundary | `none` |

## Verify

### Exit Criteria

- `EC-01` An interactive `hcode` run displays a stable full-screen conversation and incremental response while accepting multiline input without HTTP.
- `EC-02` Tool activity, failures, workspace/model/run status, and trusted mode remain observable.
- `EC-03` Every supported exit/error path restores the parent terminal and preserves durable accepted input.
- `EC-04` Non-TTY and browser paths remain compatible, and canonical type-check/tests are green.

### Traceability Matrix

| Requirement ID | Problem refs | Acceptance refs | Checks | Evidence IDs |
| --- | --- | --- | --- | --- |
| `REQ-01`, `REQ-06` | `MET-03`, `ASM-01`, `CON-04` | `EC-01`, `EC-02`, `SC-01`, `SC-02` | `CHK-01` | `EVID-01` |
| `REQ-02` | `MET-01`, `CON-02` | `EC-01`, `SC-03`, `SC-04` | `CHK-02` | `EVID-02` |
| `REQ-03` | `CON-04` | `EC-02`, `SC-03`, `SC-04`, `SC-05`, `SC-06` | `CHK-01`, `CHK-02` | `EVID-01`, `EVID-02` |
| `REQ-04` | `MET-03` | `EC-01`, `SC-06`, `SC-07`, `SC-08`, `SC-09`, `SC-10`, `NEG-02` | `CHK-01`, `CHK-03` | `EVID-01`, `EVID-03` |
| `REQ-05` | `MET-02` | `EC-03`, `SC-07`, `SC-09`, `SC-10`, `NEG-01`, `NEG-02`, `NEG-03`, `NEG-04`, `NEG-05`, `NEG-07`, `NEG-08` | `CHK-03`, `CHK-04` | `EVID-03`, `EVID-04` |
| `REQ-07` | `CON-02`, `CON-03` | `EC-04`, `NEG-04`, `NEG-05`, `NEG-06` | `CHK-04` | `EVID-04` |

### Acceptance Scenarios

#### SC-01: Open a stable terminal workspace

- Rule refs: `UC-001`, `REQ-01`, `REQ-06`
- Given: an interactive terminal and a valid workspace using a deterministic model
- When: the operator starts `hcode`
- Then: a stable full-screen conversation, multiline composer, workspace/model/run status, and permanent trusted-mode warning are visible
- Checks: `CHK-01`

#### SC-02: Retain the trusted-mode warning during interaction

- Rule refs: `REQ-01`, `REQ-06`
- Given: an open interactive TUI
- When: the operator enters one character in the composer
- Then: `TRUSTED MODE — unrestricted agent execution` remains visible in the rendered frame
- Checks: `CHK-01`

#### SC-03: Observe a response while it is produced

- Rule refs: `REQ-02`, `REQ-03`
- Given: a provider fixture that pauses between thinking and assistant deltas
- When: the provider emits the next live delta
- Then: the matching labelled thinking or assistant projection updates before provider completion
- Checks: `CHK-02`

#### SC-04: Reconcile a completed live model call

- Rule refs: `REQ-02`, `REQ-03`
- Given: a live preview and the parsed durable effects for its model call
- When: the call emits `model_call_finished`
- Then: durable thinking, assistant, tool, and failure events replace the live projection in order with exact final text and no duplicated prefix
- Checks: `CHK-02`

#### SC-05: Show a browser-only HTML response explicitly

- Rule refs: `REQ-03`
- Given: an open TUI with a durable assistant event containing HTML but no plain text
- When: the durable event is refreshed into the conversation
- Then: the conversation shows the explicit browser-only HTML fallback instead of an empty response
- Checks: `CHK-01`

#### SC-06: Submit multiline input

- Rule refs: `UC-001`, `REQ-03`, `REQ-04`
- Given: an idle TUI whose composer contains multiple lines
- When: the operator presses `Ctrl+Enter`
- Then: exactly one durable user turn containing the multiline text appears in the conversation and the composer clears
- Checks: `CHK-01`, `CHK-03`

#### SC-07: Cancel without losing terminal or durable input integrity

- Rule refs: `UC-001`, `DR-04`, `REQ-04`, `REQ-05`
- Given: a durable accepted task with an active provider turn
- When: the operator presses `Ctrl+C`
- Then: the run stops without false success, the accepted turn remains durable, and the TUI stays open with an idle composer ready for input
- Checks: `CHK-03`

#### SC-08: Scroll conversation history

- Rule refs: `REQ-01`, `REQ-04`
- Given: conversation content exceeds the viewport
- When: the operator scrolls upward
- Then: earlier conversation becomes visible without changing or resubmitting content
- Checks: `CHK-01`

#### SC-09: Exit an idle TUI after a successful turn

- Rule refs: `REQ-04`, `REQ-05`
- Given: an idle TUI after a completed durable turn
- When: the operator presses `Ctrl+C`
- Then: the adapter exits and restores cursor and terminal modes before returning to the parent shell
- Checks: `CHK-03`

#### SC-10: Exit an idle TUI after a stopped turn

- Rule refs: `REQ-04`, `REQ-05`
- Given: an open idle TUI after the operator stopped an active durable turn
- When: the operator presses `Ctrl+C`
- Then: the adapter exits and restores cursor and terminal modes before returning to the parent shell
- Checks: `CHK-03`

### Negative / Edge Scenarios

#### NEG-01: Renderer failure restores the terminal

- Rule refs: `REQ-05`
- Given: alternate-screen/raw terminal state is active
- When: rendering throws
- Then: cleanup restores cursor and terminal modes before the error escapes
- Checks: `CHK-03`

#### NEG-02: Resize and signal during a running turn remain safe

- Rule refs: `REQ-04`, `REQ-05`
- Given: the viewport is rendering a delayed response
- When: terminal size changes
- Then: layout reflows without an orphaned raw terminal, duplicated submission, or lost live projection
- Checks: `CHK-03`

#### NEG-03: Signal during a running turn restores the terminal

- Rule refs: `REQ-05`
- Given: the viewport is rendering a delayed response
- When: `SIGTERM` arrives
- Then: shutdown begins and the parent terminal is restored before adapter completion
- Checks: `CHK-03`

#### NEG-04: Redirected stdout avoids full-screen control sequences

- Rule refs: `REQ-05`, `REQ-07`
- Given: stdout is not a TTY
- When: `hcode` runs with a positional prompt
- Then: existing line-oriented output and exit semantics are preserved with no alternate-screen escape sequence
- Checks: `CHK-04`

#### NEG-05: Piped stdin retains line mode

- Rule refs: `REQ-05`, `REQ-07`
- Given: stdin is not a TTY
- When: a prompt line is piped into `hcode`
- Then: existing line-oriented input/output and exit semantics are preserved with no OpenTUI initialization
- Checks: `CHK-04`

#### NEG-06: Browser mode remains compatible

- Rule refs: `REQ-07`
- Given: the existing browser server and SQLite session behavior
- When: `hcode serve` handles an ordinary browser agent turn
- Then: the browser receives the same durable conversation/action events without any TUI-only delta contract or OpenTUI initialization
- Checks: `CHK-04`

#### NEG-07: Bootstrap failure never leaves terminal modes active

- Rule refs: `REQ-05`
- Given: an interactive invocation before the TUI adapter has completed setup
- When: runtime or renderer bootstrap throws
- Then: any acquired renderer is destroyed, parent cursor/modes are restored, and the bootstrap error escapes
- Checks: `CHK-03`

#### NEG-08: Process SIGINT exits through adapter cleanup

- Rule refs: `REQ-05`
- Given: an open idle TUI with renderer terminal modes active
- When: the process receives `SIGINT`
- Then: the adapter exits and restores cursor and terminal modes before returning control
- Checks: `CHK-03`

### Checks

| Check ID | Covers | How to check | Expected result | Evidence path |
| --- | --- | --- | --- | --- |
| `CHK-01` | `EC-01`, `EC-02`, `SC-01`, `SC-02`, `SC-05`, `SC-06`, `SC-08` | Deterministic component tests for layout, multiline input, scrolling, status, event rendering, HTML fallback, and trusted warning | Captured frames and state transitions match the TUI contract | PR test log |
| `CHK-02` | `SC-03`, `SC-04` | Delayed mock stream and reconciliation integration tests | Deltas render before completion and final durable text is exact and non-duplicated | PR test log |
| `CHK-03` | `EC-03`, `SC-06`, `SC-07`, `SC-09`, `SC-10`, `NEG-01`, `NEG-02`, `NEG-03`, `NEG-07`, `NEG-08` | Terminal-driver tests plus local PTY smoke for successful/stopped exit, bootstrap/renderer failure, cancel, resize, process signals, and cleanup | Parent terminal modes/cursor are restored and accepted input remains durable | PR test log and smoke transcript |
| `CHK-04` | `EC-04`, `NEG-04`, `NEG-05`, `NEG-06` | Focused non-TTY and browser regressions, type-check, full suite, and diff check | No socket in TUI mode; non-TTY/browser behavior and project invariants remain green | CI run and PR verification |

### Test Matrix

| Check ID | Evidence IDs | Evidence path |
| --- | --- | --- |
| `CHK-01` | `EVID-01` | TUI component test output |
| `CHK-02` | `EVID-02` | Incremental mock integration output |
| `CHK-03` | `EVID-03` | Terminal lifecycle tests and PTY smoke transcript |
| `CHK-04` | `EVID-04` | Full local validation and GitHub Actions run |

### Evidence

- `EVID-01` Passing deterministic TUI layout/input/render tests with representative captured frames.
- `EVID-02` Passing delayed-stream test proving pre-completion output and exact final reconciliation.
- `EVID-03` Passing terminal cleanup/cancellation tests plus a local PTY smoke transcript.
- `EVID-04` Passing `bunx tsc --noEmit`, full `bun test --timeout 30000 --no-parallel`, `git diff --check`, and required GitHub CI.

Delivery evidence: 523 local tests passed with 3 provider-dependent skips and
0 failures; the Ubuntu `bun test + tsc` check passed in
[GitHub Actions run 31875297406](https://github.com/dapi/hyper-code2/actions/runs/31875297406).

### Evidence Contract

| Evidence ID | Artifact | Producer | Path contract | Reused by checks |
| --- | --- | --- | --- | --- |
| `EVID-01` | Test output / captured frame assertions | Bun test runner | PR verification summary | `CHK-01` |
| `EVID-02` | Delayed-stream integration output | Bun test runner | PR verification summary | `CHK-02` |
| `EVID-03` | Cleanup tests and PTY smoke transcript | Bun test runner / implementer | PR verification summary | `CHK-03` |
| `EVID-04` | Canonical validation and CI result | local runner / GitHub Actions | PR checks | `CHK-04` |
