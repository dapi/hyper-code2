---
title: "R-001: Research Synthesis"
doc_kind: research
doc_function: canonical
purpose: "Findings and limitations from the first current-runtime UC-005 experiment."
derived_from:
  - brief.md
  - evidence.md
status: active
audience: humans_and_agents
---

# R-001: Research Synthesis

## Findings

| ID | Finding | Evidence | Confidence | Implication |
| --- | --- | --- | --- | --- |
| `FND-01` | The current runtime has the technical substrate to write, hot-reload and invoke an ordinary callable after restart. | [OBS-01, OBS-03](evidence.md#observations) | high for mechanism | Supports feasibility, not product success. |
| `FND-02` | The first live end-to-end task fails the strict experiment contract because later reuse called the wrong signature and produced a false-success answer. | [OBS-04](evidence.md#observations) | high for this run | `HYP-01` is not validated. |
| `FND-03` | Discovery and callable-contract clarity are the first observed architectural pain; compact result volume is not yet supported as the priority. | [OBS-02, OBS-04, OBS-05](evidence.md#observations) | medium | Triggers comparison in #14; defers #12 implementation. |
| `FND-04` | One sentinel stayed out of captured model context, but no general secret non-transit guarantee was tested. | [OBS-06](evidence.md#observations) | high for the sentinel, low for generalization | Continue #18 research independently. |

## Limitations and Disconfirming Evidence

| ID | Limitation / conflicting signal | Effect on conclusion | Mitigation or next question |
| --- | --- | --- | --- |
| `LIM-01` | Only one of three task families ran live. | Cannot decide the overall product hypothesis. | Run remaining fixed fixtures after owner approves revised prompt/contract. |
| `LIM-02` | One model and one run; model variance uncontrolled. | Failure frequency is unknown. | Repeat fixed runs or compare models only after instrument freeze. |
| `LIM-03` | Retain used imported filesystem APIs rather than intended marker. | Product inspectability path was not faithfully exercised. | Tighten experiment authority and expected write path. |
| `LIM-04` | No competing capability surface was implemented. | Cannot select current, mediated, generated or hybrid architecture. | Conduct #14 comparative research. |

## Answer to Decision Question

The current runtime is technically capable of retaining and reloading an ordinary
function, but the first live scenario does not satisfy the correctness contract.
Evidence is sufficient to revise and continue the experiment around discovery,
typed callable contracts and false-success detection. It is insufficient to
validate PRD-002, select mediation, or prioritize compact-result delivery.

## Review Check

- [x] Findings trace to observations and sources.
- [x] Confidence reflects the one-run evidence boundary.
- [x] Alternatives and remaining uncertainty are explicit.
