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
| `SRC-05` | [V6 read-only current-source delta audit](../../../src/self/$route_GET.ts), [current classifier](../../../src/project/classify.ts), [loader](../../../src/http/loadRoutes.ts), [function startup loader](../../../src/loadFns.ts) and [targeted reload](../../../src/repl/load.ts) | 2026-08-13; HEAD `44225bf29d8f17c4275faa29a9be5ba59b88793d` | Static enumeration and `2ab427a…44225bf` source diff; no listener, network or user state | Current committed surface is 37 entries; shared dispatch sources remain unchanged, but V5 is not current-complete |
| `SRC-06` | [V6 pre-collection author package](../../../.protocols/experiments/r032-v6/README.md), [collector](../../../.protocols/experiments/r032-v6/collector.ts), [stdio broker child](../../../.protocols/experiments/r032-v6/broker-child.ts), [author self-test](../../../.protocols/experiments/r032-v6/self-test.ts) and [exact freeze](../../../.protocols/experiments/r032-v6/freeze.json) | 2026-08-13; HEAD `44225bf`; freeze SHA-256 `0487736d2a2355ae151242e272be60869f232cde98760ed9eb7864284ce7f6ba` | Author-only in-memory validation; no evidence collection or candidate result carrier | Collection remains locked until independent pre-review accepts the exact freeze; author self-test output is method evidence only |
| `SRC-07` | [V6.1 additive pre-collection package](../../../.protocols/experiments/r032-v6_1/README.md), [collector](../../../.protocols/experiments/r032-v6_1/collector.ts), [sandboxed broker child](../../../.protocols/experiments/r032-v6_1/broker-child.ts), [self-test](../../../.protocols/experiments/r032-v6_1/self-test.ts) and [exact freeze](../../../.protocols/experiments/r032-v6_1/freeze.json) | 2026-08-13; HEAD `44225bf`; freeze SHA-256 `56629e9a86eb6a52fc1cc3cc2ac585b39a5b2155b6e016609300b9bdee30d4a8` | Corrected author package only; no collection | Requires a new independent pre-review; acceptance of any earlier freeze cannot authorize it |
| `SRC-08` | [V6.2 clean additive WIP package](../../../.protocols/experiments/r032-v6_2/README.md), [semantic contract](../../../.protocols/experiments/r032-v6_2/semantic-contract.ts), [collector infrastructure](../../../.protocols/experiments/r032-v6_2/collector-infra.ts), [no-spawn outer gate](../../../.protocols/experiments/r032-v6_2/outer-gate.ts), [contained child](../../../.protocols/experiments/r032-v6_2/contained-child.ts) and author self-tests | 2026-08-13; HEAD `c02b9ece0a1404d84428a2dce0a91599f954e83e`; no ready freeze | Detached semantic test passes; deny-default containment exits `134` even with probes disabled; no collection | `collectionUnauthorized`; containment, runtime integration and result-derived validation remain incomplete |

## Observations

| ID | Observation | Supporting `SRC-*` | Applies to | Interpretation boundary |
| --- | --- | --- | --- | --- |
| `OBS-01` | V5 loaded all 36 fixed entries through committed `loadRoutes`, produced 36 routes, exercised committed `match` and the captured `$start.fetch`, and observed replacement of an existing `/repl` handler through a second committed-loader call. | [SRC-01](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/results.json), [SRC-03](../../../.protocols/experiments/r032-committed-route-v5.ts), [SRC-04](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-route-control-v2/route-control-reconciliation.json) | `RQ-01`, `HYP-01`, `GATE-01`, `GATE-03` | The dispatched handler and overwrite module were safe synthetic replacements. No production handler, listener or arbitrary `.hyper` overlay executed. |
| `OBS-02` | The same route, reachability, browser/CLI lifecycle and restart result structure was emitted for all nine labels: `CAN-01…06` and `COM-01…03`. | [SRC-01](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/results.json) | `HYP-03`, fixture symmetry | Mechanical symmetry does not make the candidate mechanisms equally faithful. `CAN-06` remains an in-process broker label and cannot support process-separation or residual-authority conclusions. |
| `OBS-03` | The committed loader exposes no authority-policy/default/inheritance field. V5 therefore applied one experiment-local authorization wrapper and synthetic late, unclassified and overlay policies; it did not read user runtime state. | [SRC-01](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/manifest.json), [SRC-03](../../../.protocols/experiments/r032-committed-route-v5.ts) | `RSC-05`, `GATE-03` | Candidate default/inheritance results are prototype behavior, not current runtime policy or arbitrary-overlay proof. |
| `OBS-04` | Requested bind, modeled exposure, peer metadata and caller-authority change are separate fields, and every reachability row states `actualNetworkTested: false`. | [SRC-01](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/results.json) | `HYP-01`, `GATE-04` | This supports bounded structural separation only; it establishes neither interface reachability nor OS transport behavior. |
| `OBS-05` | Browser and CLI fixtures traverse start, reconnect, expiry, expiry recovery, revocation and revocation recovery through each label's same authorization adapter; restart rows separately record stale, missing and fresh root calls. | [SRC-01](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/results.json), [SRC-03](../../../.protocols/experiments/r032-committed-route-v5.test.ts) | `GATE-06`, `GATE-07` | These are coupled state models, not real UI, credential-channel, restart-process or usability evidence. |
| `OBS-06` | Independent review accepted V5 only as bounded carrier evidence. Gate interpretation is `G1 partial`, `G2 no evidence`, `G3 partial`, `G4 bounded structure`, `G5 no new evidence`, `G6 bounded model`, and `G7 partial`. | [SRC-01](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/README.md), [SRC-02](../../../.protocols/experiments/runs/R-032/2026-08-13-680be81-committed-route-v5/provenance.json), [SRC-03](../../../.protocols/experiments/r032-committed-route-v5.ts) | `GATE-01…07` | No whole hard gate is closed by V5. Candidate-level rows may inform further collection, but cannot support synthesis, ranking, recommendation or selection yet. |
| `OBS-07` | HEAD `44225bf` adds `GET /self`, changing the committed surface from V5's 36 entries to 37 (35 route modules plus two scripts). The shared `$start`/`loadRoutes`/`match`/`classify` sources did not change from V5. | [SRC-05](../../../src/self/$route_GET.ts) | current source freshness, `GATE-03` | V5 remains bounded historical evidence at `2ab427a`; its counts, inventory completeness and provenance cannot be presented as current. |
| `OBS-08` | `/self` checks loopback peer address before returning a read-only descriptor, while shared dispatch still has no caller identity/auth gate. Function startup/reload now records source receipts and targeted reload chooses the later overlay root. | [SRC-05](../../../src/self/$route_GET.ts) | reachability vs caller control, overlay provenance | Loopback is route-local reachability evidence, not caller authentication. No `.hyper` contents or runtime descriptor were read in this audit. |
| `OBS-09` | V6 is frozen only as a proposed pre-collection method: 37 explicit committed entries, an allowlisted disposable migration set, real captured dispatch/POST/queue/worker claim-frontier path, safe use-time gates, 9 × 16 symmetric cells, stdio broker protocol, and S0-S8 scans. | [SRC-06](../../../.protocols/experiments/r032-v6/README.md) | proposed V6 collection | Author in-memory self-tests do not establish candidate behavior, hard-gate results, process isolation or collection validity. No V6 evidence may be promoted before exact independent pre-review and collection. |
| `OBS-10` | Independent pre-review rejected freeze `0487736d…` before collection for root-independence, child containment, assertion, transition, detector/sink and carrier-contract gaps. | [SRC-06](../../../.protocols/experiments/r032-v6/freeze.json) | method history | The rejected author self-test is not candidate evidence. V6.1 is a new freeze and requires fresh review. |
| `OBS-11` | Independent pre-review rejected V6.1 freeze `56629e9a…` before collection. V6.2 starts clean and currently validates only callable-root separation, actual sink-adapter detector controls, a distinct generation-store restart boundary and one reusable semantic assertion suite. | [SRC-07](../../../.protocols/experiments/r032-v6_1/freeze.json), [SRC-08](../../../.protocols/experiments/r032-v6_2/README.md) | method history and WIP contract | V6.2 has no freeze and supplies no candidate, runtime-path, OS-containment or hard-gate evidence. |
| `OBS-12` | V6.2 infrastructure directly resolves the worktree HEAD without a subprocess and implements minimal-env sandbox launch, probes/deadline/digests and a carrier schema. Its deny-default Bun child exits `134` before receipts even with probes disabled; diagnostic broad reads start it but violate the boundary. Its fixture semantic suite is detached from runtime rows, so the added 144-row count gate is not result-derived validation. | [SRC-08](../../../.protocols/experiments/r032-v6_2/README.md) | method development | Successful detached semantic/outer-gate checks do not compensate for failed OS containment or missing runtime validation; no freeze or collection is authorized. |

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
| 2026-08-13 | Audited current committed surface after V5 and authored V6 pre-collection package | 37-entry drift and a 9 × 16 runtime-path method recorded | Collection locked pending exact-freeze independent pre-review; no V6 candidate observations collected |
| 2026-08-13 | Independent pre-review rejected V6 and author produced additive V6.1 corrections | Rejected freeze preserved; corrected package stops at a new exact review gate | No collection or candidate evidence |
| 2026-08-13 | Independent pre-review rejected V6.1; clean V6.2 contract work started at HEAD `7828ad9` | Callable-root, sink-control, restart-boundary and shared assertion contracts authored | Package explicitly WIP and collection unauthorized; no ready freeze or collection |

## Evidence Quality Check

- [x] Each material observation traces to one or more `SRC-*` records.
- [x] Sources link to primary local artifacts with exact provenance and checksums.
- [x] Observations are separated from gate interpretation and mechanism choice.
- [x] Synthetic, excluded and incompatible fidelity limits are explicit.
