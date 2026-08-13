---
title: "R-034: Immutable Fork Storage Contract"
doc_kind: research
doc_function: index
purpose: "Navigation for the evidence-backed comparison of immutable, prefix-bounded fork storage representations."
derived_from:
  - ../../flows/research.md
  - brief.md
status: active
audience: humans_and_agents
---

# R-034: Immutable Fork Storage Contract

## Lifecycle Owner

The current lifecycle state is owned only by `research_status` in the
[Research Brief](brief.md).

## Annotated Index

- [Research Brief](brief.md) — owns the decision question, candidate set,
  boundaries, hypotheses and stopping condition.
- [Research Plan](plan.md) — owns the symmetric behavior, storage, concurrency,
  restart, operability and migration comparison protocol.
- [Evidence](evidence.md) — records current-schema observations and bounded
  synthetic comparison results without selecting a design.
- [Independently reviewed bounded V2 carrier](../../../.protocols/experiments/runs/R-034/2026-08-13-storage-v2/README.md)
  — executes four distinct positive storage shapes plus ineligible full-copy
  and live-parent controls. Review accepts aggregate behavior and reopen
  subclaims only: it does not establish constant-size revision metadata, COW
  structural sharing, linkage integrity or any W1-W5 growth comparison, and it
  does not authorize synthesis.
