---
title: "R-036: Research Plan"
doc_kind: research
doc_function: canonical
purpose: Mutation-path inventory and symmetric activation/recovery contract comparison for R-036.
derived_from:
  - brief.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-036: Research Plan

## Method

| Question / hypothesis | Method | Why this method fits | Quality threshold |
| --- | --- | --- | --- |
| `RQ-01`, `HYP-01/02` | Static authority/mutation-path inventory plus contract-level candidate comparison and failure analysis | The decision must precede mutation prototyping and spans multiple authority surfaces | Every current path is accounted for; candidates use the same approval, atomicity, observability, bypass and recovery criteria |

## Sources Or Sample

| Group / source | Inclusion and exclusion | Target / access boundary | Sampling limitation |
| --- | --- | --- | --- |
| Agent mutation dispatch | marker execution, eval, bash, file writes/edits | Local source at immutable revision `e301161a70ca685feedfaa5bfba0d3580c73e3f7` | Static reachability; no adversarial runtime proof |
| Activation paths | function/route reload, type regeneration, migrations | Local source only | Does not prove cross-process rollback |
| Durable/audit inputs | events/messages, git helpers, current DB migration ledger | Local source only | No self-change ledger currently exists |
| Candidate contracts | direct mutate/reload, in-process snapshot, versioned overlay generation with independent recovery, git/worktree proposal | Contract comparison only | Hybrid mechanism may be needed downstream |

## Collection Protocol

1. Trace every direct mutation and activation entry exposed to the agent/runtime.
2. Classify surfaces by blast radius, persistence, authority and recovery needs.
3. Identify what current trace/persistence proves and what it does not.
4. Compare candidates on approval enforcement, atomicity, live verification,
   durable audit, candidate-independent recovery, restart behavior and bypass.
5. Define minimum states and failure semantics without selecting schema/API.
6. Record ADR triggers and delivery blockers.

## Controls

| Risk | Control | Owner |
| --- | --- | --- |
| Mistaking audit for enforcement | Report raw bypass paths and label policy-governed versus enforced claims | Research owner |
| Recovery optimism | Require candidate-independent restore carrier and explicit degraded state | Research owner |
| Scope collapse | Keep overlay, core/prompt, migration/security and external/production surfaces distinct | Research owner |
| Unsafe experiment | Static inspection only; no runtime mutation, migration, external access or secrets | Research owner |

## Stop Rules

- `STOP-01` Apply the stopping conditions from `brief.md`.
- Stop and escalate if a candidate requires selecting a global persistence,
  isolation, authorization or process-boundary architecture.

## Plan Approval

| Field | Value |
| --- | --- |
| Reviewer / decision owner | Danil Pismenny |
| Approval reference | Owner-approved plan and execution authorization dated 2026-08-13; final recommendation still requires disposition |
