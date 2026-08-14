---
title: "FT-008: Implementation Plan"
doc_kind: feature
doc_function: derived
purpose: "Grounded execution plan for the repository-local hcode preview."
derived_from: [brief.md, design.md]
status: active
audience: humans_and_agents
must_not_define: [ft_008_scope, ft_008_selected_design, ft_008_acceptance_criteria, ft_008_validation_profile]
---

# FT-008 Implementation Plan

## Цель текущего плана

Deliver one repository-local `hcode` vertical slice that starts the existing
agent core in a selected workspace, applies instructions, supports a durable
line conversation, shuts down cleanly, and preserves browser mode.

## Grounding Evidence

- Revision: `d06a0b5e2cb722574e2dfb2bd4825d809c246049`
- Environment: macOS, `mise exec bun@1.3.14 -- ...`, dependencies installed from frozen `bun.lock`.

| ID | Exact inspected path / command | Observed fact | Plan impact |
| --- | --- | --- | --- |
| `GRND-01` | `src/$main.ts`, default export | Function load, type generation, DB, migration, rehydrate, routes, HTTP, worker are coupled; no shutdown | `STEP-01` extracts the order once |
| `GRND-02` | `src/project/roots.ts`, default export; `src/files/resolveSafe.ts`, default export | Installation roots use `import.meta`; file scope uses process cwd | `STEP-02` can chdir once without losing shipped functions |
| `GRND-03` | `src/agent/$route_$id_POST.ts`, lines containing `appendUserMessage`, `UPDATE agents`, `wakeWorker` | Browser submission is append → schedule → wake | `STEP-03` extracts this exact operation |
| `GRND-04` | `src/agent/workerLoop.ts`, `runOne` and default export | Worker owns claim, cursor acknowledgement, running/idle transitions, and wait loop | Terminal must submit through worker; shutdown must stop+wake+await |
| `GRND-05` | `src/session/getEvents.ts`; `src/agent/waitForEvent.ts`; `src/agent/stop.ts` | Ordered durable events, event wake, and abort/reset primitives exist | `STEP-04` reuses these primitives |
| `GRND-06` | `rg -n "onEvent" src --glob '*.ts'` | Provider delta callback is not forwarded by `agent.run` | Token deltas are not a preview acceptance claim |
| `GRND-07` | `src/http/$start.test.ts`; `src/agent/workerLoop.test.ts`; `src/agent/$route_$id_POST.test.ts` | Deterministic Bun fake/test patterns exist at affected boundaries | Exact new test paths in strategy |
| `GRND-08` | `mise exec bun@1.3.14 -- bunx tsc --noEmit`; `mise exec bun@1.3.14 -- bun test --timeout 5000` after frozen install | Type-check passes; 443 pass, 3 opt-in live skips, 0 fail | Pin Bun 1.3.14 for evidence; Homebrew Bun 1.2.21 is unsupported for this run |

## Implementation Priming

| Order | Exact path | Symbol / section | Grounding | Purpose | Required before |
| --- | --- | --- | --- | --- | --- |
| 1 | `memory-bank/features/FT-008/brief.md` | `## What`, `## Verify` | `GRND-01`–`GRND-08` | Confirm scope and checks | `STEP-01` |
| 2 | `memory-bank/features/FT-008/design.md` | `## Selected Design`, `## Contracts And Invariants` | `GRND-01`–`GRND-08` | Confirm solution and ordering | `STEP-01` |
| 3 | `src/$main.ts` | default export | `GRND-01` | Preserve composition | `STEP-01` |
| 4 | `src/http/$start.ts` | default export | `GRND-01`, `GRND-07` | Preserve optional adapter | `STEP-01` |
| 5 | `src/project/roots.ts` | default export | `GRND-02` | Preserve installation roots | `STEP-02` |
| 6 | `src/agent/$route_$id_POST.ts` | append/schedule/wake block | `GRND-03` | Extract shared submit | `STEP-03` |
| 7 | `src/agent/workerLoop.ts` | `runOne`, default export | `GRND-04` | Preserve run/cleanup semantics | `STEP-03`, `STEP-04` |
| 8 | `src/session/getEvents.ts` | default export | `GRND-05` | Render durable order | `STEP-04` |
| 9 | `src/agent/waitForEvent.ts` | default export | `GRND-05` | Await progress without busy wait | `STEP-04` |
| 10 | `src/http/$start.test.ts` | `describe('http.start')` | `GRND-07` | Mirror fake server pattern | `STEP-05` |

Before code writes, `git rev-parse HEAD` must equal the grounded revision; only
the reviewed FT-008 docs may be dirty. Otherwise re-ground and re-review.

## Grounding / Support References

| Document | Role | Facts reused | Conflict action |
| --- | --- | --- | --- |
| `brief.md` | problem/verify owner | `REQ-*`, `SC-*`, `CHK-*`, `EVID-*`, validation profile | update brief first |
| `design.md` | design root | all solution IDs | update design first |
| `../../use-cases/UC-001-run-agent-task.md` | stable operator flow | durable input, answer/failure, stop | sync UC before closure |
| `../../engineering/security-boundary.md` | trust owner | unrestricted local authority | stop any containment claim |

## Current State / Reference Points

| Exact path | Grounding | Current role | Reuse |
| --- | --- | --- | --- |
| `src/$main.ts` | `GRND-01` | browser composition | delegate to shared bootstrap |
| `src/agent/$route_$id_POST.ts` | `GRND-03` | browser submit adapter | retain request parsing; call shared submit |
| `src/agent/workerLoop.ts` | `GRND-04` | durable run scheduler | no second marker/run loop |
| `src/session/getEvents.ts` | `GRND-05` | ordered display data | terminal display authority |
| `src/project/roots.ts` | `GRND-02` | shipped source roots | retain import-meta anchoring |

## Test Strategy

| Surface | Canonical refs | Existing | Planned exact path | Local commands | CI | Manual gap / procedure | Approval |
| --- | --- | --- | --- | --- | --- | --- | --- |
| parser | `REQ-01`, `NEG-01`, `SOL-03` | none | `src/cli/parseArgs.test.ts` | `mise exec bun@1.3.14 -- bun test src/cli/parseArgs.test.ts` | `.github/workflows/test.yml` job `test` | none | none |
| bootstrap | `REQ-02`, `SOL-01`, `CTR-02`, `INV-01` | `src/http/$start.test.ts` | `src/runtime/start.test.ts` | `mise exec bun@1.3.14 -- bun test src/runtime/start.test.ts` | `.github/workflows/test.yml` job `test` | run `hcode serve` on an allocated local port and GET `/`; no visual claim | current user task |
| workspace | `REQ-03`, `REQ-04`, `SOL-02`, `SOL-05` | `src/files/read.test.ts`, `src/files/write.test.ts` | `src/runtime/resolveWorkspace.test.ts`, `src/workspace/instructions.test.ts` | `mise exec bun@1.3.14 -- bun test src/runtime/resolveWorkspace.test.ts src/workspace/instructions.test.ts` | `.github/workflows/test.yml` job `test` | none | none |
| submit | `REQ-05`, `SOL-06`, `CTR-03` | `src/agent/$route_$id_POST.test.ts`, `src/agent/workerLoop.test.ts` | `src/agent/submit.test.ts`, updated `src/agent/$route_$id_POST.test.ts` | `mise exec bun@1.3.14 -- bun test src/agent/submit.test.ts 'src/agent/$route_$id_POST.test.ts'` | `.github/workflows/test.yml` job `test` | none | none |
| terminal | `REQ-05`, `REQ-06`, `SOL-04`, `CTR-03` | none | `src/cli/runTerminal.test.ts` | `mise exec bun@1.3.14 -- bun test src/cli/runTerminal.test.ts` | `.github/workflows/test.yml` job `test` | subjective line editing excluded by `NS-01` | none |
| full | `REQ-01`–`REQ-06` | 443 pass, 3 opt-in live skips, 0 fail | `src/cli/parseArgs.test.ts`, `src/runtime/start.test.ts`, `src/runtime/resolveWorkspace.test.ts`, `src/workspace/instructions.test.ts`, `src/agent/submit.test.ts`, `src/cli/runTerminal.test.ts` | `mise exec bun@1.3.14 -- bun install --frozen-lockfile && mise exec bun@1.3.14 -- bunx tsc --noEmit && mise exec bun@1.3.14 -- bun test --timeout 5000 && git diff --check` | `.github/workflows/test.yml` job `test` | served-route smoke described in bootstrap row | current user task |

## Open Questions / Ambiguities

None. Full issue completion, provider deltas, full-screen UX, platform data root,
fencing, and per-run instruction snapshots remain explicitly outside FT-008.

## Environment Contract

| Area | Contract | Used by | Failure symptom |
| --- | --- | --- | --- |
| runtime | `mise exec bun@1.3.14 --`; frozen `bun.lock` | all | Bun 1.2.21 markdown failures or lock drift |
| tests | `mock:*`; `.test-tmp/`; no `LIVE_LLM` | `STEP-05` | provider/network request |
| access | local branch/worktree and local loopback smoke only | all | publication, remote mutation, or deploy needed |

## Preconditions

| ID | Canonical ref | Required state | Steps | Blocks |
| --- | --- | --- | --- | --- |
| `PRE-01` | `design.md` all solution IDs | active design and clean draft review | all | yes |
| `PRE-02` | brief `CON-03` | Bun 1.3.14 frozen install and mock baseline green | `STEP-05` | yes |

## Design Realization Mapping

| Refs | Owner | Exact realization targets | Steps | Checks | Evidence |
| --- | --- | --- | --- | --- | --- |
| `SOL-01`, `CTR-02`, `CTR-05`, `INV-01`, `FM-02`, `RB-01` | design | `src/runtime/start.entry.ts`, `src/$main.ts` | `STEP-01` | `CHK-04`, `CHK-05` | `EVID-04`, `EVID-05` |
| `SOL-02`, `SOL-05`, `CTR-04`, `INV-02`, `INV-03`, `INV-05`, `FM-04`, `FM-05` | design | `src/runtime/resolveWorkspace.entry.ts`, `src/workspace/instructions.ts` | `STEP-02` | `CHK-03` | `EVID-03` |
| `SOL-06`, `CTR-03` | design | `src/agent/submit.ts`, `src/agent/$route_$id_POST.ts` | `STEP-03` | `CHK-01` | `EVID-01` |
| `SOL-03`, `SOL-04`, `CTR-01`, `INV-04`, `SD-01`, `SD-02`, `SD-03`, `SD-04`, `FM-01`, `FM-03` | design | `src/cli/parseArgs.entry.ts`, `src/cli/runTerminal.entry.ts`, `script/hcode.ts`, `hcode`, `package.json` | `STEP-04` | `CHK-01`, `CHK-02` | `EVID-01`, `EVID-02` |
| `C4-01` | design | `src/runtime/start.entry.ts`, `src/runtime/resolveWorkspace.entry.ts`, `src/workspace/instructions.ts`, `src/agent/submit.ts`, `src/cli/parseArgs.entry.ts`, `src/cli/runTerminal.entry.ts` | `STEP-01`–`STEP-04` | `CHK-05` | `EVID-05` |

## Workstreams

| Workstream | Implements | Result | Owner | Dependencies |
| --- | --- | --- | --- | --- |
| `WS-1` | `REQ-02`, `SOL-01` | shared optional-HTTP runtime | agent | `PRE-01` |
| `WS-2` | `REQ-03/04`, `SOL-02/05` | workspace/instructions | agent | `PRE-01` |
| `WS-3` | `REQ-01/05/06`, `SOL-03/04/06` | executable terminal preview | agent | `WS-1`, `WS-2` |
| `WS-4` | all checks | regression/evidence/docs | agent + reviewer | `WS-1`–`WS-3` |

## Approval Gates

| ID | Trigger | Applies | Reason | Evidence |
| --- | --- | --- | --- | --- |
| `AG-01` | local served-route smoke | `STEP-05` | opens loopback listener temporarily | current user implementation authorization; record port/process cleanup |

## Порядок работ

| Step | Actor | Implements | Goal | Exact touchpoints | Artifact | Verifies | Evidence | Command | Blocked | Approval | Escalate if |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `STEP-01` | agent | `REQ-02`, `SOL-01` | shared bootstrap/shutdown | `src/runtime/start.entry.ts`, `src/$main.ts`, `src/runtime/start.test.ts` | runtime API | `CHK-04` | `EVID-04` | `mise exec bun@1.3.14 -- bun test src/runtime/start.test.ts` | `PRE-01` | none | browser contract cannot remain |
| `STEP-02` | agent | `REQ-03`, `REQ-04`, `SOL-02`, `SOL-05` | workspace/instructions | `src/runtime/resolveWorkspace.entry.ts`, `src/runtime/resolveWorkspace.test.ts`, `src/workspace/instructions.ts`, `src/workspace/instructions.test.ts` | workspace API | `CHK-03` | `EVID-03` | `mise exec bun@1.3.14 -- bun test src/runtime/resolveWorkspace.test.ts src/workspace/instructions.test.ts` | `STEP-01` | none | destructive migration/ambiguous ancestry |
| `STEP-03` | agent | `REQ-05`, `SOL-06` | shared submission | `src/agent/submit.ts`, `src/agent/submit.test.ts`, `src/agent/$route_$id_POST.ts`, `src/agent/$route_$id_POST.test.ts` | submit API | `CHK-01` | `EVID-01` | `mise exec bun@1.3.14 -- bun test src/agent/submit.test.ts 'src/agent/$route_$id_POST.test.ts'` | `STEP-01` | none | cursor/order diverges |
| `STEP-04` | agent | `REQ-01`, `REQ-05`, `REQ-06`, `SOL-03`, `SOL-04` | executable line client | `src/cli/parseArgs.entry.ts`, `src/cli/parseArgs.test.ts`, `src/cli/runTerminal.entry.ts`, `src/cli/runTerminal.test.ts`, `script/hcode.ts`, `hcode`, `package.json` | CLI preview | `CHK-01`, `CHK-02` | `EVID-01`, `EVID-02` | `mise exec bun@1.3.14 -- bun test src/cli/parseArgs.test.ts src/cli/runTerminal.test.ts` | `STEP-02`, `STEP-03` | none | raw/full-screen needed |
| `STEP-05` | agent | `REQ-01`–`REQ-06` | docs and complete verification | `README.md`, `memory-bank/use-cases/UC-001-run-agent-task.md`, `src/ctx_ns.d.ts` | evidence | `CHK-01`–`CHK-05` | `EVID-01`–`EVID-05`, `EVID-10` | `mise exec bun@1.3.14 -- bun install --frozen-lockfile && mise exec bun@1.3.14 -- bunx tsc --noEmit && mise exec bun@1.3.14 -- bun test --timeout 5000 && git diff --check`; then start `hcode serve` on an allocated loopback port, GET `/`, and stop it | `STEP-01`–`STEP-04` | `AG-01` | regression/live dependency |

## Parallelizable Work

- `PAR-01` Parser and instruction tests may proceed independently after `STEP-01` contracts stabilize.
- `PAR-02` Bootstrap, submission, and terminal integration remain sequential because they share lifecycle surfaces.

## Checkpoints

| ID | Refs | Condition | Evidence |
| --- | --- | --- | --- |
| `CP-01` | `STEP-01/02` | headless runtime in canonical workspace, no socket | `EVID-03/04` |
| `CP-02` | `STEP-03/04` | two-turn mock and clean exit | `EVID-01/02` |
| `CP-03` | `STEP-05` | canonical checks and smoke pass | `EVID-04/05` |

## Execution Risks / Stop Conditions

| ID | Risk/trigger | Mitigation / immediate action | Safe fallback |
| --- | --- | --- | --- |
| `ER-01` | cwd leaks between tests | restore cwd; serialize affected fixtures | unchanged browser runtime |
| `ER-02` | worker hangs shutdown | stop+wake+await with bounded test | abort run and retain DB |
| `ER-03` | no token deltas | render honest durable progress/final events | line preview; #5 follow-up |
| `STOP-01` | terminal needs HTTP | stop and update design | browser unchanged |
| `STOP-02` | destructive DB migration needed | do not migrate | existing schema/path |
| `STOP-03` | live provider required | replace with mock seam | no external request |

## Plan-local Evidence

| ID | Artifact | Producer | Path contract | Reused by |
| --- | --- | --- | --- | --- |
| `EVID-09` | Plan Ready review verdict with file SHA-256 | non-authoring reviewer | collaboration review record | execution gate |
| `EVID-10` | local served-route smoke transcript | implementer | final handoff/PR summary | `CP-03` |

## Готово для приемки

All workstreams and checkpoints are complete; all brief checks have concrete
evidence; Bun 1.3.14 frozen install/typecheck/full tests/diff check pass; the
loopback smoke is stopped; code review is clean; README and `UC-001` describe
only delivered preview behavior. Then the brief may become `done` and this plan
`archived`; commit/push/PR remain separate explicit-authority actions.
