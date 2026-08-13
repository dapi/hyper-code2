---
title: "UC-008: Inspect And Evolve The Agent"
doc_kind: use_case
doc_function: canonical
purpose: Defines the stable agentic scenario for obtaining a current model of the agent implementation and performing only policy-bounded, observable, verified, and reversible self-change.
derived_from:
  - ../flows/use-case.md
  - ../product/context.md
  - ../prd/PRD-002-self-extending-agent-harness.md
  - ../engineering/security-boundary.md
status: active
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - architecture_decision
  - feature_level_test_matrix
---

# UC-008: Inspect And Evolve The Agent

## Goal

The operator and agent can inspect a current, source-grounded description of the
agent's implementation and effective authority, then make an authorized change
through an observable, verified, and reversible flow without losing durable work.

## Primary Actor

Trusted coding agent working with an agent operator or project developer. The
human actor remains the decision owner for change surfaces that require explicit
approval.

## Trigger

A task requires understanding how the agent currently works, diagnosing a
limitation, adapting an allowed extension point, or proposing an improvement to
the harness itself.

## Preconditions

- The actor is trusted to exercise the current developer-tool authority.
- Runtime state and authoritative source needed for the bounded question can be
  inspected without treating model recollection as implementation evidence.
- The target change surface and its approval class can be identified.
- A verification and recovery outcome can be stated before activation.
- Existing durable session state and the pre-change implementation identity are
  recoverable or the change stops before activation.

## Main Flow

1. The agent obtains a current description of the relevant part of itself,
   including implementation provenance, effective overrides, state boundary,
   capabilities, and authority facts that are available for the task.
2. The agent distinguishes directly observed facts from inferences and unavailable
   facts, then reads the authoritative source for the affected component.
3. The agent determines whether an existing capability or configuration already
   satisfies the task before proposing a new change.
4. If change is warranted, the agent produces an inspectable proposal that names
   intent, target surface, before identity, expected behavior, risk class,
   verification, required approval, and recovery outcome.
5. The applicable policy rejects, requests human approval for, or permits staging
   of the proposal. A proposal is not treated as an active change.
6. The staged change is checked against its declared contract before activation.
7. An authorized change is activated with an attributable record, and its live
   behavior and durable-session preservation are observed.
8. If the activation check fails, the prior behavior is restored or the system
   enters an explicit recoverable failure state without claiming success.
9. The operator can inspect what changed, why, which evidence was used, the
   current effective implementation, and the rollback result.

## Alternate Flows / Exceptions

- `ALT-01` Inspection shows that no self-change is needed; the agent uses the
  existing capability or reports the relevant implementation fact.
- `ALT-02` The target is a one-off experimental overlay; the change remains
  explicitly non-core and follows the overlay policy.
- `ALT-03` Reflection identifies a candidate improvement; it records a proposal
  with provenance but does not activate it.
- `ALT-04` The operator rejects or revises the proposal; current behavior remains
  unchanged.
- `EX-01` Provenance or freshness cannot be established; the agent reports the
  gap and does not claim an authoritative self-description.
- `EX-02` The required approval, verification, isolation, or rollback condition
  is unavailable; activation is blocked.
- `EX-03` External content requests persistent self-modification; it is treated
  as untrusted input and cannot silently cross the proposal/activation boundary.
- `EX-04` Recovery fails; the system exposes an explicit diagnostic and preserves
  every recoverable pre-change artifact instead of continuing silently.

## Postconditions

- The relevant self-description is attributable to current runtime/source
  evidence or explicitly marks unknowns.
- No rejected, unapproved, or verification-failing proposal is represented as active.
- Every active self-change has an inspectable identity, verification result,
  approval basis, and recovery outcome.
- Durable conversation history remains available independently of change success.
- Reflection output remains a candidate until the applicable promotion policy is satisfied.

## Business Rules

- `BR-01` The LLM's remembered or inferred self-description is not authoritative
  implementation evidence.
- `BR-02` Self-description distinguishes shipped core, runtime overlays, prompts,
  durable state, transient state, external dependencies, and effective authority
  when those surfaces are relevant and observable.
- `BR-03` Self-change is proposal-driven, attributable, observable, verified,
  and reversible; writing or reloading a file alone does not prove success.
- `BR-04` Approval is surface-dependent. Core, base prompt, migrations,
  security-sensitive boundaries, destructive actions, external state, and
  production actions require explicit human authority.
- `BR-05` Reflection and external content cannot directly activate persistent
  code, prompt, policy, or behavioral changes.
- `BR-06` Runtime overlays do not become hidden shipped-core dependencies.
- `BR-07` This scenario does not grant authority beyond the current process and
  repository contracts; authority reduction is owned by separate security work.
- `BR-08` A failed live check must produce rollback or an explicit recoverable
  failure, never an unsupported success claim.

## Operational Contract

### Observable Status

The scenario exposes at least `inspected`, `proposed`, `blocked`, `staged`,
`verified`, `active`, `rolled_back`, and `failed` outcomes where applicable.
Exact persistence schema and API names belong to downstream design.

### Handoff

A proposal handoff identifies its source evidence, target surface, before
identity, intended outcome, risk/approval class, verification contract, and
recovery outcome. Missing required fields block activation rather than being
invented by the receiver.

### Diagnostics And Recovery

Failure diagnostics identify the failed stage and whether current behavior is
the pre-change version, the candidate, or an explicitly degraded state. Recovery
preserves the source proposal and evidence trail.

## Implementation Status

Current runtime primitives support function discovery, source reads, file writes,
code execution, and hot reload. They do not yet implement a unified self-model,
surface-aware approval classes, durable change ledger, atomic activation, or
verified rollback scenario. Active use-case status records required behavior,
not implementation completion.

## Traceability

| Upstream / Downstream | References |
| --- | --- |
| Primary source | [Николай Рыжиков Telegram comment](https://t.me/c/1951583351/97428), [local source capture](../product/sources/2026-08-13-niquola-self-awareness-comment.txt) |
| PRD | [PRD-002](../prd/PRD-002-self-extending-agent-harness.md) |
| Related use cases | [UC-004](UC-004-hot-reload-capability.md), [UC-005](UC-005-extend-and-reuse-capability.md), [UC-006](UC-006-reflect-on-agent-work.md) |
| Epic | [EP-002](../epics/EP-002/README.md) |
| Features | none yet; delivery requires EP-002 handoff |
| ADR | none; descriptor and activation/rollback research may trigger ADRs |
