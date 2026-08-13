---
title: "R-035: Truthful Agent Self-Descriptor Contract"
doc_kind: research
doc_function: canonical
purpose: Canonical decision question, boundaries and lifecycle state for defining the minimum truthful agent self-description contract.
derived_from:
  - ../../flows/research.md
  - ../../prd/PRD-002-self-extending-agent-harness.md
  - ../../use-cases/UC-008-inspect-and-evolve-agent.md
  - ../../epics/EP-002/charter.md
status: active
research_status: validated
audience: humans_and_agents
---

# R-035: Truthful Agent Self-Descriptor Contract

## Intake

| Field | Value |
| --- | --- |
| Source / trigger | EP-002 `EP-SI-01`, PRD-002 `G-10/BR-08/VAL-09`, owner authorization dated 2026-08-13 |
| Research owner | Codex |
| Decision owner | Danil Pismenny |
| Research mode | `technical_discovery` |
| Decision deadline / timebox | One bounded current-code inventory and contract comparison against revision `e301161a70ca685feedfaa5bfba0d3580c73e3f7` |

## Decision Question

- `RQ-01` What minimum SelfDescriptor contract lets an agent truthfully inspect
  its current implementation, effective overrides, relevant state boundaries and
  authority without treating prompt text as evidence or exposing sensitive values?

## Working Hypotheses

- `HYP-01` A compact runtime-derived descriptor combining registry state with
  source provenance is sufficient for the first read-only delivery slice.
- `HYP-02` Prompt-only documentation or raw registry introspection alone cannot
  establish current source identity, effective overrides, freshness and unknowns.

## Scope

- `RSC-01` Current `src` and `.hyper` discovery/resolution behavior.
- `RSC-02` Agent identity, prompt layers, capability provenance, state classes,
  mutable surfaces and effective authority metadata required by UC-008.
- `RSC-03` Freshness, hashes/identity, known/inferred/unavailable status and
  secret-value exclusion at the contract level.
- `RSC-04` Candidate contract comparison and downstream ADR trigger assessment.

## Non-Scope

- `RNS-01` Runtime implementation, UI delivery, schema migration or production rollout.
- `RNS-02` Activation, approval or rollback mechanism selection; owned by R-036.
- `RNS-03` Secret-value mediation, authentication or sandbox delivery.
- `RNS-04` A complete ontology of every OS process, package or external dependency.

## Assumptions And Known Evidence

| ID | Statement | Type | Source / confidence |
| --- | --- | --- | --- |
| `EVD-01` | Current prompt gives the model a static runtime map and asks it to inspect live signatures/source. | Evidence | [SRC-01](evidence.md#sources) |
| `EVD-02` | Current scanner exposes source candidates from both `src` and `.hyper`. | Evidence | [SRC-02](evidence.md#sources) |
| `EVD-03` | No unified SelfDescriptor type or procedure exists at the grounded revision. | Evidence | [SRC-08](evidence.md#sources) |
| `ASM-01` | A descriptor can report authority categories without returning credential or environment values. | Assumption | Must be enforced and sentinel-verified downstream |

## Stopping Condition

- `STOP-01` Stop after the grounded source inventory covers identity, prompt,
  capabilities, origin/override resolution, state classes, authority, freshness
  and unknown semantics; reasonable candidate contracts are compared; and an
  owner-ready recommendation with limitations exists.
- `STOP-02` Do not prototype runtime writes or expose environment/credential values.

## Open Questions

| Question | Blocks | Owner | Resolution evidence |
| --- | --- | --- | --- |
| Should the descriptor be one snapshot or support bounded component queries? | W2 design | Feature/ADR owner | Owner disposition and downstream design |
| Which source identity primitive is stable across worktree, dirty tree and runtime reload? | W2 design | Feature/ADR owner | Prototype evidence after contract acceptance |

## Boundary Check

- [x] The brief owns questions and boundaries, not findings or implementation.
- [x] Known evidence links to stable repository records.
- [x] No delivery scope or architecture mechanism is accepted here.
- [x] Sensitive values and mutation experiments are excluded.
