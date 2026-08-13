---
title: "R-031: Evidence Log"
doc_kind: research
doc_function: canonical
purpose: "Traceable offline symmetry-control evidence for the frozen R-031 discovery-contract comparison."
derived_from: [brief.md, plan.md, ../../flows/research.md]
status: active
audience: humans_and_agents
---
# R-031: Evidence Log

## Sources

| ID | Source / provenance | Date / freshness | Collection context | Access / quality note |
| --- | --- | --- | --- | --- |
| `SRC-01` | [Offline comparison instrument](../../../.protocols/experiments/r031-offline-comparison.ts), [common library](../../../.protocols/experiments/r031-offline-lib.ts) and [fresh verifier](../../../.protocols/experiments/r031-fresh-verifier.ts) | 2026-08-13 | Local Bun deterministic pre-run control | Primary executable instrument; no model behavior |
| `SRC-02` | [Sanitized carrier](../../../.protocols/experiments/runs/R-031/2026-08-13-offline-symmetry-v1/README.md), [symmetry record](../../../.protocols/experiments/runs/R-031/2026-08-13-offline-symmetry-v1/symmetry.json), [positive results](../../../.protocols/experiments/runs/R-031/2026-08-13-offline-symmetry-v1/results.json) and [negative controls](../../../.protocols/experiments/runs/R-031/2026-08-13-offline-symmetry-v1/false-success-controls.json); integrity manifest: `SHA256SUMS` in the same carrier | 2026-08-13 | 24 fresh Bun child processes over a disposable root | Primary sanitized machine evidence; process IDs and disposable paths omitted |
| `SRC-03` | [Targeted instrument test](../../../.protocols/experiments/r031-offline-comparison.test.ts) | 2026-08-13 | Direct test of 4 variants by 3 families | Mechanism/control evidence, not product evidence |

## Observations

| ID | Observation | Supporting `SRC-*` | Applies to | Interpretation boundary |
| --- | --- | --- | --- | --- |
| `OBS-01` | V0–V3 each discovered and called the same three ordinary callable files with the same fixtures, golden outputs, child executable and declared authority. | [SRC-02](../../../.protocols/experiments/runs/R-031/2026-08-13-offline-symmetry-v1/symmetry.json) | `RQ-01`, `ASM-01` | Deterministic projection feasibility only; no agent chose a capability. |
| `OBS-02` | All 12 positive cases matched both tool and final golden digests in fresh processes, created no duplicate, matched the ordinary direct call and passed the hard ordinary-callable composition gate. The three V3 results recorded descriptor resolution and adapter-boundary crossing; V0–V2 recorded direct invocation and no crossing. | [SRC-02](../../../.protocols/experiments/runs/R-031/2026-08-13-offline-symmetry-v1/results.json) | `HYP-01`, `HYP-02` controls | Does not measure discovery effort, continuations or model reliability. |
| `OBS-03` | All 12 negative cases detected the injected false-success condition: final matched golden while the tool result did not. V3's three negative cases also traversed the descriptor adapter, so the failure detector did not bypass its invocation boundary. | [SRC-02](../../../.protocols/experiments/runs/R-031/2026-08-13-offline-symmetry-v1/false-success-controls.json) | Evidence-contract control | Proves this deterministic detector path, not every possible misleading answer. |
| `OBS-04` | The carrier records zero provider calls and sockets, no real-secret read or production-source change, and no architecture/winner selection. | [SRC-02](../../../.protocols/experiments/runs/R-031/2026-08-13-offline-symmetry-v1/symmetry.json) | `STOP-02`, `STOP-03` | Declarative boundary backed by instrument construction; not an OS sandbox proof. |

## Collection Log

| Date | Activity | Result | Deviation / reason |
| --- | --- | --- | --- |
| 2026-08-13 | Targeted direct-call control | 4 variants × 3 families pass | No deviation |
| 2026-08-13 | Fresh-process positive comparison | 12/12 exact tool/final, direct-call and composition checks pass; all three V3 cases cross the descriptor adapter | Offline deterministic control; no model |
| 2026-08-13 | Fresh-process false-success injection | 12/12 injected false-success cases detected | Offline deterministic control; no model |

## Evidence Quality Check

- [x] Material observations trace to stable source records.
- [x] Sources are clickable and preserve provenance and checksums.
- [x] Observation and interpretation are separated.
- [x] The no-model limitation and pending independent review are explicit.
