---
title: "R-043: Evidence Log"
doc_kind: research
doc_function: canonical
purpose: "Traceable evidence and observations for W1A lifecycle ownership."
derived_from:
  - brief.md
  - plan.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-043: Evidence Log

## Sources

| ID | Source / provenance | Date / freshness | Collection context | Access / quality note |
| --- | --- | --- | --- | --- |
| `SRC-01` | [EP-003 charter](../../epics/EP-003/charter.md) | 2026-08-15 | Canonical epic contract | Primary project intent; requires lifecycle semantics before delivery |
| `SRC-02` | [UC-004](../../use-cases/UC-004-hot-reload-capability.md) | 2026-08-15 | Canonical use case | Primary observable behavior; explicitly says current evidence is component-level |
| `SRC-03` | [`src/repl/load.ts`](../../../src/repl/load.ts) | HEAD `62fda5d` | Direct source inspection | Exact targeted/namespace reload implementation |
| `SRC-04` | [`src/loadFns.ts`](../../../src/loadFns.ts) | HEAD `62fda5d` | Direct source inspection | Exact startup registration implementation |
| `SRC-05` | [`src/self/describe.ts`](../../../src/self/describe.ts) | HEAD `62fda5d` | Direct source inspection | Exact descriptor reconciliation and fail-closed behavior |
| `SRC-06` | [`src/repl/load.test.ts`](../../../src/repl/load.test.ts) | HEAD `62fda5d` | Focused Bun test run | Reproducible reload/race test surface |
| `SRC-07` | [`src/self/describe.test.ts`](../../../src/self/describe.test.ts) | HEAD `62fda5d` | Focused Bun test run | Reproducible descriptor truthfulness test surface |

## Observations

| ID | Observation | Supporting `SRC-*` | Applies to | Interpretation boundary |
| --- | --- | --- | --- | --- |
| `OBS-01` | Targeted reload resolves roots in reverse order, imports a fresh module, checks hash and filesystem version before assigning `ctx.fns` and recording a generation receipt. | [SRC-03](../../../src/repl/load.ts#L45-L78) | `RQ-01`, `HYP-01` | Establishes safe assignment ordering and provenance, not lifecycle ownership |
| `OBS-02` | Namespace reload deduplicates names from the current scan and reloads them sequentially; it does not compare the old registry with current membership or remove names absent from the scan. | [SRC-03](../../../src/repl/load.ts#L21-L43) | `RQ-01`, `HYP-01` | Removal behavior is inferred from the absence of removal code; a dedicated regression fixture is still needed for delivery |
| `OBS-03` | A removed overlay can be replaced by the base source on a later targeted reload because root resolution falls back to the earlier root; this is not automatic at file-removal time. | [SRC-03](../../../src/repl/load.ts#L45-L54), [SRC-06](../../../src/repl/load.test.ts) | `RQ-01`, `HYP-01` | Fallback is reload-triggered and registry-local |
| `OBS-04` | Import/source-race failure occurs before registry assignment for a targeted function, and the focused tests verify the previous callable remains active. | [SRC-03](../../../src/repl/load.ts#L57-L73), [SRC-06](../../../src/repl/load.test.ts#L254-L328) | `RQ-01`, `HYP-01` | Does not prove namespace-level atomicity when an earlier entry already succeeded |
| `OBS-05` | Startup registration and reload both increment a process-local generation and retain a non-enumerable callable identity plus physical source path in the receipt. | [SRC-03](../../../src/repl/load.ts#L85-L120), [SRC-04](../../../src/loadFns.ts#L68-L103) | `RQ-01`, `HYP-02` | Receipt metadata does not track leases, active calls or disposal |
| `OBS-06` | SelfDescriptor rechecks source membership, hashes and live function identity, and returns unavailable when the receipt no longer validates; it does not dispose or revoke a callable. | [SRC-05](../../../src/self/describe.ts#L17-L34), [SRC-05](../../../src/self/describe.ts#L168-L220), [SRC-07](../../../src/self/describe.test.ts) | `RQ-01` | Descriptor is an observation boundary, not a lifecycle owner |
| `OBS-07` | Focused reload and descriptor tests pass, but the combined run has one unrelated startup failure because `shiki` is unavailable in the local dependency environment. | [SRC-06](../../../src/repl/load.test.ts), [SRC-07](../../../src/self/describe.test.ts) | Evidence quality | The failed `loadFns` bootstrap test prevents an all-green claim; reload/descriptor suites themselves passed |

## Collection Log

| Date | Activity | Result | Deviation / reason |
| --- | --- | --- | --- |
| 2026-08-15 | Pinned `62fda5ddb1d13c9798873f39fe672c48a4d72b64`; confirmed no `src/` diff | Stable source boundary | Worktree contains unrelated Memory Bank changes outside `src/` |
| 2026-08-15 | Inspected loader, scanner, route loader and SelfDescriptor | Lifecycle inventory complete | No live server or `.hyper` overlay inspection |
| 2026-08-15 | Ran focused Bun suites | 36 passed, 1 failed in bootstrap due to missing `shiki` package | Failure is environment/dependency-related and retained as limitation |

## Evidence Quality Check

- [x] Each material observation traces to `SRC-*`.
- [x] Sources link to local originals with exact paths/line anchors where useful.
- [x] Observations are separated from recommendations and limitations.
- [x] Revision, runtime boundary, test result and environment limitation are recorded.
