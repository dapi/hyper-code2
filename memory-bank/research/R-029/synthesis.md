---
title: "R-029: Research Synthesis"
doc_kind: research
doc_function: canonical
purpose: "Bounded findings from the fixed-snapshot network-to-process authority inventory."
derived_from:
  - brief.md
  - evidence.md
status: active
audience: humans_and_agents
---

# R-029: Research Synthesis

## Findings

| ID | Finding | Evidence | Confidence | Implication for `RQ-*` / `HYP-*` |
| --- | --- | --- | --- | --- |
| `FND-01` | At fixed HEAD, the static inventory found no route-local caller identity or authorization gate, and 11 representative mocks reached process-authority stubs without such a gate. | [OBS-02](evidence.md#observations), [OBS-04](evidence.md#observations), [SRC-02](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-static-mock/route-authority-inventory.json), [SRC-03](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-static-mock/mock-results.json) | Medium pending route/control reconciliation and independent review | Strongly indicates a caller-authority gap in committed `src`, but does not yet complete the plan or select a mechanism |
| `FND-02` | Requested all-interface binding and route authority are separable observations: the mock captured `0.0.0.0`, while direct handlers independently accepted missing or malformed identity material. | [OBS-02](evidence.md#observations), [OBS-03](evidence.md#observations), [SRC-06](../../../src/http/$start.ts) | High for configuration/handler behavior | Supports `HYP-01`; a bind change alone cannot establish route authorization, and route authorization alone does not establish interface reachability |
| `FND-03` | `/repl` is the broadest direct network-to-process bridge in the fixed sample, while agent-message submission can defer similarly broad authority through model and marker execution. | [OBS-04](evidence.md#observations), [SRC-08](../../../src/agent/executeMarker.ts) | High for capability reachability; medium for downstream execution because it is deferred | The target contract must cover both immediate handlers and queued/deferred execution, not only the `/repl` endpoint |
| `FND-04` | The partial static/mock stage is sufficient to justify continued security work, but not to complete the plan, confirm every route/control combination, or claim real interface reachability. | [OBS-02](evidence.md#observations), [OBS-03](evidence.md#observations), [OBS-06](evidence.md#observations), [OBS-07](evidence.md#observations) | High for the stated limitation | Complete reconciliation and reviewer sign-off precede decision readiness; real topology remains separately gated |

## Limitations and Disconfirming Evidence

| ID | Limitation / conflicting signal | Effect on conclusion | Mitigation or next question |
| --- | --- | --- | --- |
| `LIM-01` | `.hyper` can add or override routes after committed `src` and was excluded from this fixed-HEAD sample. | Prevents a universal claim about every runtime route. | Capture and hash an overlay manifest for any concrete runtime before evaluating that runtime. |
| `LIM-02` | No real socket or isolated peer was used. | Requested bind options do not prove which interfaces can actually connect. | Keep real reachability gated; run it only if the decision owner needs interface evidence beyond source configuration. |
| `LIM-03` | Direct/transitive authority labels include manual call-path review. | A missed indirect call can under-classify a route, though it cannot negate observed high-authority paths. | Independent matrix review or call-graph tooling before implementation acceptance. |
| `LIM-04` | Synthetic requests do not model a reverse proxy, host firewall or external identity layer. | Such a layer could disconfirm a deployment-wide “unauthenticated” claim. | No such deployment owner exists in repository evidence; inspect it separately if one is introduced. |
| `LIM-05` | The worktree was dirty outside `src` during collection. | Does not change the inventoried code snapshot, but prevents treating the whole worktree as `d119f1c`. | Provenance preserves the exact limitation; source collection aborts on any `src` diff. |

## Answer to Decision Question

Before any non-local or shared deployment is supported, the target contract must
make network caller authority explicit and deny an untrusted caller before that
caller can reach any immediate or deferred process-authority path. Its coverage
must include dynamic route registration, `/repl`, file and settings mutation,
agent/session control, agent scheduling and the later model/marker execution it
can trigger. Bind/interface policy and caller authorization must be stated as
separate parts of the contract.

The collected evidence does **not** choose loopback-only binding, authentication,
capability tokens, route/process separation or another implementation mechanism.
It also does not establish actual interface reachability. R-029 therefore remains
in collection pending complete route/control reconciliation and independent
matrix review. Mechanism comparison and any real reachability test remain
separately gated.

## Review Check

- [x] Every finding traces through linked observations to linked sources.
- [x] Confidence is scoped to the fixed committed source snapshot.
- [x] Overlay, topology, manual-classification and dirty-worktree limits are visible.
- [x] No authority mechanism or delivery change is selected.
