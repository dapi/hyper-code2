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
- [Independently reviewed bounded V3 carrier](../../../.protocols/experiments/runs/R-034/2026-08-13-storage-v3/README.md)
  — supports only bounded synthetic feasibility for constant-size fork
  metadata referencing an already-addressable immutable revision (`HYP-01`)
  and for persistent structural sharing with path-copy updates (`HYP-04`). The
  accepted evidence uses aggregate scenario assertions and carrier-specific
  W1-W5 counts; W4 is count-only, the COW graph is unbalanced, graph/revision
  reachability and orphan absence are unverified, and reopen proves read
  equality rather than foreign-key enforcement after reopen. Concurrency, GC,
  faults, backup, migration, production operability and latency remain unknown.
  This bounded acceptance does not authorize synthesis or design selection.
