---
title: "EP-002: Subissues"
doc_kind: epic
doc_function: subissue_registry
purpose: Registry of accepted research outcomes and gated delivery candidates for inspectable and bounded self-evolution.
derived_from:
  - charter.md
  - roadmap.md
status: active
audience: humans_and_agents
must_not_define:
  - code_steps
---

# EP-002: Subissues

## Registry

| ID | Candidate issue title | Wave | Source | Status | Required route / package |
| --- | --- | --- | --- | --- | --- |
| `EP-SI-01` | Define the truthful SelfDescriptor contract | `W1A` | PRD-002 `G-10`, `BR-08`, `VAL-09`; UC-008 | validated | [R-035](../../research/R-035/README.md); owner accepted recommendations |
| `EP-SI-02` | Define surface-aware self-change activation and rollback contracts | `W1B` | PRD-002 `BR-09`, `OQ-09`; UC-008 | validated | [R-036](../../research/R-036/README.md); owner accepted recommendations |
| `EP-SI-03` | Deliver a read-only current agent self-model | `W2` | outcome of `EP-SI-01`; UC-008 steps 1–2 | accepted delivery outcome; issue pending | Feature Flow after linked GitHub issue; #35 is a separately routed prerequisite |
| `EP-SI-04` | Deliver an inspectable self-model surface | `W2` | outcome of `EP-SI-01`; UC-008 observable status | candidate; may merge with `EP-SI-03` if one delivery unit remains coherent | Feature Flow after design boundary is known |
| `EP-SI-05` | Persist self-change proposals and state transitions | `W3` | outcome of `EP-SI-02`; UC-008 steps 4–5 | candidate | Feature Flow after `HG-03` |
| `EP-SI-06` | Activate and roll back bounded `.hyper/` changes | `W3` | outcomes of `EP-SI-02/03/05`; UC-008 steps 6–9 | blocked candidate | Feature Flow after `HG-04`; security and recovery gates required |
| `EP-SI-07` | Govern shipped-core and base-prompt self-change | `W4` | outcome of `EP-SI-02`; UC-008 `BR-04` | blocked candidate | Separate Feature Flow; ADR and explicit human approval when triggered |
| `EP-SI-08` | Produce reflection candidates without silent activation | `W5` | PRD-002 `G-08`, `BR-06/09`; UC-006/008 | blocked candidate | Separate routing and feature package after `HG-05` |
| `EP-SI-09` | Evaluate end-to-end UC-008 behavior | `W6` | PRD-002 `VAL-09`; delivered slices | candidate research | Research & Discovery with predeclared representative cases |

## Creation Rules

- `accepted research outcome` approves the question and boundary, not a mechanism or delivery implementation.
- Research packages do not create delivery approval by producing a preferred candidate.
- A delivery candidate becomes accepted only after its upstream gate and owner disposition.
- Create a GitHub issue before creating its `memory-bank/features/FT-<issue>/` package.
- Keep self-model delivery read-only until `EP-SI-02` is independently resolved.
- Do not combine core/prompt governance, overlay mutation and reflection merely because they share the term self-change.

## Separately Routed Prerequisite

- [GitHub issue #35](https://github.com/dapi/hyper-code2/issues/35) owns the
  effective-origin hot-reload defect identified by R-035 `HD-02`. It follows
  Bug Fix Flow and remains distinct from the read-only SelfDescriptor feature.
