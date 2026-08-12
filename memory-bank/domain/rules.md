---
title: Domain Rules
doc_kind: domain
doc_function: canonical
purpose: Stable implementation-independent invariants for conversations, actions, runs, forks, delegation, and delivery work.
derived_from:
  - ../dna/governance.md
  - model.md
status: active
audience: humans_and_agents
canonical_for:
  - domain_rules
  - domain_invariants
---

# Domain Rules

| Rule ID | Invariant | Evidence |
| --- | --- | --- |
| `DR-01` | Agent conversation and activity history remain recoverable across ordinary process restarts | [Session persistence implementation](../../src/session/loadAll.ts) and tests |
| `DR-02` | An action and its result remain paired so later conversation edits cannot leave a structurally incomplete tool cycle | [Deletion/truncation tests](../../src/session/deleteMessageAt.test.ts) |
| `DR-03` | Action results are system-produced context, not new operator intent | [Agent run loop](../../src/agent/run.ts) |
| `DR-04` | A failed or stopped run does not silently claim successful processing of pending operator input | [Worker lifecycle](../../src/agent/workerLoop.ts) |
| `DR-05` | A fork inherits parent context only to its declared boundary and then owns its local continuation | [Full-message assembly](../../src/session/getFullMessages.ts) |
| `DR-06` | Delegation is bounded by an explicit task and return contract | [Delegation implementation](../../src/agent/delegateTask.ts) |

Exact storage, scheduling, and marker syntax belong to engineering contracts.
