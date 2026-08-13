---
title: "R-032: Evidence Log"
doc_kind: research
doc_function: canonical
purpose: "Traceable evidence and bounded observations collected for R-032."
derived_from:
  - brief.md
  - plan.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-032: Evidence Log

This log records reviewed observations, not synthesis, a recommendation or a
mechanism decision. The lifecycle remains `collecting` in the
[Research Brief](brief.md).

## Sources

| ID | Source / provenance | Date / freshness | Collection context | Access / quality note |
| --- | --- | --- | --- | --- |
| `SRC-01` | [V5 carrier README](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/README.md), [manifest](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/manifest.json), [results](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/results.json) and [summary](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/summary.json) | 2026-08-13; execution HEAD `2ab427a` | One additive disposable run over nine predeclared labels | Primary machine-readable carrier; complete matrix is explicitly false and candidate policy/overlay behavior is synthetic |
| `SRC-02` | [V5 provenance](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/provenance.json); integrity manifest: `SHA256SUMS` in the same carrier | 2026-08-13 | Independent read-only checksum, source-hash and instrument-hash verification | Exact local provenance; no real listener, network, secret, user runtime state or production mutation |
| `SRC-03` | [V5 instrument](../../../.protocols/experiments/r032-committed-route-v5.ts), [tests](../../../.protocols/experiments/r032-committed-route-v5.test.ts) and [synthetic replacement fixture](../../../.protocols/experiments/r032-route-v5.fixture.ts) | 2026-08-13; hashes pinned by `SRC-02` | Static review of the executable path and its safety substitutions | Executes committed `loadRoutes`, `match` and captured `$start.fetch`; policy, lifecycle, reachability and restart adapters remain experiment-local models |
| `SRC-04` | [R-029 fixed route inventory](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-route-control-v2/route-control-reconciliation.json) | Baseline `d119f1c`, re-hashed at the V5 execution HEAD | Read-only replay input to committed route loading | Covers 36 fixed entries: 34 route-module imports and two script GET registrations |

## Observations

| ID | Observation | Supporting `SRC-*` | Applies to | Interpretation boundary |
| --- | --- | --- | --- | --- |
| `OBS-01` | V5 loaded all 36 fixed entries through committed `loadRoutes`, produced 36 routes, exercised committed `match` and the captured `$start.fetch`, and observed replacement of an existing `/repl` handler through a second committed-loader call. | [SRC-01](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/results.json), [SRC-03](../../../.protocols/experiments/r032-committed-route-v5.ts), [SRC-04](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-route-control-v2/route-control-reconciliation.json) | `RQ-01`, `HYP-01`, `GATE-01`, `GATE-03` | The dispatched handler and overwrite module were safe synthetic replacements. No production handler, listener or arbitrary `.hyper` overlay executed. |
| `OBS-02` | The same route, reachability, browser/CLI lifecycle and restart result structure was emitted for all nine labels: `CAN-01…06` and `COM-01…03`. | [SRC-01](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/results.json) | `HYP-03`, fixture symmetry | Mechanical symmetry does not make the candidate mechanisms equally faithful. `CAN-06` remains an in-process broker label and cannot support process-separation or residual-authority conclusions. |
| `OBS-03` | The committed loader exposes no authority-policy/default/inheritance field. V5 therefore applied one experiment-local authorization wrapper and synthetic late, unclassified and overlay policies; it did not read user runtime state. | [SRC-01](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/manifest.json), [SRC-03](../../../.protocols/experiments/r032-committed-route-v5.ts) | `RSC-05`, `GATE-03` | Candidate default/inheritance results are prototype behavior, not current runtime policy or arbitrary-overlay proof. |
| `OBS-04` | Requested bind, modeled exposure, peer metadata and caller-authority change are separate fields, and every reachability row states `actualNetworkTested: false`. | [SRC-01](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/results.json) | `HYP-01`, `GATE-04` | This supports bounded structural separation only; it establishes neither interface reachability nor OS transport behavior. |
| `OBS-05` | Browser and CLI fixtures traverse start, reconnect, expiry, expiry recovery, revocation and revocation recovery through each label's same authorization adapter; restart rows separately record stale, missing and fresh root calls. | [SRC-01](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/results.json), [SRC-03](../../../.protocols/experiments/r032-committed-route-v5.test.ts) | `GATE-06`, `GATE-07` | These are coupled state models, not real UI, credential-channel, restart-process or usability evidence. |
| `OBS-06` | Independent review accepted V5 only as bounded carrier evidence. Gate interpretation is `G1 partial`, `G2 no evidence`, `G3 partial`, `G4 bounded structure`, `G5 no new evidence`, `G6 bounded model`, and `G7 partial`. | [SRC-01](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/README.md), [SRC-02](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/provenance.json), [SRC-03](../../../.protocols/experiments/r032-committed-route-v5.ts) | `GATE-01…07` | No whole hard gate is closed by V5. Candidate-level rows may inform further collection, but cannot support synthesis, ranking, recommendation or selection yet. |

## Reviewed Gate Interpretation

| Gate | V5 result | Exact bounded meaning |
| --- | --- | --- |
| `GATE-01` | Partial | Real committed registration/match/captured-fetch path plus synthetic policy/handler/root coupling; not a production authority gate. |
| `GATE-02` | No evidence | V5 does not execute queued/deferred initiating-authority propagation and use-time revalidation. |
| `GATE-03` | Partial | Real committed loading and safe overwrite; late/unclassified/default/overlay policy behavior remains synthetic and arbitrary user overlays are excluded. |
| `GATE-04` | Bounded structure | Independent result fields preserve the distinctions; reachability and residual process authority are not empirically established. |
| `GATE-05` | No new evidence | V5 adds no secret/capability non-transit execution; earlier bounded carriers remain separate evidence. |
| `GATE-06` | Bounded model | Browser and CLI lifecycle decisions are candidate-coupled synthetic state transitions, not real clients or usability. |
| `GATE-07` | Partial | Restart-generation/root-call behavior is modeled, while complete verifier, broker, policy and real restart failure behavior remains open. |

## Collection Log

| Date | Activity | Result | Deviation / reason |
| --- | --- | --- | --- |
| 2026-08-13 | Executed and independently reviewed the additive V5 carrier | `ACCEPT BOUNDED`; hashes and nine-label symmetry verified | Full matrix remains incomplete; no synthesis or mechanism selection authorized |

## Evidence Quality Check

- [x] Each material observation traces to one or more `SRC-*` records.
- [x] Sources link to primary local artifacts with exact provenance and checksums.
- [x] Observations are separated from gate interpretation and mechanism choice.
- [x] Synthetic, excluded and incompatible fidelity limits are explicit.
