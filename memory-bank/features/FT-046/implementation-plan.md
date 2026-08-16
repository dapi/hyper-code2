---
title: "FT-046: Implementation Plan"
doc_kind: feature
doc_function: derived
purpose: "Grounded execution plan for generation-owned ctx.fns lifecycle."
derived_from:
  - brief.md
  - design.md
status: active
audience: humans_and_agents
must_not_define:
  - ft_046_scope
  - ft_046_selected_design
  - ft_046_acceptance_criteria
  - ft_046_validation_profile
---

# План имплементации

## Цель текущего плана

Реализовать `REQ-01..06` в существующих loader/repl boundaries без durable
schema, marker changes или принудительной миграции raw callers.

## Grounding Evidence

- Grounded repository revision: `62fda5ddb1d13c9798873f39fe672c48a4d72b64`
- Grounded at: `2026-08-15`

| Grounding ID | Inspected path / command | Observed current-state fact | Plan impact |
| --- | --- | --- | --- |
| `GRND-01` | `src/repl/load.ts` | Targeted reload resolves overlay-wins and assigns each function immediately; namespace reload loops sequentially. | `STEP-01` must stage all modules before commit and reconcile membership. |
| `GRND-02` | `src/loadFns.ts` | Startup imports and assigns functions while recording source receipts. | `STEP-02` must initialize lifecycle state consistently with existing receipts. |
| `GRND-03` | `src/self/describe.ts`, `src/self/describe.test.ts` | Descriptor validates receipt identity/source and fails closed; it does not own disposal. | `STEP-03` must preserve descriptor behavior and add no new values. |
| `GRND-04` | `src/repl/load.test.ts` | Existing tests cover overlay precedence, source races and previous-entry preservation. | `STEP-04` extends this surface with atomicity/removal cases. |
| `GRND-05` | `src/agent/*.ts`, repository calling convention | Runtime functions receive `(ctx, opts)` through `ctx.fns`; direct references are common. | Managed API is additive; no broad caller rewrite. |

## Implementation Priming

| Order | Exact path / symbol | Grounding | Purpose | Required before |
| --- | --- | --- | --- | --- |
| 1 | `memory-bank/adr/ADR-002-generation-owned-runtime-lifecycle.md` / `Decision` | `GRND-01..05` | Confirm accepted invariants and uncontained boundary | `STEP-01` |
| 2 | `memory-bank/features/FT-046/design.md` / `Selected Solution`, `Contract`, `Invariants` | `GRND-01..05` | Confirm feature-local solution | `STEP-01` |
| 3 | `src/repl/load.ts` / reload path | `GRND-01`, `GRND-04` | Preserve loader behavior while introducing staging | `STEP-01` |
| 4 | `src/loadFns.ts` / receipt path | `GRND-02` | Keep startup lifecycle metadata aligned | `STEP-02` |
| 5 | `src/self/describe.ts` / receipt validation | `GRND-03` | Preserve truthfulness surface | `STEP-03` |
| 6 | `src/repl/load.test.ts` and new lifecycle tests | `GRND-04` | Match Bun fixture conventions | `STEP-04` |

Before first write: run `git rev-parse HEAD` and verify it equals the grounded
revision above. If it differs, stop and refresh this plan.

## Test Strategy

| Test surface | Canonical refs | Existing coverage | Planned automated coverage | Required local suites | Manual-only gap |
| --- | --- | --- | --- | --- | --- |
| Loader staging | `REQ-01`, `SC-01`, `NEG-01` | `src/repl/load.test.ts` race tests | namespace failure leaves prior set; no partial receipts | `bun test src/repl/load.test.ts` | none |
| Membership/fallback | `REQ-05`, `SC-02`, `NEG-02` | overlay precedence only | remove overlay, base fallback, absent unavailable | focused lifecycle suite | none |
| Managed invoke | `REQ-03..04`, `SC-03..04`, `NEG-03` | none | delayed call, lease count, at-most-once disposal, disposal error | focused lifecycle suite | none |
| Descriptor/raw reference | `REQ-06`, `SC-05` | extensive SelfDescriptor suite | ensure existing suite remains green; direct ref documented | `bun test src/self/describe.test.ts` | direct reference is intentional contract test |

## Preconditions

| ID | Required state | Used by |
| --- | --- | --- |
| `PRE-01` | ADR-002 is `active` + `accepted`. | all steps |
| `PRE-02` | Worktree HEAD equals grounded revision before first write. | `STEP-01` |
| `PRE-03` | No source changes under `src/` are present at planning start. | all steps |

## Design Realization Mapping

| Canonical refs | Realization target | Steps | Checks | Evidence |
| --- | --- | --- | --- | --- |
| `SOL-01`, `INV-01`, `FM-01`, ADR-002 | `src/repl/load.ts` staging/commit | `STEP-01` | `CHK-01` | `EVID-01` |
| `SOL-02`, `INV-02`, `SD-01` | lifecycle state in `ctx.state` | `STEP-02` | `CHK-02` | `EVID-02` |
| `SOL-03`, `CTR-01`, `INV-03`, `FM-03` | `src/repl/invoke.ts` | `STEP-03` | `CHK-03` | `EVID-03` |
| `SOL-04`, `INV-04..05`, `FM-04` | retirement/disposal path | `STEP-03` | `CHK-03` | `EVID-03` |
| `SD-02`, `INV-06` | raw caller compatibility | `src/repl/load.test.ts` | `CHK-04` | `EVID-04` |

## Workstreams

| Workstream | Result | Dependencies |
| --- | --- | --- |
| `WS-1` Atomic loader staging and lifecycle recording | Active/retired generations and membership reconciliation | `PRE-01..03` |
| `WS-2` Managed invocation and disposal | Lease/quiescence API with failure evidence | `WS-1` |
| `WS-3` Regression and validation | Scenario evidence and preserved descriptor behavior | `WS-1`, `WS-2` |

## Порядок работ

| Step | Goal | Touchpoints | Check |
| --- | --- | --- | --- |
| `STEP-01` | Refactor targeted/namespace reload to stage validated modules and commit a coherent set | `src/repl/load.ts` | `CHK-01` |
| `STEP-02` | Record lifecycle active/retired state and explicit removed/unavailable outcomes | `src/repl/load.ts`, `src/loadFns.ts` | `CHK-02` |
| `STEP-03` | Add managed invoke lease and best-effort quiescent disposal | `src/repl/invoke.ts`, loader lifecycle helpers | `CHK-03` |
| `STEP-04` | Add/adjust regression tests and verify SelfDescriptor/raw reference boundary | `src/repl/*.test.ts`, `src/self/describe.test.ts` | `CHK-04` |
| `STEP-05` | Run typecheck, focused suites and full validation; record blockers | repository validation | `CHK-05` |

## Checks / Evidence

- `CHK-01` `bun test src/repl/load.test.ts`
- `CHK-02` lifecycle removal/fallback tests
- `CHK-03` lifecycle invocation/disposal tests
- `CHK-04` `bun test src/self/describe.test.ts`
- `CHK-05` `bunx tsc --noEmit` and `bun test`

Evidence carriers are `EVID-01..05` in the delivery review/PR record; no
credentials, provider calls or external state are required.

## Stop Conditions

- `STOP-01` Any failed staging mutates the active set: stop and restore atomic commit before continuing.
- `STOP-02` Disposal or lease behavior implies sandboxing or revokes raw references: stop and update the design owner/ADR.
- `STOP-03` Existing SelfDescriptor or direct-call compatibility regresses: stop and preserve the prior behavior while revising the bounded API.
