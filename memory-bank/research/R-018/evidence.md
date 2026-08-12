---
title: "R-018: Evidence Log"
doc_kind: research
doc_function: canonical
purpose: "Traceable static and synthetic observations for the secret non-transit boundary."
derived_from: [brief.md, plan.md, ../../flows/research.md]
status: active
audience: humans_and_agents
---
# R-018: Evidence Log

Only a deterministic non-secret fixture was used. No credential, provider call,
HTTP request, home/credential-store read, production state or shared state was
part of collection.

## Sources

| ID | Source / provenance | Date / freshness | Collection context | Access / quality note |
| --- | --- | --- | --- | --- |
| `SRC-01` | [Run manifest](../../../.protocols/experiments/runs/R-018/20260813-static-mock-01/manifest.json) | 2026-08-13; commit `d119f1c`, tree `c47480d` | Generated during a partial static/mock/synthetic cycle | Stable sanitized carrier; records dirty worktree and confirms `src/` had no diff from HEAD; approved OS-containment preconditions were not implemented |
| `SRC-02` | [Static source-to-sink inventory](../../../.protocols/experiments/runs/R-018/20260813-static-mock-01/inventory.md) | 2026-08-13; same snapshot as `SRC-01` | Read-only inspection from declared setting/provider roots through action, persistence, rendering and request construction | Primary code sample with stable repository links; bounded, not a completeness proof |
| `SRC-03` | [S0–S8 controls](../../../.protocols/experiments/runs/R-018/20260813-static-mock-01/controls.json) | 2026-08-13; runner v1 | One no-sentinel negative control and positive controls for every distinct predeclared detector form | Deterministic synthetic data; validates detectors, not inventory completeness |
| `SRC-04` | [Sanitized CELL-01 capture](../../../.protocols/experiments/runs/R-018/20260813-static-mock-01/capture.json) | 2026-08-13; runner v1 | Synthetic declared-secret fixture passed through current `executeMarker`, SQLite event/message and `buildLlmRequest` paths using `mock:r018` | Primary synthetic observation; no provider boundary was called |
| `SRC-05` | [Collector](../../../.protocols/experiments/r018-collect.ts), [tests](../../../.protocols/experiments/r018-sentinel.test.ts), and [detector library](../../../.protocols/experiments/r018-sentinel-lib.ts) | 2026-08-13; checksummed runner v1 | Reproducible Bun instrument with in-memory DB and a fail-closed `fetch` stub | The fixed mock path executes no generated code or shell; it is not an OS sandbox or proof of network isolation for arbitrary code |
| `SRC-06` | [Carrier checksums](../../../.protocols/experiments/runs/R-018/20260813-static-mock-01/checksums.sha256) | 2026-08-13 | SHA-256 over runner and all sanitized carrier files except the checksum file itself | Detects carrier drift after collection |
| `SRC-07` | [Trust and security boundary](../../engineering/security-boundary.md) | Current at the recorded repository snapshot | Canonical target/effective-authority comparison | Contract source; does not itself prove runtime behavior |

## Observations

| ID | Observation | Supporting `SRC-*` | Applies to | Interpretation boundary |
| --- | --- | --- | --- | --- |
| `OBS-01` | The inventoried production `src/` tree matched commit `d119f1c` / tree `c47480d`; documentation and protocol instruments were uncommitted during collection. | [SRC-01](../../../.protocols/experiments/runs/R-018/20260813-static-mock-01/manifest.json) | Provenance | The full worktree was not clean, so the commit alone does not identify research documents or runner source. |
| `OBS-02` | The bounded static sample contains API-key settings resolved from DB or `ctx.env`, credential helpers backed by files/keychain, and agent execution surfaces with full `ctx` or inherited process authority. | [SRC-02](../../../.protocols/experiments/runs/R-018/20260813-static-mock-01/inventory.md) | `RQ-01`, `HYP-01` | Static reachability is not proof that every source is used on every request or that the inventory is complete. |
| `OBS-03` | Current action-result handling copies success output into a persisted tool event/rendered HTML and a persisted synthetic user message that is not marked `excluded_from_llm`; request construction includes that transcript. | [SRC-02](../../../.protocols/experiments/runs/R-018/20260813-static-mock-01/inventory.md) | `RQ-01`, `HYP-01` | This describes the selected action-result route; future/dynamic sinks remain unknown. |
| `OBS-04` | The no-sentinel control produced zero hits, and every positive control for `S0–S8` was detected; 11 targeted tests passed. | [SRC-03](../../../.protocols/experiments/runs/R-018/20260813-static-mock-01/controls.json), [SRC-05](../../../.protocols/experiments/r018-sentinel.test.ts) | `HYP-02` | Byte-exact controls do not detect undeclared transforms or prove semantic leakage detection. |
| `OBS-05` | In `CELL-01`, a deterministic non-secret value resolved through a synthetic `type: secret` declared setting was detected in the synthetic result message, persisted event, rendered event HTML and pre-provider request. | [SRC-04](../../../.protocols/experiments/runs/R-018/20260813-static-mock-01/capture.json), [SRC-05](../../../.protocols/experiments/r018-collect.ts) | `RQ-01`, `HYP-01`, `HYP-02` | The fixture is not a credential and the provider was not called; this proves transit through the sampled local pipeline, not disclosure to a real provider. |
| `OBS-06` | `STOP-03` fired on `CELL-01`; error, serialization-failure, retry/cancellation and additional source cells were not executed. | [SRC-01](../../../.protocols/experiments/runs/R-018/20260813-static-mock-01/manifest.json), [SRC-04](../../../.protocols/experiments/runs/R-018/20260813-static-mock-01/capture.json) | Stopping condition | No runtime conclusion is available for the unexecuted cells. |
| `OBS-07` | Collection made zero provider/HTTP calls, used an in-memory database, did not read home or credential stores, and replaced `fetch` with a throwing stub. | [SRC-01](../../../.protocols/experiments/runs/R-018/20260813-static-mock-01/manifest.json), [SRC-05](../../../.protocols/experiments/r018-collect.ts) | Safety constraint | The collector process was not OS-sandboxed; safety here follows from the fixed mock path and instrument scope, not a general containment guarantee. |

## Collection Log

| Date | Activity | Result | Deviation / reason |
| --- | --- | --- | --- |
| 2026-08-13 | Recorded source snapshot and inspected declared-secret sources, transforms and sinks | Bounded inventory completed for the selected route | Dynamic functions, unknown telemetry and provider-side behavior remain outside the sample |
| 2026-08-13 | Ran no-sentinel and S0–S8 positive controls | 11 tests passed; every detector family produced an attributable positive-control hit | S1 unquoted content is byte-identical to S0 and was deduplicated; the fixture makes S3 and S4 distinct |
| 2026-08-13 | Ran first synthetic success cell | Prohibited transit at four sampled sinks; `STOP-03` fired | Remaining outcome/source cells intentionally not run |
| 2026-08-13 | Reviewed collection against approved plan | Recorded a plan deviation: the fixed collector had a fail-closed fetch stub but no OS sandbox, minimal environment or enforced write boundary | Evidence remains provisional and lifecycle returned to `collecting` |
| 2026-08-13 | Preserved sanitized carriers and SHA-256 checksums | Manifest, inventory, controls, capture and runner are independently inspectable | Raw rendered HTML was not retained because exact sink hit metadata is sufficient and minimizes carrier content |

## Evidence Quality Check

- [x] Each material observation traces to one or more `SRC-*`.
- [x] Every `SRC-*` contains a clickable stable carrier or canonical source link.
- [x] Observations are separated from source claims and analyst interpretation.
- [x] Freshness, sample limitations, dirty-worktree context and unexecuted cells are recorded.
- [x] Real secrets and private data are absent from the carrier.
