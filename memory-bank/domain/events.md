---
title: Domain Events
doc_kind: domain
doc_function: canonical
purpose: Observable facts in agent work and automated delivery, separated from transport signals.
derived_from:
  - ../dna/governance.md
  - model.md
  - rules.md
status: active
audience: humans_and_agents
canonical_for:
  - domain_events
---

# Domain Events

| Event | Meaning |
| --- | --- |
| Operator input accepted | A real user turn was durably added and may schedule work |
| Agent answer produced | The agent added an observable answer to the conversation |
| Action requested | The agent requested one typed operation |
| Action completed / failed | The operation returned an observable result to the conversation |
| Run started / completed / failed / stopped | A processing attempt crossed an observable lifecycle boundary |
| Agent forked | A child agent was created with a fixed inherited-context boundary |
| Delegation completed / failed | A child returned or failed the bounded parent task |

Rendered database event rows and in-process wakeups are technical projections.
Wakeups carry no domain payload and are documented in
[Engineering Architecture](../engineering/architecture.md).
