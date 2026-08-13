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
| `FND-01` | The current runtime has the technical substrate to write, hot-reload and invoke an ordinary callable from another context in the same Bun process. | [OBS-01, OBS-03](evidence.md#observations) | high for this mechanism | Supports same-process feasibility, not process-restart reuse or product success. |
| `FND-02` | The first live end-to-end task fails the strict experiment contract because later reuse called the wrong signature and produced a false-success answer. | [OBS-04](evidence.md#observations) | high for this run | `HYP-01` is not validated. |
| `FND-03` | Discovery and callable-contract clarity are the first observed architectural pain; compact result volume is not yet supported as the priority. | [OBS-02, OBS-04, OBS-05](evidence.md#observations) | medium | Triggers comparison in #14; defers #12 implementation. |
| `FND-04` | The first-run sentinel was absent from captured context, while v2 only checked for accidental appearance without injecting it into the tested pipeline; no secret non-transit guarantee was tested. | [OBS-06, OBS-10](evidence.md#observations) | low for non-transit | Continue #18 research independently. |
| `FND-05` | Instrument v2 establishes an auditable experiment boundary and real OS-process separation on the tested macOS host without changing production architecture. | [OBS-07](evidence.md#observations) | high for this run | Further product evidence can be trusted within the stated experiment boundary; production `HG-02` remains open. |
| `FND-06` | Repeating the same family removed the false-success ambiguity but still failed the retain/reuse contract: the agent spent its budget on discovery, created no capability, and restart correctly found none. | [OBS-08, OBS-09, OBS-10](evidence.md#observations) | high for this run | Current prompt/runtime does not yet demonstrate reliable explicit retention and later reuse. |

## Limitations and Disconfirming Evidence

| ID | Limitation / conflicting signal | Effect on conclusion | Mitigation or next question |
| --- | --- | --- | --- |
| `LIM-01` | Only one of three task families ran live. | Cannot decide the overall product hypothesis. | Run remaining fixed fixtures after owner approves revised prompt/contract. |
| `LIM-02` | One model and one run; model variance uncontrolled. | Failure frequency is unknown. | Repeat fixed runs or compare models only after instrument freeze. |
| `LIM-03` | Retain used imported filesystem APIs rather than intended marker. | Product inspectability path was not faithfully exercised. | Tighten experiment authority and expected write path. |
| `LIM-04` | No competing capability surface was implemented. | Cannot select current, mediated, generated or hybrid architecture. | Frame the symmetric runtime-comparison successor identified by the terminal R-014 desk pass. |
| `LIM-05` | The runner was unrestricted; environment and filesystem boundaries were prompt-level instructions rather than technical controls. | The first pass does not satisfy `HG-02` and is not security validation. | Enforce the boundary in the revised instrument before another live run. |
| `LIM-06` | Raw transcript/database and retained capability artifacts remained ephemeral. | Independent review cannot reconstruct every primary observation from repository evidence. | Preserve sanitized primary artifacts and checksums in the revised pass. |
| `LIM-07` | The v2 broker is experiment support, not shipped production behavior. | Experiment containment cannot be promoted to a product security claim. | Keep R-018/R-029 independent and do not mark production `HG-02` complete. |
| `LIM-08` | The second live pass still covers only tag normalization and one configured model alias. | Overall `VAL-01…05` remains undecided. | The owner stopped this cycle; any generalization requires a separately routed cycle with a changed discovery/retention contract. |

## Answer to Decision Question

The revised instrument now provides isolated, reviewable evidence and a real
separate-process restart check. Under that instrument, the current runtime/model
completed the one-off baseline but did not retain a capability within the fixed
call budget, so later reuse and restart correctly found nothing. This strengthens
the conclusion that discovery and retention guidance are unresolved and removes
the earlier false-success ambiguity. The current cycle therefore cannot confirm
retention/reuse and is terminally inconclusive. It remains insufficient to
validate PRD-002, select mediation, prioritize compact-result delivery, or
generalize to the two unrun task families. Those families must not run under the
unchanged contract; a changed contract requires a new, separately routed
research cycle.

## Review Check

- [x] Findings trace to observations and sources.
- [x] Confidence reflects the one-run evidence boundary.
- [x] Alternatives and remaining uncertainty are explicit.
