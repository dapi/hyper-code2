---
title: Customers And Users
doc_kind: product
doc_function: canonical
purpose: Evidence-backed users, jobs, and explicit customer unknowns for hyper-code2.
derived_from:
  - ../dna/governance.md
  - context.md
status: active
audience: humans_and_agents
canonical_for:
  - product_customers
  - user_segments
  - jobs_to_be_done
---

# Customers And Users

## Segments

| Segment ID | Segment | Job To Be Done | Current Pain | Success Signal | Evidence |
| --- | --- | --- | --- | --- | --- |
| `SEG-01` | Developer operating coding agents | Run and extend agents while keeping history and actions inspectable | Disposable chat state and opaque agent runtimes make work hard to resume or debug | Unknown at product level; local quality gates exist | `README.md`, `CLAUDE.md`, browser routes and tests under `src/agent/` |

## Actors

| Actor ID | Actor | Interaction | Decision power |
| --- | --- | --- | --- |
| `ACT-01` | Agent operator | Uses the browser UI, settings, sessions, forks, and stop/archive controls | Chooses tasks, model, and local runtime actions |
| `ACT-02` | Project developer | Changes `src/`, tests, docs, and hot-reloadable behavior | Maintains implementation and repository contracts |
| `ACT-03` | Coding agent | Reads context and performs marker-driven actions within configured capabilities | Executes delegated work; must obey repository boundaries |

## Evidence Gaps

- No interviews, analytics, support data, buyer role, organization segment, or
  external customer evidence was found.
- Treat “local-first” and “single-team use” as unvalidated assumptions, not promises.
- Do not infer customer needs from the implemented provider list.
