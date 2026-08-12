---
title: "UC-005: Extend And Reuse An Agent Capability"
doc_kind: use_case
doc_function: canonical
purpose: Defines the draft project-level scenario in which useful agent work becomes an inspectable callable capability available to later work.
derived_from:
  - ../flows/use-case.md
  - ../prd/PRD-002-self-extending-agent-harness.md
status: draft
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - architecture_decision
  - feature_level_test_matrix
---

# UC-005: Extend And Reuse An Agent Capability

## Goal

An operator or harness builder completes useful work through ordinary code and
can retain a generally useful part as an inspectable callable capability that is
available to later relevant work.

## Primary Actor

Developer/operator or harness builder working with a coding agent.

## Trigger

A task needs a capability that may already exist, can be composed from existing
functions and SDKs, or is worth retaining beyond the immediate task.

## Preconditions

- The actor is trusted to exercise the effective process authority.
- Existing functions and their callable contracts can be inspected or searched.
- The actor or agent may change the applicable extension area.
- Secret values are not assumed safe merely because the task runs locally; the
  target non-transit contract remains a separate security requirement.

## Main Flow

1. The actor states the desired task outcome.
2. The agent inspects relevant existing functions, SDKs, and source before
   deciding that a new capability is necessary.
3. The task is completed by composing existing code, adding a callable
   capability, or combining both.
4. Any retained capability is visible as an ordinary project change with an
   inspectable callable contract and observable behavior.
5. In later relevant work, the capability can be found, called, composed, or
   improved instead of requiring an isolated tool wrapper.

This flow does not require every one-off program to be retained and does not
define a universal `discover → compose → save → verify → reuse` lifecycle.

## Alternate Flows / Exceptions

- `ALT-01` A suitable capability already exists; the agent uses or composes it
  without creating another one.
- `ALT-02` The code is intentionally one-off and is not retained as a shared
  function.
- `ALT-03` A retained capability fails its observable check; the change remains
  explicit and is corrected or reverted rather than silently treated as reusable.
- `EX-01` Relevant discovery is insufficient; the agent reports the gap instead
  of claiming that no reusable capability exists.
- `EX-02` Reload or execution fails; durable work remains available and the
  failure is observable.

## Postconditions

- The immediate task has an observable outcome or explicit failure.
- If a capability was retained, its code and callable contract are inspectable.
- Reuse remains a measurable product hypothesis until demonstrated on later
  representative work.

## Business Rules

- `BR-01` Existing capabilities are inspected before unnecessary duplication.
- `BR-02` Writing a file or reloading it does not alone prove reusability.
- `BR-03` Retaining task-specific work is an explicit, reviewable project change.
- `BR-04` This use case does not prescribe a specific index, retrieval system,
  source layout, or capability-promotion workflow.

## Traceability

| Upstream / Downstream | References |
| --- | --- |
| PRD | [PRD-002](../prd/PRD-002-self-extending-agent-harness.md) |
| Related use cases | [UC-001](UC-001-run-agent-task.md), [UC-002](UC-002-execute-agent-action.md), [UC-004](UC-004-hot-reload-capability.md) |
| Features | none; delivery routing has not happened |
| ADR | none |

