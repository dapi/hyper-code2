---
title: "EP-002: Inspectable And Bounded Self-Evolution"
doc_kind: epic
doc_function: canonical
purpose: Governs the multi-feature initiative for a current agent self-model, surface-aware change proposals, verified activation and recovery, and reflection that cannot silently modify the harness.
derived_from:
  - ../../flows/epic.md
  - ../../prd/PRD-002-self-extending-agent-harness.md
  - ../../use-cases/UC-008-inspect-and-evolve-agent.md
  - ../../engineering/security-boundary.md
status: active
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - feature_issue_ids_not_approved
---

# EP-002: Inspectable And Bounded Self-Evolution

## Origin And Epic Route

| Field | Value |
| --- | --- |
| Source / trigger | [Telegram comment by Николай Рыжиков](https://t.me/c/1951583351/97428): `я бы добавил еще самоосознание более явно - те агент знает как он написан и может себя менять ;)` |
| Owner acceptance | Danil Pismenny accepted the proposed interpretation and plan on 2026-08-13 and authorized execution in a separate worktree |
| Epic owner / decision owner | Danil Pismenny |
| Why Epic | Current self-model, activation/rollback, read-only UI, bounded overlay mutation, core/prompt governance, and reflection require multiple delivery units and shared risk controls |
| Intake proposal | Not used; direct Bootstrap Epic |

## Problem

The current runtime exposes broad introspection, source reads, file writes,
in-process evaluation, shell execution, and hot reload. The base prompt tells an
agent many implementation facts, but the product has no canonical runtime-derived
self-description, no explicit surface-aware self-change contract, no durable
proposal/activation record, and no verified rollback scenario.

Consequently, the agent can physically change parts of its environment while
lacking a product-level method to prove what implementation it observed, which
authority it exercised, whether a change was approved, whether live behavior
matches the proposal, or how the prior behavior was restored. Calling this
unstructured authority “self-awareness” would overclaim the current behavior.

## Outcome

The epic produces an evidence-backed and operator-controlled path in which:

- the agent can inspect a current, source-grounded model of the relevant parts of itself;
- self-description exposes provenance, freshness, effective overrides, knowns and unknowns;
- proposed changes are classified by surface, authority, verification and approval;
- allowed changes can be staged, activated, observed and recovered without losing durable work;
- reflection can create reviewable candidates but cannot silently modify active behavior;
- every delivery claim is backed by runtime evidence rather than prompt text alone.

## Stakeholder Channels

| Channel | ID / URL | Purpose |
| --- | --- | --- |
| Primary source | [Telegram message](https://t.me/c/1951583351/97428) | Original requirement and author provenance |
| Product decision | Danil Pismenny, acceptance and execution authorization dated 2026-08-13 | Scope, approvals, continue/revise/stop decisions |
| Product owner | [PRD-002](../../prd/PRD-002-self-extending-agent-harness.md) | Goals, product rules, risks and validation posture |
| Scenario owner | [UC-008](../../use-cases/UC-008-inspect-and-evolve-agent.md) | Stable observable inspect-and-evolve behavior |
| Security boundary | [Trust And Security Boundary](../../engineering/security-boundary.md) | Current process authority and known exposure gaps |
| Existing reflection input | [`docs/reflection.md`](../../../docs/reflection.md) | Non-authoritative design input; not implementation or roadmap authority |

## Scope

- `REQ-01` Define a current self-description contract covering identity,
  implementation provenance, effective capability resolution, relevant state
  boundaries, mutable surfaces, and effective authority without treating prompt
  text as implementation evidence.
- `REQ-02` Distinguish observed, inferred, stale, unavailable, and unsupported
  self-description facts and make freshness/provenance inspectable.
- `REQ-03` Define a surface classification and approval contract for runtime
  overlays, shipped core, base prompt, migrations, security-sensitive behavior,
  destructive actions, external state, and production actions.
- `REQ-04` Define proposal, staging, verification, activation, observation,
  durable audit, and recovery outcomes before mutation delivery.
- `REQ-05` Deliver a read-only self-model before any new automated self-change path.
- `REQ-06` Limit the first mutation delivery to genuine `.hyper/` runtime or
  experimental overlays and prevent hidden core dependency.
- `REQ-07` Govern shipped-core and base-prompt changes separately with explicit
  human approval and applicable feature/ADR gates.
- `REQ-08` Route reflection as candidate generation with provenance, manual
  promotion, budget, regression, and kill-switch controls.
- `REQ-09` Preserve durable sessions and expose the effective implementation and
  recovery result after every activation attempt.
- `REQ-10` Keep network authority and secret non-transit owned by EP-001
  successors; EP-002 consumes accepted constraints but does not duplicate or
  weaken them.

## Non-Scope

- `NS-01` Claims that an LLM is conscious, sentient, or has subjective self-awareness.
- `NS-02` Additional filesystem, shell, eval, network, credential, or production authority.
- `NS-03` An adversarial sandbox, public/multi-user deployment, or generalized authorization service.
- `NS-04` Silent, unbounded, or background activation of code, prompt, policy, or durable behavioral changes.
- `NS-05` Automatic promotion of reflection output or external content into active rules.
- `NS-06` Treating `.hyper/` as shipped core or making shipped behavior depend on untracked overlays.
- `NS-07` Automatic merge/conflict resolution across self-change branches.
- `NS-08` Full semantic memory, bounded sleep, or context consolidation delivery.
- `NS-09` Reopening terminal EP-001 research or preselecting its pending security mechanisms.
- `NS-10` Selecting exact schemas, APIs, hashing, isolation, activation, or rollback mechanisms in the charter.

## Source / Evidence Boundaries

| Source | Authority | Refresh rule |
| --- | --- | --- |
| Telegram comment and local source capture | Original wording and authorship | Preserve verbatim; do not treat as implementation evidence |
| PRD-002 | Product interpretation, goals, rules and validation posture | Update EP-002 owners after material PRD change |
| UC-008 | Observable project-level scenario | Update before feature acceptance if stable flow changes |
| Current code and runtime | Exact implementation and effective behavior | Re-ground each research/feature against an immutable revision and live evidence where required |
| Security boundary and EP-001 successors | Current authority gaps and accepted controls | Consume accepted outcomes; do not invent or weaken them here |
| `docs/reflection.md` | Design ideas and prior-art notes only | Re-evaluate before reflection delivery; never treat as active contract |

## Acceptance

| Criterion | Check |
| --- | --- |
| `EAC-01` | Self-description is runtime/source grounded, attributable, freshness-aware, and distinguishes unknowns from facts |
| `EAC-02` | Effective overrides and relevant authority are represented without exposing secret values to the model |
| `EAC-03` | Surface classification determines deny/approval/staging behavior and cannot be bypassed by reflection or external content |
| `EAC-04` | Proposal, verification, activation, observation, audit and recovery contracts are accepted before mutation delivery |
| `EAC-05` | Read-only self-model is delivered and verified before bounded overlay mutation |
| `EAC-06` | Failed activation restores prior verified behavior or enters an explicit recoverable failure state without unsupported success |
| `EAC-07` | Durable conversations remain available through inspection, activation and rollback tests |
| `EAC-08` | Reflection output remains candidate-only until explicit promotion and regression controls pass |
| `EAC-09` | EP-001 security owners remain authoritative and no real secret is used in EP-002 evidence |
| `EAC-10` | Danil Pismenny records the final continue, revise, park or stop disposition |

## Handoff

Research uses separate governed research packages. Delivery uses separate
`memory-bank/features/FT-<issue>/` packages after the relevant contract and
GitHub issue exist. Project-wide architecture decisions are promoted to ADRs.
