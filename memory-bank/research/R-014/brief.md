---
title: "R-014: Capability Surface Comparison"
doc_kind: research
doc_function: canonical
purpose: "Compare callable capability surfaces without preselecting mediation."
derived_from: [../../flows/research.md, ../R-001/synthesis.md]
status: active
research_status: decision_ready
audience: humans_and_agents
---
# R-014: Capability Surface Comparison

## Intake

| Field | Value |
| --- | --- |
| Source / trigger | R-001 `FND-03`, GitHub #14 |
| Research / decision owner | Danil Pismenny |
| Research mode | `technical_discovery` |
| Timebox | One fixed-fixture comparison before any #16 implementation |

## Decision Question

- `RQ-01` Which surface best preserves ordinary composition while making discovery,
  signatures and authority clear enough for correct later reuse?

## Working Hypotheses

- `HYP-01` Better discovery/contract projection can fix the observed failure without
  requiring all calls to pass through a mediated registry.

## Scope

- `RSC-01` Current `ctx.fns`, descriptor-mediated, generated typed and bounded hybrid alternatives.

## Non-Scope

- `RNS-01` Production implementation or accepted global architecture.

## Stopping Condition

- `STOP-01` Stop after fixed fixtures provide comparable correctness, discovery,
  prompt-surface, authority, migration and complexity evidence, or show the
  comparison cannot yet be made fairly.

## Open Questions

| Question | Blocks | Owner | Resolution evidence |
| --- | --- | --- | --- |
| What is the minimum comparable prototype for each alternative? | Evidence collection | Danil Pismenny | Approved instrument version |
