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
| `FND-01` | At the fixed source baseline, the complete 36-entry matrix found no common-dispatch or route-local caller identity/authorization gate. All 108 synthetic dispatcher cases reached their entry boundary, while representative direct-handler mocks reached authority stubs. | [OBS-08](evidence.md#observations), [OBS-09](evidence.md#observations), [OBS-11](evidence.md#observations), [OBS-13](evidence.md#observations) | High for the independently reviewed committed-`src` claim | Establishes the technical basis for a caller-authority gap in committed `src`, but does not select a mechanism or cover external middleware/runtime overlays |
| `FND-02` | Requested all-interface binding and route authority are separable observations: the mock captured `0.0.0.0`, while direct handlers independently accepted missing or malformed identity material. | [OBS-02](evidence.md#observations), [OBS-03](evidence.md#observations), [SRC-06](../../../src/http/$start.ts) | High for configuration/handler behavior | Supports `HYP-01`; a bind change alone cannot establish route authorization, and route authorization alone does not establish interface reachability |
| `FND-03` | `/repl` is the broadest direct network-to-process bridge in the fixed sample, while agent-message submission can defer similarly broad authority through model and marker execution. | [OBS-04](evidence.md#observations), [SRC-08](../../../src/agent/executeMarker.ts) | High for capability reachability; medium for downstream execution because it is deferred | The target contract must cover both immediate handlers and queued/deferred execution, not only the `/repl` endpoint |
| `FND-04` | The technical static/mock collection and independent review reconcile every committed-source dispatch entry and the bounded caller-control claim; authority timing remains a manual code-path classification and real interface reachability is untested. | [OBS-08](evidence.md#observations), [OBS-09](evidence.md#observations), [OBS-10](evidence.md#observations), [OBS-12](evidence.md#observations), [OBS-13](evidence.md#observations) | High for collection/review completeness within scope | Supports the terminal bounded validation; real topology and mechanism selection remain separately gated |

## Limitations and Disconfirming Evidence

| ID | Limitation / conflicting signal | Effect on conclusion | Mitigation or next question |
| --- | --- | --- | --- |
| `LIM-01` | `.hyper` can add or override routes after committed `src` and was excluded from this fixed-HEAD sample. | Prevents a universal claim about every runtime route. | Capture and hash an overlay manifest for any concrete runtime before evaluating that runtime. |
| `LIM-02` | No real socket or isolated peer was used. | Requested bind options do not prove which interfaces can actually connect. | Keep real reachability gated; run it only if the decision owner needs interface evidence beyond source configuration. |
| `LIM-03` | Direct/transitive authority labels include collector-authored manual call-path review; independent sign-off covered caller-control absence but did not certify every timing label as runtime behavior. | A missed indirect call can under-classify a route, though it cannot negate observed high-authority paths. | Treat labels as bounded code-path classifications and validate selected delivery surfaces downstream. |
| `LIM-04` | Synthetic requests do not model a reverse proxy, host firewall or external identity layer. | Such a layer could disconfirm a deployment-wide “unauthenticated” claim. | No such deployment owner exists in repository evidence; inspect it separately if one is introduced. |
| `LIM-05` | The first carrier's worktree was dirty outside `src`; the additive carrier ran at a later documentation HEAD while proving no committed or worktree `src` difference from `d119f1c`. | The evidence describes the source baseline, not either whole repository state. | Both provenance records preserve the boundary and the v2 instrument fails on source drift. |

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
It also does not establish actual interface reachability. The evidence supports
the terminal bounded validation recorded in `decision.md`. Mechanism comparison
and any real reachability test remain separately gated.

## Review Check

- [x] Every finding traces through linked observations to linked sources.
- [x] Confidence is scoped to the fixed committed source snapshot.
- [x] Overlay, topology, manual-classification and dirty-worktree limits are visible.
- [x] No authority mechanism or delivery change is selected.
- [x] Technical collection covers all 36 committed-source entries and nine authority classes.
- [x] Independent reviewer signed off the bounded committed-`src` caller-control claim and technical `STOP-01`.
