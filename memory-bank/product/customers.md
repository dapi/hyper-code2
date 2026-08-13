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

The project currently carries three product roles. `SEG-01` is grounded in the
current repository. `SEG-02` and `SEG-03` come from the source talk and were
accepted by the owner of this fork as product hypotheses; neither has external
customer-discovery evidence yet.

| Segment ID | Segment | Job To Be Done | Current Pain | Success Signal | Evidence status |
| --- | --- | --- | --- | --- | --- |
| `SEG-01` | Developer operating coding agents | Run and extend agents while keeping history and actions inspectable | Disposable chat state and opaque agent runtimes make work hard to resume or debug | Unknown at product level; local quality gates exist | Current repository and source talk |
| `SEG-02` | Process or harness builder | Assemble reusable functions and extension points into a specialized agent process or application | Fixed provider-owned harnesses constrain workflow, context policy, interaction surfaces, and integration depth | A specialized harness can be assembled and evolved without forking every capability into an isolated tool | Source-backed and owner-accepted; market-unvalidated |
| `SEG-03` | Domain practitioner using a specialized harness | Use and adapt an agent application around domain work without maintaining the base agent runtime | Generic coding-agent interfaces do not encode the practitioner’s workflow or domain-specific interaction surface | Domain work can be completed through a bounded specialized harness | Source-backed example and owner-accepted; market-unvalidated |

## Actors

| Actor ID | Actor | Interaction | Decision power |
| --- | --- | --- | --- |
| `ACT-01` | Agent operator | Uses the browser UI, settings, sessions, forks, and stop/archive controls | Chooses tasks, model, and local runtime actions |
| `ACT-02` | Project developer | Changes `src/`, tests, docs, and hot-reloadable behavior | Maintains implementation and repository contracts |
| `ACT-03` | Coding agent | Reads context and performs marker-driven actions within configured capabilities | Executes delegated work; must obey repository boundaries |
| `ACT-04` | Harness builder | Configures reusable capabilities, policies, and interaction surfaces for a specialized process | Chooses the specialized harness contract but not the base runtime security boundary |
| `ACT-05` | Domain practitioner | Uses or adapts a specialized harness through its bounded product surface | Controls domain intent; must not implicitly receive raw process authority |

## Evidence Gaps

- No interviews, analytics, support data, buyer role, organization segment, or
  external customer evidence was found for any segment.
- Treat “local-first” and “single-team use” as unvalidated assumptions, not promises.
- Do not infer customer needs from the implemented provider list.
