---
title: "FT-009: Implementation Plan"
doc_kind: feature
doc_function: derived
purpose: "Grounded execution plan for the single-agent full-screen hcode TUI MVP."
derived_from:
  - brief.md
  - design.md
  - ../../adr/ADR-001-select-opentui-core.md
status: archived
audience: humans_and_agents
must_not_define:
  - ft_009_scope
  - ft_009_selected_design
  - ft_009_acceptance_criteria
  - ft_009_blocker_state
  - ft_009_validation_profile
---

# FT-009 Implementation Plan

## Цель текущего плана

Deliver the accepted FT-009 vertical slice: interactive TTY invocations use a
responsive single-agent OpenTUI client, redirected invocations retain line mode,
durable events remain authoritative, and every adapter exit restores the parent
terminal before existing CLI-owned runtime shutdown completes.

## Grounding Evidence

- Grounded repository revision: `fd26c3856cbbf14968776b0724367617738cd90f`
- Grounded at: `2026-08-15T10:37:21+03:00`

| ID | Exact inspected path / command | Observed current-state fact | Plan impact |
| --- | --- | --- | --- |
| `GRND-01` | `script/hcode.ts`, default export | Ordinary terminal mode always imports/calls `runTerminal`; CLI owns signals and runtime shutdown | `STEP-04` adds TTY selection while retaining this owner |
| `GRND-02` | `src/cli/runTerminal.entry.ts`, `submitAndRender`, `renderEvent` | Line mode submits durably, polls ordered SQLite events, stops active work, and renders tool/error/HTML fallback | `STEP-03` mirrors semantics; `STEP-04` preserves non-TTY mode |
| `GRND-03` | `src/agent/run.ts`; `src/llm/stream.ts`; `rg -n "text_delta|thinking_delta|onEvent" src/llm` | Marker-loop orchestration omits the existing provider delta callback; adapters already emit text/thinking deltas | `STEP-01` forwards typed model-call events at the shared run boundary |
| `GRND-04` | `src/agent/$type_Agent.ts`; `src/agent/start.ts` | Each agent already owns an unused subscriber set initialized at creation | `STEP-01` types and uses this local seam, not global SSE |
| `GRND-05` | `src/agent/submit.ts`; `src/agent/stop.ts`; `src/agent/workerLoop.ts` | Core owns durable submission, cancellation fencing, and run-state transitions | `STEP-03` calls these primitives and creates no second loop |
| `GRND-06` | `src/session/getEvents.ts`; `src/agent/waitForEvent.ts`; `src/events/emit.ts` | Ordered reads/wakeups exist; global events serve browser/external delivery | `STEP-03` reconciles SQLite and keeps deltas agent-local |
| `GRND-07` | `src/_testCtx.entry.ts`; `src/cli/runTerminal.test.ts`; `src/llm/streamOpenAI.test.ts`; `.github/workflows/test.yml` | Shared test context registers agent functions explicitly; deterministic Bun fake patterns exist; CI runs frozen install, type-check, full offline suite | New agent functions must be registered in the shared fixture; focused tests plus canonical validation are required; OpenTUI FFI tests and shared cwd fixtures require Bun's main-process `--no-parallel` mode |
| `GRND-08` | `package.json`; `bun pm view @opentui/core version`; temporary OpenTUI test-renderer spike | No TUI dependency exists; `0.5.3` is current; frozen temp install rendered Unicode/multiline text and resized under Bun 1.3.14 without local Zig | `STEP-02` pins `0.5.3` and uses official in-memory tests |
| `GRND-09` | `memory-bank/use-cases/UC-001-run-agent-task.md`; `README.md` | Stable flow describes durable activity and line/browser surfaces, not live TUI deltas | `STEP-05` synchronizes only delivered behavior |
| `GRND-10` | `rg -l 'subscribers:\\s*new Set' src -g '*.test.ts'` | `src/agent/workerLoop.test.ts` and six `src/session/*.test.ts` fixtures construct empty subscriber Sets | `STEP-01` preserves empty-Set structural compatibility and type-checks all seven fixtures |

## Implementation Priming

| Order | Exact path / stable source | Section / symbol | Grounding refs | Purpose | Required before |
| --- | --- | --- | --- | --- | --- |
| 1 | `memory-bank/features/FT-009/brief.md` | `## What`, `## Verify` | `GRND-01`–`GRND-09` | Confirm scope/scenarios/evidence | `STEP-01` |
| 2 | `memory-bank/features/FT-009/design.md` | `## Selected Solution` through `## Rollout / Backout` | `GRND-01`–`GRND-08` | Confirm event, reconciliation, lifecycle, fallback | `STEP-01` |
| 3 | `memory-bank/adr/ADR-001-select-opentui-core.md` | `## Decision`, `## Confirmation` | `GRND-08` | Confirm renderer dependency | `STEP-02` |
| 4 | `src/agent/run.ts` | default export | `GRND-03` | Preserve marker/durable ordering | `STEP-01` |
| 5 | `src/agent/$type_Agent.ts` | `Agent` | `GRND-04` | Type subscriber boundary | `STEP-01` |
| 6 | `src/llm/stream.ts` | default export | `GRND-03` | Reuse provider callbacks | `STEP-01` |
| 7 | `src/cli/runTerminal.entry.ts` | `submitAndRender`, `renderEvent` | `GRND-02` | Mirror durable vocabulary/fallback | `STEP-03`, `STEP-04` |
| 8 | `src/agent/submit.ts` | default export | `GRND-05` | Preserve accepted-input ordering | `STEP-03` |
| 9 | `src/agent/stop.ts` | default export | `GRND-05` | Preserve stop semantics | `STEP-03` |
| 10 | `script/hcode.ts` | default export, `MainDependencies` | `GRND-01` | Preserve shutdown ownership | `STEP-04` |
| 11 | `src/cli/runTerminal.test.ts` | `describe('runTerminal')` | `GRND-07` | Mirror CLI fixture conventions | `STEP-03`, `STEP-04` |
| 12 | `src/_testCtx.entry.ts` | `mkTestCtx` agent function registry | `GRND-07` | Register new agent functions in deterministic tests | `STEP-01` |
| 13 | `script/hcode.test.ts` | `describe('hcode launcher')` | `GRND-01`, `GRND-07` | Preserve injected CLI/runtime lifecycle tests | `STEP-04` |
| 14 | `src/agent/workerLoop.test.ts`; `src/session/appendHelpers.test.ts`; `src/session/appendMessage.test.ts`; `src/session/deleteMessageAt.test.ts`; `src/session/getFullMessages.test.ts`; `src/session/replaceMessages.test.ts`; `src/session/syncAgentState.test.ts` | empty `subscribers` fixtures | `GRND-10` | Preserve structural compatibility after subscriber typing | `STEP-01` |
| 15 | `https://opentui.com/docs/core-concepts/testing/` | test renderer API | `GRND-08` | Build deterministic frames/input/resize tests | `STEP-02` |
| 16 | `https://opentui.com/docs/components/textarea/` | key bindings / submit | `GRND-08` | Implement composer controls | `STEP-02` |
| 17 | `https://opentui.com/docs/components/scrollbox/` | sticky scroll / scrolling | `GRND-08` | Implement viewport behavior | `STEP-02` |

Before the first code write, `git rev-parse HEAD` must equal the grounded SHA
and only reviewed FT-009/ADR/index documentation may be dirty. Any mismatch
requires re-grounding and another Plan Ready review.

## Grounding / Support References

| Document | Role | Facts reused | Conflict action |
| --- | --- | --- | --- |
| `brief.md` | problem/validation/verify owner | all `REQ-*`, scenarios, `CHK-*`, `EVID-*` | update brief first |
| `design.md` | solution owner | all local solution/contract/invariant/failure/backout refs | update design first |
| `../../adr/ADR-001-select-opentui-core.md` | external decision | imperative OpenTUI 0.5.x | update/supersede ADR first |
| `../../use-cases/UC-001-run-agent-task.md` | stable scenario | durable task/outcome/stop | synchronize only after delivery |

## Current State / Reference Points

| Exact path | Grounding | Current role | Reuse |
| --- | --- | --- | --- |
| `src/agent/run.ts` | `GRND-03` | marker-aware turn orchestration | forward deltas without altering durable logic |
| `src/agent/$type_Agent.ts` | `GRND-04` | runtime agent shape | type subscriber/disposer contract |
| `src/cli/runTerminal.entry.ts` | `GRND-02` | line adapter | retain; mirror event text |
| `src/agent/submit.ts`, `src/agent/stop.ts` | `GRND-05` | input/cancel owner | call from TUI controller |
| `script/hcode.ts` | `GRND-01` | process orchestration | dynamic TUI import only for TTY |
| `src/agent/workerLoop.test.ts`; `src/session/appendHelpers.test.ts`; `src/session/appendMessage.test.ts`; `src/session/deleteMessageAt.test.ts`; `src/session/getFullMessages.test.ts`; `src/session/replaceMessages.test.ts`; `src/session/syncAgentState.test.ts` | `GRND-10` | empty subscriber fixtures | retain `new Set()` compatibility; canonical type-check covers all |

## Test Strategy

| Surface | Canonical refs | Existing | Planned automated coverage | Local command | CI | Manual-only gap / justification | Approval |
| --- | --- | --- | --- | --- | --- | --- | --- |
| live seam | `REQ-02/03/07`, `SC-03/04`, `SOL-02/04`, `CTR-01/02/04`, `INV-01/02`, `FM-01/02` | provider callback tests | ordered run/call events, isolation/error channel, disposer, no persistence, delayed pre-completion frame, exact durable final/tool/failure reconciliation | `bun test src/agent/liveEvents.test.ts src/agent/run.test.ts src/cli/runTui.test.ts` | workflow `test` | none | none |
| stable frame/render | `REQ-01/03/06`, `SC-01/02/05`, `SOL-03/04`, `INV-03` | none | test-renderer frames assert layout/status/warning, operator/assistant/thinking/tool/error text, HTML fallback | `bun test src/cli/createTuiView.test.ts src/cli/runTui.test.ts` | workflow `test` Linux artifact | none | none |
| input/navigation | `REQ-03/04`, `SC-06/07/08`, `SD-02`, `CTR-03`, `FM-04/05` | line stop tests | multiline durable submit/render/clear, active stop leaves composer usable, scroll and resize do not mutate content | `bun test src/cli/createTuiView.test.ts src/cli/runTui.test.ts` | workflow `test` | none | none |
| exit/failure/signal | `REQ-04/05`, `SC-09/10`, `NEG-01/02/03/07/08`, `SOL-05`, `SD-03`, `CTR-03/04`, `INV-04`, `FM-03/04/05` | line interrupt and CLI lifecycle | injected success/stopped exit, bootstrap/render/subscriber failure, resize, process SIGINT/SIGTERM, detach-before-destroy and exactly-once cleanup | `bun test src/cli/runTui.test.ts script/hcode.test.ts src/cli/runTui.pty.test.ts` | workflow `test` | none; host PTY is automated in `src/cli/runTui.pty.test.ts` | none |
| non-TTY/browser routing | `REQ-05/07`, `NEG-04/05/06`, `SOL-01/02`, `SD-04`, `INV-05`, `FM-06`, `RB-01` | line/browser/CLI tests | TTY dependency injection plus redirected stdout, piped stdin, browser serve regression, and assertion that fallback never invokes TUI loader | `bun test script/hcode.test.ts src/cli/runTerminal.test.ts src/http/$start.test.ts` | workflow `test` | none | none |
| regression | `REQ-07`, `CHK-04` | full suite | frozen install, type-check, full suite, diff check | `bun install --frozen-lockfile && bunx tsc --noEmit && bun test --timeout 30000 --no-parallel && git diff --check` | workflow `test` | none | none |

## Open Questions / Ambiguities

None. Session management, child-process PTY output, approvals, and complete
external event infrastructure remain excluded upstream.

## Environment Contract

| Area | Contract | Used by | Failure symptom |
| --- | --- | --- | --- |
| runtime | Bun 1.3.14 locally; locked `bun.lock`; no local Zig | all | install drift/native load failure |
| tests | `mock:*`, temp SQLite, OpenTUI test renderer, no `LIVE_LLM` | all | provider/network/host TTY required by unit suite |
| PTY | automated bounded pseudo-terminal test with explicit child cleanup in `src/cli/runTui.pty.test.ts` | `STEP-05` | child survives or flags/cursor are not restored |
| access | package registry only; no secrets, listener, or deploy | `STEP-02/05` | external service/credential required |

## Preconditions

| ID | Canonical ref | Required state | Steps | Blocks |
| --- | --- | --- | --- | --- |
| `PRE-01` | `brief.md`, `design.md` | active upstream owners and clean Solution Ready | all | yes |
| `PRE-02` | `ADR-001` | active/accepted decision | `STEP-02`–`STEP-05` | yes |
| `PRE-03` | `CON-01`, `GRND-07` | Bun/frozen offline baseline available | all | yes |

## Design Realization Mapping

| Canonical refs | Owner | Exact targets | Steps | Checks | Evidence |
| --- | --- | --- | --- | --- | --- |
| `SOL-02`, `SD-01`, `CTR-01`, `INV-01`, `FM-02`, `TRD-01` | design | `src/agent/$type_LiveEvent.ts`, `src/agent/publishLive.ts`, `src/agent/subscribeLive.ts`, `src/agent/run.ts` | `STEP-01` | `CHK-02/04` | `EVID-02/04` |
| `SOL-03`, `SD-02`, `INV-03`, `FM-05`, `TRD-02` | design | `src/cli/createTuiView.entry.ts`, `src/cli/runTui.entry.ts` | `STEP-02/03` | `CHK-01/03` | `EVID-01/03` |
| `SOL-04`, `CTR-02`, `INV-02`, `FM-01` | design | `src/cli/runTui.entry.ts` | `STEP-03` | `CHK-02` | `EVID-02` |
| `SOL-01`, `SOL-05`, `SD-03`, `SD-04`, `CTR-03`, `CTR-04`, `INV-04`, `INV-05`, `FM-03`, `FM-04`, `FM-06`, `RB-01` | design | `src/cli/runTui.entry.ts`, `script/hcode.ts` | `STEP-03/04` | `CHK-03/04` | `EVID-03/04` |
| `C4-00`, `TRD-03` | design | agent seam, TUI adapter, CLI routing, locked dependency | `STEP-01`–`STEP-04` | `CHK-01`–`CHK-04` | `EVID-01`–`EVID-04` |
| `ADR-001` | ADR | `package.json`, `bun.lock`, TUI modules/tests | `STEP-02/05` | `CHK-01/03/04` | `EVID-01/03/04` |

## Workstreams

| ID | Implements | Result | Owner | Dependencies |
| --- | --- | --- | --- | --- |
| `WS-1` | `REQ-02/03/07`, live seam refs | typed isolated events | agent | `PRE-01` |
| `WS-2` | `REQ-01/03/04/06`, renderer refs | deterministic view/controller | agent | `PRE-02`, `WS-1` |
| `WS-3` | `REQ-02/04/05`, lifecycle refs | submit/stream/final/cancel adapter | agent | `WS-1/2` |
| `WS-4` | `REQ-05/07`, routing/backout refs | TTY selection and line/browser compatibility | agent | `WS-3` |
| `WS-5` | all checks | docs, full validation, PTY smoke, review | agent + reviewer | `WS-1`–`WS-4` |

## Approval Gates

None. Verification gaps are not accepted: the host PTY lifecycle check is an
automated test, and publication occurs only after required suites/reviews pass.

## Порядок работ

| Step | Actor | Implements | Goal | Exact touchpoints | Artifact | Verifies | Evidence | Check | Blocked | Approval | Escalate if |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `STEP-01` | agent | `REQ-02/03/07`, `SOL-02/04`, `CTR-01/04`, `INV-01`, `FM-02` | typed isolated model/run stream | `src/_testCtx.entry.ts`, `src/agent/$type_Agent.ts`, `src/agent/$type_LiveEvent.ts`, `src/agent/$type_LiveSubscriber.ts`, `src/agent/publishLive.ts`, `src/agent/subscribeLive.ts`, `src/agent/run.ts`, `src/agent/liveEvents.test.ts`, `src/agent/run.test.ts`, `src/agent/workerLoop.test.ts`, `src/session/appendHelpers.test.ts`, `src/session/appendMessage.test.ts`, `src/session/deleteMessageAt.test.ts`, `src/session/getFullMessages.test.ts`, `src/session/replaceMessages.test.ts`, `src/session/syncAgentState.test.ts` | live seam and compatible fixtures | `CHK-02/04` | `EVID-02/04` | `bun test src/agent/liveEvents.test.ts src/agent/run.test.ts src/agent/workerLoop.test.ts src/session/appendHelpers.test.ts src/session/appendMessage.test.ts src/session/deleteMessageAt.test.ts src/session/getFullMessages.test.ts src/session/replaceMessages.test.ts src/session/syncAgentState.test.ts` | `PRE-01/03` | none | durable/global behavior must change |
| `STEP-02` | agent | `REQ-01/03/04/06`, `SOL-03`, `SD-02`, `INV-03`, ADR | locked dependency and pure view/controller | `package.json`, `bun.lock`, `src/cli/createTuiView.entry.ts`, `src/cli/createTuiView.test.ts` | OpenTUI view | `CHK-01` | `EVID-01` | `bun test src/cli/createTuiView.test.ts` | `PRE-02/03`, `STEP-01` | none | supported native artifact unavailable |
| `STEP-03` | agent | `REQ-02`–`REQ-05`, `SOL-04/05`, `CTR-02/03/04`, `INV-02/04`, `FM-01/03/04/05` | durable/live reconciliation, controls, cleanup | `src/cli/runTui.entry.ts`, `src/cli/runTui.test.ts` | working adapter | `CHK-01`–`CHK-03` | `EVID-01`–`EVID-03` | focused TUI tests | `STEP-01/02` | none | cleanup cannot remain single-owner |
| `STEP-04` | agent | `REQ-05/07`, `SOL-01`, `SD-04`, `INV-05`, `FM-06`, `RB-01` | TTY-only dynamic routing | `script/hcode.ts`, `script/hcode.test.ts`, `src/cli/runTerminal.test.ts`, `src/http/$start.test.ts` | CLI routing | `CHK-04` | `EVID-04` | `bun test script/hcode.test.ts src/cli/runTerminal.test.ts src/http/$start.test.ts` | `STEP-03` | none | non-TTY loads OpenTUI |
| `STEP-05` | agent + reviewer | all | synchronize exact owners; full verify, automated PTY, code review, ready PR | `README.md`, `CLAUDE.md`, `memory-bank/engineering/architecture.md`, `memory-bank/use-cases/UC-001-run-agent-task.md`, `memory-bank/features/FT-009/README.md`, `memory-bank/features/FT-009/brief.md`, `memory-bank/features/FT-009/design.md`, `memory-bank/features/FT-009/implementation-plan.md`, `memory-bank/adr/ADR-001-select-opentui-core.md`, `src/ctx_ns.d.ts`, `src/_testCtx.entry.ts`, `src/agent/$type_Agent.ts`, `src/agent/$type_LiveEvent.ts`, `src/agent/$type_LiveSubscriber.ts`, `src/agent/publishLive.ts`, `src/agent/subscribeLive.ts`, `src/agent/run.ts`, `src/cli/createTuiView.entry.ts`, `src/cli/runTui.entry.ts`, `script/hcode.ts`, `package.json`, `bun.lock`, `src/agent/liveEvents.test.ts`, `src/agent/run.test.ts`, `src/cli/createTuiView.test.ts`, `src/cli/runTui.test.ts`, `src/cli/runTui.pty.test.ts`, `script/hcode.test.ts` | acceptance evidence | `CHK-01`–`CHK-04` | `EVID-01`–`EVID-07` | frozen install, type-check, full suite including automated PTY, diff check, independent review, CI | `STEP-01`–`STEP-04` | none | regression/leak/finding remains |

The `STEP-05` validation touchpoints also include `.github/workflows/test.yml`:
the canonical suite uses `bun test --timeout 30000 --no-parallel` because the
repository fixtures share process-global cwd state and OpenTUI's FFI test
renderer must initialize in Bun's main test process.

## Parallelizable Work

- `PAR-01` Live-seam unit tests and view construction can proceed independently
  after the event vocabulary is typed.
- `PAR-02` Lifecycle, CLI routing, and PTY evidence remain sequential because
  they share process signals and renderer ownership.

## Checkpoints

| ID | Refs | Condition | Evidence |
| --- | --- | --- | --- |
| `CP-01` | `STEP-01`, `CHK-02` | ordered deltas never become durable | `EVID-02` |
| `CP-02` | `STEP-02/03`, `CHK-01/02` | frame/input/stream/final behavior deterministic | `EVID-01/02` |
| `CP-03` | `STEP-03/04`, `CHK-03/04` | cleanup/routing pass; line/browser intact | `EVID-03/04` |
| `CP-04` | `STEP-05` | PTY/full suite/review/CI clean | `EVID-03/04/05/06/07` |

## Execution Risks

| ID | Risk | Impact | Mitigation | Trigger |
| --- | --- | --- | --- | --- |
| `ER-01` | native artifact differs by OS | install/runtime failure | locked macOS test + Ubuntu CI | module load fails |
| `ER-02` | burst deltas over-render | sluggish UI | coalesce renders, preserve text order | burst fixture stalls |
| `ER-03` | live/final race duplicates text | incorrect transcript | offset authority and call-finished drain | frame differs from SQLite |
| `ER-04` | signal races with submit/run | lost input/false success | existing submit/stop/runtime owners | durable row diverges |

## Stop Conditions / Fallback

| ID | Related refs | Trigger | Immediate action | Safe fallback |
| --- | --- | --- | --- | --- |
| `STOP-01` | ADR, `TRD-03` | native package cannot install/load locally or CI | reconsider ADR; stop publication | line adapter |
| `STOP-02` | `INV-04`, `FM-03`, `RB-01` | any path leaves terminal dirty | disable TTY route | line adapter |
| `STOP-03` | `INV-01/02`, `CTR-01/02` | deltas persist or duplicate final | remove projection; update design | durable-only behavior |

## Plan-local Evidence

| ID | Artifact | Producer | Path contract | Reused by |
| --- | --- | --- | --- | --- |
| `EVID-05` | Plan Ready draft-revision verdict and candidate hash | non-authoring artifact reviewer | collaboration record and PR summary | plan activation gate |
| `EVID-06` | Plan Ready active-revision verdict and candidate hash | non-authoring artifact reviewer | collaboration record and PR summary | execution gate |
| `EVID-07` | implementation/code review verdict for the exact post-validation candidate hash | non-authoring code reviewer | collaboration record and PR summary | `CP-04` |

## Готово для приемки

All workstreams/checkpoints are complete. The locked install, type-check, full
suite, diff check, PTY smoke, exact-candidate independent review, and Ubuntu CI
passed. The brief is `done`, this plan is `archived`, and ready-for-review PR
[#41](https://github.com/dapi/hyper-code2/pull/41) contains the delivered slice.
