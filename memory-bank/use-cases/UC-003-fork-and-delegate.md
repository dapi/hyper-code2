---
title: "UC-003: Fork Context And Delegate Work"
doc_kind: use_case
doc_function: canonical
purpose: Defines stable context branching and bounded parent-child agent delegation.
derived_from:
  - ../flows/use-case.md
  - ../product/context.md
  - ../domain/rules.md
  - ../domain/states.md
status: active
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - architecture_decision
  - feature_level_test_matrix
---

# UC-003: Fork Context And Delegate Work

## Goal

The operator or agent branches from existing context or delegates bounded work
without duplicating or corrupting the parent conversation.

## Primary Actor

Agent operator or parent coding agent.

## Trigger

The actor requests a fork at the current/selected conversation boundary or asks
another agent to perform a bounded task.

## Preconditions

- The parent agent and inherited conversation boundary exist.
- Delegation states an explicit task and expected return.

## Main Flow

1. A child agent is created with a reference to parent context up to a fixed boundary.
2. The child sees inherited context plus its own local continuation.
3. For delegation, the child receives the bounded task contract.
4. Parent and child can progress independently.
5. The child returns a result or failure to the parent delegation contract.

## Alternate Flows / Exceptions

- `ALT-01` A child is forked again; its offset is based on full inherited context.
- `EX-01` The delegated child fails; the parent receives an explicit failure outcome.
- `EX-02` Parent history changes after the boundary; the child's inherited prefix remains bounded.

## Postconditions

Each agent owns its local continuation; inherited context is assembled without a
full transcript copy, and delegation has an observable outcome.

## Business Rules

- `BR-01` Fork inheritance is prefix-bounded and immutable for that child.
- `BR-02` Delegation must remain bounded and return to the requesting parent.

## Traceability

| Upstream / Downstream | References |
| --- | --- |
| Domain | [Model](../domain/model.md), [rules](../domain/rules.md) |
| Engineering | [Architecture](../engineering/architecture.md) |
| Implementation | [Fork assembly](../../src/session/getFullMessages.ts), [delegation](../../src/agent/delegateTask.ts) |
