---
title: "R-036: Self-Change Activation And Recovery Contract"
doc_kind: research
doc_function: canonical
purpose: Canonical decision question, boundaries and lifecycle for surface-aware self-change activation, verification and recovery.
derived_from:
  - ../../flows/research.md
  - ../../prd/PRD-002-self-extending-agent-harness.md
  - ../../use-cases/UC-008-inspect-and-evolve-agent.md
  - ../../epics/EP-002/charter.md
status: active
research_status: validated
audience: humans_and_agents
---

# R-036: Self-Change Activation And Recovery Contract

## Intake

| Field | Value |
| --- | --- |
| Source / trigger | EP-002 `EP-SI-02`, PRD-002 `BR-09/OQ-09`, UC-008 and owner authorization dated 2026-08-13 |
| Research owner | Codex |
| Decision owner | Danil Pismenny |
| Research mode | `technical_discovery` |
| Decision deadline / timebox | One bounded mutation-path inventory and contract comparison against revision `e301161a70ca685feedfaa5bfba0d3580c73e3f7` |

## Decision Question

- `RQ-01` What approval, staging, verification, activation, audit and recovery
  contracts are required per self-change surface before hyper-code2 may claim
  bounded and reversible self-change?

## Working Hypotheses

- `HYP-01` The first mutation delivery can be safely bounded to versioned `.hyper/`
  overlays if recovery does not depend on the candidate and live behavior is verified.
- `HYP-02` A new governed self-change API cannot honestly claim enforced approval
  while raw eval, bash and unrestricted file writes can bypass it.

## Scope

- `RSC-01` Current mutation and activation paths: write/edit, eval, bash, function
  reload, route reload, generated types, migrations and git helpers.
- `RSC-02` Surface classification for overlay, core, prompt, migrations,
  security-sensitive, destructive/external and production changes.
- `RSC-03` Proposal states, approval basis, pre/post identity, behavioral
  verification, durable audit, failure semantics and recovery independence.
- `RSC-04` Difference between policy-governed and technically enforced self-change.

## Non-Scope

- `RNS-01` Production implementation, database schema, public API or UI selection.
- `RNS-02` Removing existing trusted-agent eval/bash/file authority.
- `RNS-03` Network authentication, secret mediation, adversarial sandbox or deployment.
- `RNS-04` Automatic core/prompt activation or reflection auto-promotion.

## Assumptions And Known Evidence

| ID | Statement | Type | Source / confidence |
| --- | --- | --- | --- |
| `EVD-01` | Current marker runtime directly executes eval/bash/write/edit operations and records results in the conversation trace. | Evidence | [SRC-01](evidence.md#sources) |
| `EVD-02` | Hot reload changes live registry/routes but has no built-in proposal, approval or rollback transaction. | Evidence | [SRC-02](evidence.md#sources) |
| `EVD-03` | Filesystem helpers intentionally operate with process authority outside cwd. | Evidence | [SRC-03](evidence.md#sources) |
| `ASM-01` | A policy-governed path can be useful before comprehensive enforcement if its limitation is explicit and raw bypass authority is not misrepresented. | Assumption | Requires owner acceptance and downstream adversarial checks |

## Stopping Condition

- `STOP-01` Stop after mutation paths and surfaces are inventoried, candidate
  activation/recovery contracts are compared, bypass/enforcement limits and
  failure semantics are explicit, and an owner-ready recommendation exists.
- `STOP-02` Do not mutate runtime files, apply migrations, access external state,
  use secrets or claim an atomic recovery mechanism without executable evidence.

## Open Questions

| Question | Blocks | Owner | Resolution evidence |
| --- | --- | --- | --- |
| Is policy-governed overlay activation sufficient for the first release, or must raw bypass paths be mediated? | W3 scope and claims | Danil Pismenny / feature owner | Owner disposition plus W3 design evidence |
| What independent recovery carrier remains available if the loader/process is broken? | W3 Solution Ready | Feature/ADR owner | Prototype and recovery rehearsal |

## Boundary Check

- [x] The brief contains questions and hypotheses, not selected mechanisms.
- [x] Known facts link to grounded evidence.
- [x] No mutation delivery or accepted ADR is created here.
- [x] Privileged, external, secret and production actions are excluded.
