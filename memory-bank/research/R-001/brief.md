---
title: "R-001: UC-005 Current-Runtime Validation"
doc_kind: research
doc_function: canonical
purpose: "Canonical decision question, boundaries and lifecycle state for current-runtime UC-005 validation."
derived_from:
  - ../../flows/research.md
  - ../../prd/PRD-002-self-extending-agent-harness.md
  - ../../use-cases/UC-005-extend-and-reuse-capability.md
status: active
research_status: decision_ready
audience: humans_and_agents
---

# R-001: UC-005 Current-Runtime Validation

## Intake

| Field | Value |
| --- | --- |
| Source / trigger | [EP-001](../../epics/EP-001/README.md), GitHub #25 |
| Research owner | Codex under Danil Pismenny's orchestration protocol |
| Decision owner | Danil Pismenny |
| Research mode | `product_discovery` with technical experiment |
| Decision deadline / timebox | First bounded run on 2026-08-13; next collection only after owner disposition |

## Decision Question

- `RQ-01` Can the current runtime support a correct, inspectable capability extension
  and later reuse scenario on representative work, and what should be tested or
  changed before selecting a broader runtime architecture?

## Working Hypotheses

- `HYP-01` An agent can retain and later reuse an ordinary callable capability with
  exact task correctness under the current runtime.
- `HYP-02` The first material blocker can be identified without presupposing a
  mediated capability registry or compact-result API.

## Scope

- `RSC-01` Three deterministic offline task families and one-off versus later-use behavior.
- `RSC-02` Correctness, discovery, calls, tokens, errors, control invocation,
  fresh-process reuse and false-success behavior.

## Non-Scope

- `RNS-01` Production feature implementation or selection of a global architecture.
- `RNS-02` Real secrets, HTTP exposure, multi-user behavior or adversarial sandboxing.

## Assumptions and Known Evidence

| ID | Statement | Type | Source / confidence |
| --- | --- | --- | --- |
| `ASM-01` | Deterministic offline fixtures are sufficient for the first comparison. | Assumption | Bounded first slice; external validity remains open. |
| `EVD-01` | Existing write/reload/call paths can expose a retained function in-process and after restart. | Evidence | [Evidence log](evidence.md), one task family. |

## Stopping Condition

- `STOP-01` Stop the first pass after a reproducible scripted control and one live
  run have either met the thresholds or exposed a concrete failure; return to the
  owner before expanding cost or choosing architecture.

## Open Questions

| Question | Blocks | Owner | Resolution evidence |
| --- | --- | --- | --- |
| Do the other two task families reproduce the discovery/correctness failure? | Full `VAL-01…05` verdict | Danil Pismenny | Approved continuation and fixed-fixture runs |
| Which capability surface best prevents signature misuse without reducing composition? | Architecture selection | R-014 / Danil Pismenny | Comparative experiment |

## Boundary Check

- [x] The brief owns questions and hypotheses, not findings.
- [x] Known evidence links to the evidence owner.
- [x] No delivery scope or architecture is selected here.
- [x] Privacy/security constraints are explicit.
