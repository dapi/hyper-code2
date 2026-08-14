---
title: "UC-001: Run An Agent Task"
doc_kind: use_case
doc_function: canonical
purpose: Defines the stable operator flow from submitting work to receiving a durable agent outcome.
derived_from:
  - ../flows/use-case.md
  - ../prd/PRD-002-self-extending-agent-harness.md
  - ../domain/rules.md
  - ../domain/states.md
status: active
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - architecture_decision
  - feature_level_test_matrix
---

# UC-001: Run An Agent Task

## Goal

The operator gives a durable agent a task and receives an inspectable answer or
explicit failure without losing conversation history.

## Primary Actor

Agent operator.

## Trigger

The operator submits real user input to an active agent.

## Preconditions

- A local browser or terminal runtime and durable session store are available.
- The agent has a configured model/provider that can answer, or a failure will be observable.
- The operator trusts the agent inputs and effective execution authority.

## Main Flow

1. The operator opens or creates an agent in the browser or terminal client and submits a task.
2. The task becomes a durable conversation turn and the agent becomes scheduled/running.
3. The operator observes answer and action activity as it is persisted.
4. The agent produces a terminal answer.
5. The answer and conversation remain available after refresh or ordinary restart.

## Alternate Flows / Exceptions

- `ALT-01` New operator input arrives during a run; it remains pending for continuation.
- `EX-01` Provider or runtime failure is shown and pending intent is not silently acknowledged.
- `EX-02` The operator stops the run; the agent remains available for later continuation.

## Postconditions

- Success: durable conversation contains the task and terminal answer.
- Failure/stop: durable history and recoverable operator intent remain available.

## Business Rules

- `BR-01` Only real operator input represents new intent.
- `BR-02` Failure or stop must not masquerade as successful completion.

## Traceability

| Upstream / Downstream | References |
| --- | --- |
| PRD | [PRD-002](../prd/PRD-002-self-extending-agent-harness.md) |
| Domain | [Rules](../domain/rules.md), [states](../domain/states.md) |
| Engineering | [Architecture](../engineering/architecture.md), [agent protocol](../engineering/agent-protocol.md) |
| Implementation | [Agent route](../../src/agent/$route_$id_POST.ts), [terminal](../../src/cli/runTerminal.entry.ts), [shared submit](../../src/agent/submit.ts), [worker](../../src/agent/workerLoop.ts) |
