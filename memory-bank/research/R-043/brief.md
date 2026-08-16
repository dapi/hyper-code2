---
title: "R-043: Reversible Extension Effect Ownership"
doc_kind: research
doc_function: canonical
purpose: "Canonical W1A decision question for reversible ctx.fns extension effects."
derived_from:
  - ../../flows/research.md
  - ../../epics/EP-003/charter.md
  - ../../use-cases/UC-004-hot-reload-capability.md
status: active
research_status: validated
audience: humans_and_agents
---

# R-043: Reversible Extension Effect Ownership

## Intake

| Field | Value |
| --- | --- |
| Source / trigger | EP-003 W1A / tracker #43; current loader and SelfDescriptor review |
| Research owner | Codex |
| Decision owner | Danil Pismenny |
| Research mode | `technical_discovery` |
| Decision deadline / timebox | bounded review of current committed source at `62fda5d`; no live production probing |

## Decision Question

- `RQ-01` Какой минимальный lifecycle contract для runtime-loaded `ctx.fns` следует принять, чтобы replacement, removal/fallback, in-flight calls, teardown and partial failure были truthful и совместимы с SelfDescriptor, не объявляя captured references sandboxed?

## Working Hypotheses

- `HYP-01` Текущий loader обеспечивает identity/source freshness checks, но не владеет полным lifecycle effect и потому не может сам по себе обещать reversible replacement/removal.
- `HYP-02` Управляемый generation owner с quiescence и explicit disposal может закрыть bounded lifecycle slice; direct captured references останутся явным uncontained limitation.

## Compact Method Record

- Method and source/sample strategy: code reading of loader, scanner, route loader, SelfDescriptor and existing reload/race tests; run the focused Bun test surfaces.
- Collection window and context: 2026-08-15, local worktree, immutable source revision `62fda5ddb1d13c9798873f39fe672c48a4d72b64`; no `.hyper` runtime overlay or external environment included.
- Evidence-quality criteria: observations must be directly traceable to committed source or reproducible test output; recommendations must distinguish current behavior from proposed contract.
- Applicable privacy, consent, legal, security and vendor-access constraints: no credentials, external systems, production state or restricted data accessed.
- Bias risks and disconfirming signal: existing tests overrepresent successful reload; a passing failure-preservation test would disconfirm the claim that all reload failure is destructive.

## Scope

- `RSC-01` Function registration and provenance in `src/loadFns.ts` and `src/repl/load.ts`.
- `RSC-02` Project root precedence, removed overlay fallback, namespace reload, source race and SelfDescriptor reconciliation.
- `RSC-03` Alternatives and acceptance boundaries for a future delivery slice.

## Non-Scope

- `RNS-01` Implementing the lifecycle mechanism or changing loader behavior in this research package.
- `RNS-02` Route/script reload, marker actions, provider receipts, startup/shutdown ownership and security containment beyond compatibility checks.
- `RNS-03` Treating in-process generation management as an adversarial sandbox.

## Assumptions and Known Evidence

| ID | Statement | Type | Source / confidence |
| --- | --- | --- | --- |
| `ASM-01` | `ctx.fns` direct references may be captured by callers and cannot be revoked by replacing a registry property. | Assumption to test | Code-path hypothesis; test coverage required downstream |
| `SRC-01` | The epic requires lifecycle ownership, generation, replacement, quiescence, disposal, partial-failure and fallback semantics before delivery. | Evidence | [EP-003 charter](../../epics/EP-003/charter.md#scope) |
| `SRC-02` | UC-004 defines reload success/failure and durable-state preservation as observable behavior. | Evidence | [UC-004](../../use-cases/UC-004-hot-reload-capability.md) |

## Stopping Condition

- `STOP-01` Collection ends when each W1A gate question has a source-grounded observation, at least two lifecycle alternatives are compared, and a recommendation plus explicit limitations is ready for the decision owner.

## Open Questions

| Question | Blocks | Owner | Resolution evidence |
| --- | --- | --- | --- |
| Should the recommended lifecycle owner be adopted as a project-wide architecture contract? | W2 / HG-02 | Danil Pismenny | Owner disposition and, if cross-feature, ADR |

## Boundary Check

- [x] This brief frames a question and hypotheses, not delivery scope.
- [x] Known facts link to canonical sources; hypotheses are labeled.
- [x] No feature package, accepted architecture or implementation sequence is created here.
