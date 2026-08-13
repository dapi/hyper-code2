---
title: "R-029: Research Decision"
doc_kind: research
doc_function: canonical
purpose: "Owner disposition and handoff for the bounded network caller-authority gap."
derived_from: [brief.md, synthesis.md, ../../flows/research.md]
status: active
audience: humans_and_agents
---
# R-029: Research Decision

## Decision

| Field | Value |
| --- | --- |
| Decision owner | Danil Pismenny |
| Decision date | 2026-08-13 |
| Decision reference | Danil Pismenny accepted the recommended sequence and authorized completion of the evidence gates on 2026-08-13; independent matrix review then signed off technical `STOP-01` |

## Decision Rationale

- `FND-01` establishes the independently reviewed bounded gap across all 36
  committed-`src` dispatch entries at the fixed baseline.
- `FND-02…04` distinguish requested bind configuration, caller control and
  actual reachability; `LIM-01…05` prevent a deployment-wide or mechanism claim.

## Recommendation

- `REC-01` Validate the bounded finding: committed `src` has no common or
  route-local caller identity/auth control before its dispatch entry boundaries.
- `REC-02` Keep non-local/shared support prohibited until a separately routed
  decision selects a target authority contract and delivery mechanism.
- `REC-03` Do not run real reachability merely to reconfirm the source-level gap;
  require it only for a concrete topology or rollout claim.

## Alternatives Considered

| Alternative | Why not selected / what would change the decision |
| --- | --- |
| Claim deployment-wide unauthenticated RCE | `.hyper`, external middleware, firewall/proxy state and real reachability were not tested. |
| Treat loopback binding alone as the solution | Bind policy and caller authorization are separate contracts. |
| Select auth tokens, process separation or another mechanism now | The research validates the gap, not comparative mechanism fitness. |

## Promotion and Handoff Map

| ID | Accepted or retained fact | Canonical downstream owner | Target route / link |
| --- | --- | --- | --- |
| `HD-01` | The committed-`src` caller-authority gap is validated within the reviewed scope. | EP-001 decision log and security boundary | [EP decision log](../../epics/EP-001/decision-log.md), [security boundary](../../engineering/security-boundary.md) |
| `HD-02` | A target contract must cover immediate and deferred authority while keeping bind/reachability separate. | New Research & Discovery or ADR route, depending on whether alternatives remain open | Route separately; no mechanism selected here |
| `HD-03` | Any implementation is a security-sensitive delivery unit, not a small change. | Future Feature Flow package | Create only after target contract/mechanism approval |

## Closure Check

- [x] Sibling `brief.md` records terminal `validated`.
- [x] Recommendation traces to independently reviewed findings and limitations.
- [x] No reachability claim, production mechanism, feature scope or ADR is selected.
