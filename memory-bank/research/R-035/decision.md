---
title: "R-035: Research Decision"
doc_kind: research
doc_function: canonical
purpose: Decision-ready recommendation and promotion map for the truthful SelfDescriptor contract.
derived_from:
  - brief.md
  - synthesis.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-035: Research Decision

## Decision

| Field | Value |
| --- | --- |
| Decision owner | Danil Pismenny |
| Decision date | 2026-08-13 |
| Decision reference | Danil Pismenny: `Принимаю рекомендации R-035 и R-036.` |

The owner accepted `REC-01…04`; sibling `brief.md` records terminal disposition
`validated`.

## Decision Rationale

- `FND-01/02` rule out prompt-only and registry-only contracts as truthful self-models.
- `FND-03/04` support a compact grounded descriptor with explicit epistemic metadata.
- `FND-05` identifies a real effective-origin blocker that the delivery must not hide.
- `LIM-01…04` prevent this desk pass from claiming a delivered or security-complete mechanism.

## Recommendation

- `REC-01` Accept `CAND-03` as the SelfDescriptor contract direction described in
  synthesis, with exact API/storage/hashing deferred to W2 design.
- `REC-02` Require every material descriptor field or component to expose status,
  provenance and freshness rather than filling unknowns from prompt knowledge.
- `REC-03` Route the startup/hot-reload effective-origin conflict as a bounded
  prerequisite or explicit W2 design dependency with regression evidence.
- `REC-04` Keep W2 read-only and require sentinel-based secret-value non-transit
  verification before authority metadata is model-visible.

## Alternatives Considered

| Alternative | Why not selected / what would change the decision |
| --- | --- |
| Prompt-only map | Cannot prove current implementation; only acceptable as navigation to live descriptor |
| Registry-only inspection | Could remain a low-level input, not the product contract |
| Full raw dump | Context and secret risks dominate; only bounded drill-down reads may supplement the descriptor |
| No unified descriptor | Reconsider only if a W2 prototype shows the joined contract is unusable or materially misleading |

## Promotion And Handoff Map

| ID | Accepted or retained fact | Canonical downstream owner | Target route / link |
| --- | --- | --- | --- |
| `HD-01` | Recommended minimum SelfDescriptor contract direction | EP-002 `EP-SI-03/04` after owner acceptance | Feature Flow; create linked issue and feature package |
| `HD-02` | Effective-origin conflict blocks correctness claims | Separate bug/contract task or W2 dependency | Repeat Task Routing before mutation |
| `HD-03` | Project-wide resolver/provenance choice may require ADR | ADR owner if W2 design selects reusable architecture | ADR Flow before Solution Ready |

## Closure Check

- [x] Owner disposition recorded and `brief.md` moved to matching terminal state.
- [x] Synthesis answers `RQ-01` with limitations.
- [x] Recommendation traces to findings and limitations.
- [x] Handoff does not imply delivery or accepted architecture.
