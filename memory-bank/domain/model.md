---
title: Domain Model
doc_kind: domain
doc_function: canonical
purpose: Implementation-independent concepts and relationships for durable agent work.
derived_from:
  - ../dna/governance.md
  - glossary.md
status: active
audience: humans_and_agents
canonical_for:
  - domain_model
  - domain_concepts
---

# Domain Model

| Concept | Kind | Represents | Relationships |
| --- | --- | --- | --- |
| Operator | actor | Human directing and reviewing agent work | Starts runs, supplies turns, stops/forks agents, reviews artifacts |
| Agent | aggregate | Durable task-performing participant | Owns one conversation and configuration; may descend from a parent agent |
| Conversation | aggregate member | Context shared between operator, agent, and action results | Contains ordered turns; inherited by forks up to a boundary |
| Turn | entity | One contribution to the durable conversation | Authored by operator, agent, or action-result adapter |
| Run | lifecycle entity | One attempt to process pending operator input | Produces turns, actions, activity events, or failure |
| Action | value object | Requested operation with kind and input | Belongs to an agent turn and yields one result |
| Action result | value object | Success or failure fed back into the conversation | Paired with the action that produced it |
| Activity event | entity | Observable trace for the operator | Refers to the relevant turn/action where possible |
| Workspace | context | Files and repository rules available to work | Contains artifacts and executable project context |
| Fork reference | value object | Parent agent plus inherited conversation boundary | Creates a child without copying the full conversation |
| Delegated task | value object | Bounded request and completion contract between agents | Originates in a parent and resolves in a child |

Storage schema, scheduling columns, transports, and provider implementations are
engineering realization details.
