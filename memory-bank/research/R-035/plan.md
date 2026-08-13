---
title: "R-035: Research Plan"
doc_kind: research
doc_function: canonical
purpose: Immutable-source inventory and candidate-contract comparison method for the truthful SelfDescriptor decision.
derived_from:
  - brief.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-035: Research Plan

## Method

| Question / hypothesis | Method | Why this method fits | Quality threshold |
| --- | --- | --- | --- |
| `RQ-01`, `HYP-01/02` | Static code and contract inventory followed by symmetric candidate comparison | The first decision concerns observable current inputs and a contract boundary, not performance | Every material field/limitation traces to grounded code or canonical contract; candidates are compared on identical criteria |

## Sources Or Sample

| Group / source | Inclusion and exclusion | Target / access boundary | Sampling limitation |
| --- | --- | --- | --- |
| Runtime composition | scanner, roots, loaders, prompt builder, agent type | Local repository at immutable revision `e301161a70ca685feedfaa5bfba0d3580c73e3f7` | Static source does not prove a live snapshot implementation |
| Authority contract | security boundary and direct mutation primitives | Metadata and source only; no credentials or environment values | EP-001 mechanism work remains external |
| Candidate contracts | prompt-only, registry-only, compact grounded descriptor, raw full dump | Contract-level comparison only | No usability benchmark yet |

## Collection Protocol

1. Record the immutable revision and relevant source paths.
2. Trace how source candidates become effective functions and prompt/runtime facts.
3. Inventory which requested UC-008 fields are directly available, derivable, stale-prone or unavailable.
4. Compare candidates on truthfulness, provenance, freshness, override visibility,
   context size, secret exposure, extensibility and implementation coupling.
5. Record conflicts and explicit unknowns instead of choosing a mechanism to hide them.
6. Produce an owner-ready recommendation and ADR trigger assessment.

## Controls

| Risk | Control | Owner |
| --- | --- | --- |
| Desired-product bias | Include prompt-only and registry-only counterexamples and a no-unified-descriptor alternative | Research owner |
| Stale source | Pin full commit SHA and mark dirty/runtime state outside static evidence | Research owner |
| Secret exposure | Inspect metadata paths only; no environment or credential reads | Research owner |
| Overclaiming effective origin | Separate candidate source inventory from effective runtime resolution | Research owner |

## Stop Rules

- `STOP-01` Apply the stopping condition from `brief.md`.
- Stop and reroute if answering requires executing privileged mutation or selecting a project-wide architecture.

## Plan Approval

| Field | Value |
| --- | --- |
| Reviewer / decision owner | Danil Pismenny |
| Approval reference | Owner-approved plan and execution authorization dated 2026-08-13; final recommendation still requires disposition |
