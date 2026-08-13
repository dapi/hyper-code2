---
title: Domain Context Map
doc_kind: domain
doc_function: canonical
purpose: Language and ownership boundaries among Agent Work, Workspace, and Delivery Automation.
derived_from:
  - ../dna/governance.md
  - model.md
status: active
audience: humans_and_agents
canonical_for:
  - bounded_contexts
  - context_relationships
---

# Domain Context Map

| Context | Owns | Relationship |
| --- | --- | --- |
| Agent Work | Agent, Conversation, Turn, Run, Action, Action Result, Fork, Delegation, Activity Event | Uses Workspace to inspect or change artifacts |
| Workspace | Repository context, files, artifacts, and applicable instructions | Supplies project context and receives reviewable changes from Agent Work or Delivery Automation |

The contexts share stable language but not implementation ownership. Bun modules,
SQLite, htmx, and provider process topology are described in
[Engineering](../engineering/README.md) and [Operations](../ops/README.md).
