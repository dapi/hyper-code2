---
title: "UC-002: Execute An Agent Action"
doc_kind: use_case
doc_function: canonical
purpose: Defines the observable action-result cycle inside an agent conversation.
derived_from:
  - ../flows/use-case.md
  - ../product/context.md
  - ../domain/rules.md
status: active
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - architecture_decision
  - feature_level_test_matrix
---

# UC-002: Execute An Agent Action

## Goal

An agent performs a typed operation, observes its result, and continues the same
conversation until it can answer the operator.

## Primary Actor

Coding agent; the operator observes the activity.

## Trigger

During a run, the agent emits one or more valid action markers.

## Preconditions

- The agent is in a running conversation.
- The requested action kind is supported.
- The effective trust boundary permits the operation.

## Main Flow

1. The agent requests an action in the marker protocol.
2. The runtime records and executes the action.
3. The operator can observe the action and its outcome.
4. A synthetic result returns to the conversation as system-produced context.
5. The agent continues reasoning and eventually produces another action or terminal answer.

## Alternate Flows / Exceptions

- `ALT-01` Several valid actions are emitted and executed in their parsed order.
- `EX-01` Parsing fails; corrective context is returned so the agent can retry.
- `EX-02` Execution fails; an explicit failure result returns to the conversation.
- `ALT-02` Terminal HTML is sanitized and rendered without another result turn.

## Postconditions

The conversation preserves a structurally complete action/result cycle, including
an observable failure when the operation did not succeed.

## Business Rules

- `BR-01` Action results do not count as new operator intent.
- `BR-02` Conversation edits must preserve action/result pairing.

## Traceability

| Upstream / Downstream | References |
| --- | --- |
| Domain | [Rules](../domain/rules.md), [events](../domain/events.md) |
| Engineering | [Agent protocol](../engineering/agent-protocol.md), [trust boundary](../engineering/security-boundary.md) |
| Implementation | [Run loop](../../src/agent/run.ts), [marker execution](../../src/agent/executeMarker.ts) |
