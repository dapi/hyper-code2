---
title: Domain Glossary
doc_kind: domain
doc_function: canonical
purpose: Canonical implementation-independent language for durable agent work in hyper-code2.
derived_from:
  - ../dna/governance.md
  - ../product/context.md
status: active
audience: humans_and_agents
canonical_for:
  - ubiquitous_language
  - domain_terms
---

# Domain Glossary

| Term | Meaning | Do not confuse with |
| --- | --- | --- |
| Operator | Human who creates, directs, stops, forks, or reviews an agent | The coding agent or runtime worker |
| Agent | Durable participant configured to process tasks and continue a conversation | LLM provider, OS process, or worker implementation |
| Conversation | Ordered durable exchange that gives an agent its working context | Browser tab or rendered event list |
| Turn | One user or assistant contribution to a conversation | One HTTP request or one database row implementation |
| Run | Processing episode triggered by pending real user input and ending in an answer, stop, or failure | The process-wide scheduler |
| Action | Agent-requested operation such as evaluating code, reading, editing, searching, writing, shell execution, or rendering HTML | Native model tool call |
| Action result | Observable success or failure returned to the conversation so the agent can continue reasoning | New operator input |
| Activity event | User-visible trace of conversation or action progress | In-process wake signal |
| Workspace | Filesystem and repository context in which the agent works | `.hyper/` runtime overlay only |
| Artifact | File or other reviewable output created or changed by agent work | Conversation text alone |
| Fork | Child agent conversation inheriting a bounded prefix of parent context | Full transcript copy |
| Delegation | Bounded task handed from one agent to another with an expected return contract | Unbounded parallel work |
| Capability | Callable behavior available to an agent | Durable session state |

Engineering terms such as SQLite table, worker, `ctx.fns`, declared setting, and
overlay are defined by engineering documents, not the domain model.
