---
title: "R-014: Research Synthesis"
doc_kind: research
doc_function: canonical
purpose: "Findings and limitations from the first capability-surface comparison."
derived_from: [brief.md, evidence.md]
status: active
audience: humans_and_agents
---
# R-014: Research Synthesis

## Findings

| ID | Finding | Evidence | Confidence | Implication |
| --- | --- | --- | --- | --- |
| `FND-01` | Current surface has real composability/reuse evidence and a real discovery/signature failure. | [OBS-01](evidence.md#observations) | medium | Improvement is justified; replacement is not. |
| `FND-02` | Typed projection may be improved independently of forcing every call through mediation. | [OBS-02](evidence.md#observations) | medium | Include a bounded hybrid in the comparison. |
| `FND-03` | No candidate has comparable runtime evidence. | [OBS-03](evidence.md#observations) | high | Selecting #16 or an ADR now would be speculative. |

## Limitations

| ID | Limitation | Effect | Next question |
| --- | --- | --- | --- |
| `LIM-01` | Asymmetric evidence and no candidate prototypes | Cannot rank alternatives | What is the smallest disposable projection for an A/B fixture? |
| `LIM-02` | Current evidence is one task/model/run | Failure frequency unknown | Does it repeat across the fixed task set? |

## Answer to Decision Question

The evidence cannot yet identify a preferred capability surface. It supports a
bounded comparative prototype and rejects immediate activation of #16. No global
architecture decision or ADR is justified.
