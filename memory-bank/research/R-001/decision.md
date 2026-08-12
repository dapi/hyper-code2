---
title: "R-001: Research Decision"
doc_kind: research
doc_function: canonical
purpose: "Recommendation and handoff map for the first UC-005 experiment."
derived_from:
  - brief.md
  - synthesis.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-001: Research Decision

## Decision

| Field | Value |
| --- | --- |
| Decision owner | Danil Pismenny |
| Decision date | Pending owner disposition |
| Decision reference | This package is `decision_ready`; no terminal disposition is implied |

## Decision Rationale

- `FND-01` supports mechanism feasibility, while `FND-02` shows a strict
  end-to-end correctness failure.
- `FND-03` points to discovery and contract clarity, but `LIM-01…04` prevent a
  reliable product or global architecture decision.

## Recommendation

- `REC-01` Revise and continue the fixed-fixture experiment, adding explicit
  callable-contract and false-success checks; keep the product hypothesis open.
- `REC-02` Run #14 as comparative research before activating #16 or writing an ADR.
- `REC-03` Defer #12 until a controlled comparison shows diagnostic/result volume
  materially affects correctness or cost.

## Alternatives Considered

| Alternative | Why not selected / what would change the decision |
| --- | --- |
| Accept the current runtime unchanged | One live later-use run produced false success. |
| Select mediated invocation now | No comparative implementation or evidence exists. |
| Start compact-result delivery | The first run did not isolate result volume as the blocker. |
| Stop PRD-002 | One task family cannot invalidate the broader hypothesis. |

## Promotion and Handoff Map

| ID | Accepted or retained fact | Canonical downstream owner | Target route / link |
| --- | --- | --- | --- |
| `HD-01` | Current runtime mechanism is feasible but strict live validation is not met. | EP-001 decision log | [Decision log](../../epics/EP-001/decision-log.md) |
| `HD-02` | Capability-surface comparison is triggered without a selected solution. | Research issue #14 | [GitHub #14](https://github.com/dapi/hyper-code2/issues/14) |
| `HD-03` | Compact-result work remains evidence-gated. | Research issue #12 | [GitHub #12](https://github.com/dapi/hyper-code2/issues/12) |

## Closure Check

- [ ] Owner records a terminal disposition in `brief.md`.
- [x] Recommendation is traceable to findings and limitations.
- [x] Handoff does not select architecture or implementation by implication.
