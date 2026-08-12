---
title: "R-029: Evidence Log"
doc_kind: research
doc_function: canonical
purpose: "Traceable static route inventory and mocked authority observations for R-029."
derived_from:
  - brief.md
  - plan.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-029: Evidence Log

All requests, state and privileged-root results in this collection are synthetic.
No real listener, credential, home file, provider or shared runtime state was
used, and no handler under test performed a project/runtime write. The instrument
wrote only the declared evidence carrier. That carrier contains paths relative to
the repository, never an expanded home path.

## Sources

| ID | Source / provenance | Date / freshness | Collection context | Access / quality note |
| --- | --- | --- | --- | --- |
| `SRC-01` | [Run carrier index](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-static-mock/README.md) | 2026-08-13; fixed at `d119f1c10381e489d9140c43f9fe9a878bf67255` | Approved static inventory and mocked direct-handler cycle | Stable, sanitized repository carrier; current only for the recorded source snapshot |
| `SRC-02` | [Route/authority inventory](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-static-mock/route-authority-inventory.json) | Same run | `src` files enumerated independently, classified with the project classifier, and reconciled with manual route notes | Primary code-derived manifest; transitive authority annotations include analyst review |
| `SRC-03` | [Mock result capture](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-static-mock/mock-results.json) | Same run | `Bun.serve`, build, file/write and route dependencies replaced by capture stubs; handlers called with synthetic `Request` values | Primary controlled observation; does not establish network reachability |
| `SRC-04` | [Run provenance](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-static-mock/provenance.json) | Same run | Records HEAD, tool versions, dirty-worktree limitation and safety boundary | Primary metadata; `src` had no tracked or untracked diff from the fixed HEAD |
| `SRC-05` | [Run carrier containing `SHA256SUMS`](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-static-mock/README.md) | Same run | SHA-256 over the JSON evidence carriers | `SHA256SUMS` in the linked carrier was recalculated successfully after collection |
| `SRC-06` | [Listener implementation](../../../src/http/$start.ts) and [route loader](../../../src/http/loadRoutes.ts) | Fixed HEAD | Static source and mocked invocation | Primary implementation evidence |
| `SRC-07` | [Project scanner](../../../src/project/scan.ts), [classifier](../../../src/project/classify.ts), and [root list](../../../src/project/roots.ts) | Fixed HEAD | Reconciles loader conventions and records dynamic overlay boundary | Primary implementation evidence; `.hyper` contents are runtime state, not part of this fixed `src` sample |
| `SRC-08` | [Marker authority dispatcher](../../../src/agent/executeMarker.ts) and [REPL evaluator](../../../src/repl/eval.ts) | Fixed HEAD | Static transitive-authority trace from message scheduling and `/repl` | Primary implementation evidence; privileged operations were not executed |
| `SRC-09` | [Deterministic collection instrument](../../../.protocols/experiments/r029-static-mock.ts) | Same run | Reproduction entrypoint; aborts when HEAD changes or `src` has a diff | Reviewable instrument; output directory is fixed for this snapshot |

## Observations

| ID | Observation | Supporting `SRC-*` | Applies to | Interpretation boundary |
| --- | --- | --- | --- | --- |
| `OBS-01` | The fixed `src` snapshot contains 34 route handlers and two `$script_*` files registered as GET routes, for 36 distinct method/path dispatch entries. The classifier does not register `src/ui/$script_bundle.entry.ts` as a script route. | [SRC-02](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-static-mock/route-authority-inventory.json), [SRC-07](../../../src/project/classify.ts) | `RQ-01`, `ASM-01` | Counts exclude runtime `.hyper` overlay entries and apply only to the fixed HEAD |
| `OBS-02` | The static inventory records an empty route-local caller-control list for each of 36 entries. In 11 representative mocked cases, missing, malformed or synthetic-invalid bearer material reached `/repl`, file-write, agent scheduling, fork, stop or settings stubs when resource/input validation passed. | [SRC-02](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-static-mock/route-authority-inventory.json), [SRC-03](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-static-mock/mock-results.json) | `RQ-01`, `ASM-02`, `ASM-03` | The static classifications lack independent matrix sign-off and the mocks do not cover every route/control combination; no universal runtime claim follows |
| `OBS-03` | The listener invocation passed `hostname: "0.0.0.0"`, the numeric `ctx.env.PORT` value and its dispatcher to the `Bun.serve` capture stub. No socket was opened. | [SRC-03](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-static-mock/mock-results.json), [SRC-06](../../../src/http/$start.ts) | `RQ-01`, `HYP-01` | Shows requested bind configuration, not interface-level reachability |
| `OBS-04` | Inventoried request paths reach or can transitively schedule all planned authority classes: in-process eval, shell, filesystem read/write, git through eval/bash, settings/credentials, provider/model invocation, agent/session mutation and server/process control. | [SRC-02](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-static-mock/route-authority-inventory.json), [SRC-08](../../../src/agent/executeMarker.ts) | `RQ-01` | Transitive labels describe capability reachable after deferred execution; the mocked run did not execute those roots |
| `OBS-05` | Input/resource checks can return 400 or 404, but the tested checks distinguish malformed input or absent resources, not caller identity or authority. | [SRC-03](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-static-mock/mock-results.json) | `RQ-01` | Tested representative authority classes; the complete route-level absence statement also relies on static inventory review |
| `OBS-06` | The run used Bun `1.3.14` and Apple Git `2.50.1`, fixed source at `d119f1c`, and found no `src` diff. The worktree contained unrelated documentation and experiment changes outside `src`. | [SRC-04](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-static-mock/provenance.json), [SRC-05](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-static-mock/README.md) | Evidence quality | Re-running after a source change intentionally fails until the snapshot/run id is reviewed and updated |
| `OBS-07` | The runtime scanner can load routes and scripts from `.hyper` after `src`; this collection intentionally inventories only committed `src`. | [SRC-07](../../../src/project/roots.ts), [SRC-07](../../../src/project/scan.ts) | `ASM-01`, `STOP-01` | A complete runtime route claim requires a separately captured overlay manifest for the particular runtime |

## Collection Log

| Date | Activity | Result | Deviation / reason |
| --- | --- | --- | --- |
| 2026-08-13 | Fixed HEAD and verified `src` had no worktree diff | Snapshot accepted; unrelated non-`src` changes retained as a limitation | None |
| 2026-08-13 | Reconciled route filenames with `classify` loader semantics | 34 handlers + 2 registered scripts = 36 unique dispatch entries | `.hyper` intentionally excluded because it is runtime state rather than fixed-HEAD source |
| 2026-08-13 | Traced direct and transitive authority classes | All planned classes represented in the matrix | Git authority is transitive through bash/eval, not a dedicated HTTP handler |
| 2026-08-13 | Ran mocked listener, loader and representative handler checks | 11 cases; privileged roots captured; no caller gate observed | No real reachability stage; separate approval remains pending |
| 2026-08-13 | Recalculated evidence checksums | All three JSON carriers passed | None |

## Evidence Quality Check

- [x] Each material observation traces to one or more `SRC-*`.
- [x] Every `SRC-*` links to source or a stable repository carrier.
- [x] Observations are separated from analyst interpretation.
- [x] Freshness, overlay scope, mock limitations and dirty-worktree context are recorded.
- [ ] Complete route/control reconciliation and independent matrix review remain pending.
- [ ] Optional interface reachability is not collected and remains separately prohibited.
