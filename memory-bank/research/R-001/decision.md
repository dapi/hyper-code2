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
| Decision date | 2026-08-13 |
| Decision reference | Danil Pismenny accepted the 2026-08-13 recommendation to conclude the current cycle and not run the remaining families until the discovery/retention contract changes; [GitHub #25 disposition record](https://github.com/dapi/hyper-code2/issues/25#issuecomment-5273152772) |

## Decision Rationale

- `FND-01` supports mechanism feasibility, while `FND-02` and `FND-06` show that
  two versions of the first live path did not establish reliable retention and
  reuse under their fixed contracts.
- `FND-03` points to discovery and callable-contract clarity, while `LIM-01…04`
  and `LIM-08` prevent a reliable product or global architecture decision.
- The evidence is sufficient to stop this research cycle, but not to invalidate
  retention/reuse for all representative work or to select a runtime mechanism.

## Recommendation

- `REC-01` Conclude this research cycle as `inconclusive`: the current
  runtime/model did not confirm retention and later reuse under the tested
  discovery/retention contracts.
- `REC-02` Use the terminal R-014 desk pass to frame a separate symmetric
  runtime-comparison cycle before activating #16 or writing an ADR.
- `REC-03` Defer #12 until a controlled comparison shows diagnostic/result volume
  materially affects correctness or cost.
- `REC-04` Do not run the remaining task families under the unchanged contract.
  If the owner wants further validation, route a new research cycle with a
  changed, versioned discovery/retention contract and fresh approval.

## Owner Decision

Danil Pismenny accepted `REC-01` and `REC-04` on 2026-08-13. R-001 moved through
`decision_ready` to terminal disposition `inconclusive`. The unrun families are
not pending work in this cycle. No delivery feature, capability mechanism or ADR
is selected; any changed contract must be routed separately.

## Alternatives Considered

| Alternative | Why not selected / what would change the decision |
| --- | --- |
| Accept the current runtime unchanged | The first run produced false success; the v2 repetition created no retained capability within the call budget. |
| Select mediated invocation now | No comparative implementation or evidence exists. |
| Start compact-result delivery | The first run did not isolate result volume as the blocker. |
| Run the two remaining families unchanged | Repeating the first family exposed another concrete failure; expanding the unchanged sample would not resolve the discovery/retention contract uncertainty. |
| Invalidate PRD-002 | One task family and one configured model alias cannot invalidate the broader product direction. |

## Promotion and Handoff Map

| ID | Accepted or retained fact | Canonical downstream owner | Target route / link |
| --- | --- | --- | --- |
| `HD-01` | Current runtime mechanism is feasible but strict live validation is not met. | EP-001 decision log | [Decision log](../../epics/EP-001/decision-log.md) |
| `HD-02` | Capability-surface runtime comparison is triggered without a selected solution; the R-014 desk pass itself is inconclusive. | Research issue #14 and a new governed research cycle | [GitHub #14](https://github.com/dapi/hyper-code2/issues/14), [R-014 decision](../R-014/decision.md) |
| `HD-03` | Compact-result work remains evidence-gated. | Research issue #12 | [GitHub #12](https://github.com/dapi/hyper-code2/issues/12) |
| `HD-04` | A future validation cycle first needs a changed, versioned discovery/retention contract; this is a research question, not an approved delivery outcome. | Future Research & Discovery routing | No package or feature created by this decision |

## Continuation Check

- [x] Earlier owner continuation decision and the post-v2 terminal decision are recorded.
- [x] Revised collection stopped and `brief.md` is terminal `inconclusive`.
- [x] Owner review records the transition through `decision_ready` to `inconclusive`.
- [x] Recommendation is traceable to findings and limitations.
- [x] Handoff does not select architecture or implementation by implication.
