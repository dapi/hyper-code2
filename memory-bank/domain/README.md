---
title: Domain Documentation Index
doc_kind: domain
doc_function: index
purpose: Navigation to implementation-independent language, concepts, rules, states, events, and context boundaries of hyper-code2.
derived_from:
  - ../dna/governance.md
status: active
audience: humans_and_agents
---

# Domain Documentation

The application domain is durable agent work: an operator gives an agent a task
inside a workspace; the agent produces turns, actions, results, artifacts, forks,
and delegations until the run reaches an observable outcome.

Domain documents describe concepts that remain meaningful if SQLite, Bun, htmx,
or the worker implementation changes. Technical mechanisms such as tables,
provider adapters, loaders, and scheduling SQL belong to
[Engineering](../engineering/README.md).

- [Glossary](glossary.md) — canonical language and prohibited ambiguities.
- [Domain model](model.md) — actors, aggregates, values, and relationships.
- [Rules](rules.md) — implementation-independent invariants.
- [States](states.md) — observable agent and run lifecycle states.
- [Events](events.md) — meaningful observable facts, distinct from transport wakeups.
- [Context map](context-map.md) — Agent Work, Workspace, and Delivery Automation boundaries.
