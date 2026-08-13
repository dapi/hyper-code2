---
title: "R-036: Research Decision"
doc_kind: research
doc_function: canonical
purpose: Decision-ready recommendation and promotion map for surface-aware self-change activation and recovery.
derived_from:
  - brief.md
  - synthesis.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-036: Research Decision

## Decision

| Field | Value |
| --- | --- |
| Decision owner | Danil Pismenny |
| Decision date | 2026-08-13 |
| Decision reference | Danil Pismenny: `Принимаю рекомендации R-035 и R-036.` |

The owner accepted `REC-01…05`; sibling `brief.md` records terminal disposition
`validated`.

## Decision Rationale

- `FND-01/02` show why current mutation primitives and a voluntary wrapper cannot support an enforced bounded-self-change claim.
- `FND-03/05` require surface-dependent approval and recovery.
- `FND-04/06` support versioned overlay staging plus a durable change state contract.
- `FND-07` and `LIM-01…05` block immediate mutation delivery and mechanism claims.

## Recommendation

- `REC-01` Accept the hybrid surface-aware contract direction in synthesis.
- `REC-02` For the first `.hyper` mutation slice, require immutable before and
  candidate identities, candidate-independent restore, live behavioral checks,
  durable audit and explicit final effective identity.
- `REC-03` Describe the first path as policy-governed, not comprehensively
  enforced, unless raw eval/bash/file mutation paths are separately mediated.
- `REC-04` Preserve explicit human approval for core, base prompt, migrations,
  security-sensitive, destructive, external and production changes.
- `REC-05` Resolve effective-origin semantics and rehearse recovery before
  accepting `EP-SI-06` for delivery.

## Alternatives Considered

| Alternative | Why not selected / what would change the decision |
| --- | --- |
| Current direct write/reload | Cannot meet proposal, recovery or truthfulness contract |
| In-process snapshot only | Could supplement staging but is not independent recovery |
| Git/worktree for every surface | Strong for tracked core, incompatible with transient same-session overlay needs |
| Comprehensive mediation now | Would expand into authority/security architecture; route separately if enforced approval is a release requirement |

## Promotion And Handoff Map

| ID | Accepted or retained fact | Canonical downstream owner | Target route / link |
| --- | --- | --- | --- |
| `HD-01` | Surface-aware approval/recovery contract direction | EP-002 roadmap/subissues after owner acceptance | Update epic disposition; no delivery implied |
| `HD-02` | Durable proposal ledger candidate | `EP-SI-05` | Feature Flow after linked issue and design gates |
| `HD-03` | Versioned `.hyper` activation/recovery candidate | `EP-SI-06` | Feature Flow after W2 and recovery/origin prerequisites |
| `HD-04` | Core/base-prompt governance remains separate | `EP-SI-07` | Separate Feature Flow and ADR when triggered |
| `HD-05` | Raw bypass mediation is a separate authority decision | EP-001 security successors or new routed owner | Research/ADR before any enforcement claim |

## Closure Check

- [x] Owner disposition recorded and `brief.md` moved to matching terminal state.
- [x] Synthesis answers `RQ-01` with limitations.
- [x] Recommendations trace to findings and blockers.
- [x] Handoffs do not create delivery or accepted architecture by implication.
