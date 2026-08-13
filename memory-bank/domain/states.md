---
title: Domain States
doc_kind: domain
doc_function: canonical
purpose: Observable lifecycle states for agents, runs, forks, and automated delivery work.
derived_from:
  - ../dna/governance.md
  - model.md
  - rules.md
status: active
audience: humans_and_agents
canonical_for:
  - domain_states
  - state_transitions
---

# Domain States

## Agent Lifecycle

- `active` — available for new operator input.
- `running` — currently processing pending input.
- `idle` — not currently processing; it may still have scheduled work.
- `stopped` — the current run was interrupted; the agent remains available.
- `archived` — retained for history but excluded from ordinary scheduling.
- `deleted` — agent-local durable records are removed.

## Run Outcomes

- `completed` — produced a terminal answer and successfully acknowledged the
  operator-input frontier observed at run start.
- `failed` — produced an error; pending intent is not silently marked processed.
- `stopped` — interrupted by the operator; pending intent remains recoverable.
- `continued` — new input arrived during a successful run and another run is scheduled.

## Fork And Delegation

A fork begins with inherited context up to a fixed boundary, then diverges with
its own turns. A delegated task remains pending until the child returns a result
or failure to the parent contract.
