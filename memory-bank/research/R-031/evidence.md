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
| `SRC-04` | [Pre-live boundary runner](../../../.protocols/experiments/r031-live-boundary-runner.ts), [agent child](../../../.protocols/experiments/r031-live-boundary-child.ts), [offline broker](../../../.protocols/experiments/r031-live-boundary-broker.ts) and [common envelope](../../../.protocols/experiments/r031-live-boundary-lib.ts) | 2026-08-13 | macOS-sandboxed child processes and separate filesystem broker | Primary executable boundary instrument; live/provider mode is absent |
| `SRC-05` | [Pre-live sanitized carrier](../../../.protocols/experiments/runs/R-031/2026-08-13-live-boundary-mock-v1/README.md), [context symmetry](../../../.protocols/experiments/runs/R-031/2026-08-13-live-boundary-mock-v1/context-symmetry.json), [safety boundary](../../../.protocols/experiments/runs/R-031/2026-08-13-live-boundary-mock-v1/safety-boundary.json) and [case results](../../../.protocols/experiments/runs/R-031/2026-08-13-live-boundary-mock-v1/boundary-results.json); integrity manifest: `SHA256SUMS` in the same carrier | 2026-08-13 | 36 fresh children: 4 variants × 3 families × 3 phases | Sanitized machine evidence; no model/provider behavior |

## Observations

| ID | Observation | Supporting `SRC-*` | Applies to | Interpretation boundary |
| --- | --- | --- | --- | --- |
| `OBS-01` | V0–V3 each discovered and called the same three ordinary callable files with the same fixtures, golden outputs, child executable and declared authority. | [SRC-02](../../../.protocols/experiments/runs/R-031/2026-08-13-offline-symmetry-v1/symmetry.json) | `RQ-01`, `ASM-01` | Deterministic projection feasibility only; no agent chose a capability. |
| `OBS-02` | All 12 positive cases matched both tool and final golden digests in fresh processes, created no duplicate, matched the ordinary direct call and passed the hard ordinary-callable composition gate. The three V3 results recorded descriptor resolution and adapter-boundary crossing; V0–V2 recorded direct invocation and no crossing. | [SRC-02](../../../.protocols/experiments/runs/R-031/2026-08-13-offline-symmetry-v1/results.json) | `HYP-01`, `HYP-02` controls | Does not measure discovery effort, continuations or model reliability. |
| `OBS-03` | All 12 negative cases detected the injected false-success condition: final matched golden while the tool result did not. V3's three negative cases also traversed the descriptor adapter, so the failure detector did not bypass its invocation boundary. | [SRC-02](../../../.protocols/experiments/runs/R-031/2026-08-13-offline-symmetry-v1/false-success-controls.json) | Evidence-contract control | Proves this deterministic detector path, not every possible misleading answer. |
| `OBS-04` | The carrier records zero provider calls and sockets, no real-secret read or production-source change, and no architecture/winner selection. | [SRC-02](../../../.protocols/experiments/runs/R-031/2026-08-13-offline-symmetry-v1/symmetry.json) | `STOP-02`, `STOP-03` | Declarative boundary backed by instrument construction; not an OS sandbox proof. |
| `OBS-05` | All 36 mock boundary-envelope cases used fresh macOS-sandboxed child processes; each received exactly `HOME`, `LANG`, `LC_ALL`, `NO_COLOR`, `PATH`, `TMPDIR` and no auth-like key. Named TCP loopback bind/listen, outbound connect to an established loopback listener, operator repository read, operator HOME read and non-Bun exec probes were denied. The profile has no mach-lookup allow rule. | [SRC-05](../../../.protocols/experiments/runs/R-031/2026-08-13-live-boundary-mock-v1/safety-boundary.json) | `STOP-01`, `STOP-02` | `process*` and broad non-HOME reads remain; Mach denial lacks a named service probe. This is not a live-agent or production boundary. |
| `OBS-06` | A separate offline filesystem broker handled all 36 serialized requests and made zero provider calls; the broker rejects any mode other than `offline-mock`. | [SRC-04](../../../.protocols/experiments/r031-live-boundary-broker.ts), [SRC-05](../../../.protocols/experiments/runs/R-031/2026-08-13-live-boundary-mock-v1/safety-boundary.json) | Mock broker control | Provider ownership, credential handling and secret non-transit remain unexecuted. |
| `OBS-07` | Within every phase/family group, V0–V3 had the same common-context digest covering system prompt, mock model alias, task, fixture, golden result, authority and six-continuation budget. Each lineage exposed exactly one projection; retain-control and fresh-reuse alone shared the same variant/family workspace. The only attributable model-envelope difference was the four distinct projection digests. | [SRC-05](../../../.protocols/experiments/runs/R-031/2026-08-13-live-boundary-mock-v1/context-symmetry.json) | `RQ-01`, `STOP-01` symmetry prerequisite | Hash equality proves instrument inputs, not equal model interpretation or behavior. |

## Collection Log

| Date | Activity | Result | Deviation / reason |
| --- | --- | --- | --- |
| 2026-08-13 | Targeted direct-call control | 4 variants × 3 families pass | No deviation |
| 2026-08-13 | Fresh-process positive comparison | 12/12 exact tool/final, direct-call and composition checks pass; all three V3 cases cross the descriptor adapter | Offline deterministic control; no model |
| 2026-08-13 | Fresh-process false-success injection | 12/12 injected false-success cases detected | Offline deterministic control; no model |
| 2026-08-13 | Mock process/broker control | 36/36 fresh sandboxed child requests acknowledged by separate mock broker; all five named denial probes pass; zero provider calls | Two disposable setup attempts stopped before carrier while tightening paths/profile; accepted carrier lists unresolved process/read/Mach/runtime/broker gaps |
| 2026-08-13 | Mock prompt/context symmetry control | 9/9 phase/family groups have one common-context hash and four attributable projection hashes | Boundary-envelope mock only; live comparison remains blocked |

## Evidence Quality Check

- [x] Material observations trace to stable source records.
- [x] Sources are clickable and preserve provenance and checksums.
- [x] Observation and interpretation are separated.
- [x] The no-model limitation and pending independent review are explicit.
