---
title: "R-014: Capability Surface Comparison"
doc_kind: research
doc_function: canonical
purpose: "Compare callable capability surfaces without preselecting mediation."
derived_from: [../../flows/research.md, ../R-001/synthesis.md]
status: active
research_status: inconclusive
audience: humans_and_agents
---
# R-014: Capability Surface Comparison

## Intake

| Field | Value |
| --- | --- |
| Source / trigger | R-001 `FND-03`, GitHub #14 |
| Research / decision owner | Danil Pismenny |
| Research mode | `technical_discovery` |
| Timebox | One bounded desk pass over current runtime evidence and candidate issue contracts, completed 2026-08-13 |

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

- `STOP-01` Stop when available evidence can rank surfaces or establishes that
  the comparison is asymmetric. The desk pass stopped on the latter condition.

## Open Questions

| Question | Blocks | Owner | Resolution evidence |
| --- | --- | --- | --- |
| What is the minimum comparable prototype for each alternative? | Separate follow-up runtime research | Danil Pismenny | Newly framed research package and approved instrument |
