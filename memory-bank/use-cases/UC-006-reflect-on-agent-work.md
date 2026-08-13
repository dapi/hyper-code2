---
title: "UC-006: Reflect On Agent Work"
doc_kind: use_case
doc_function: canonical
purpose: Defines the draft bounded scenario for producing an inspectable reflection over agent work without hidden autonomous modification.
derived_from:
  - ../flows/use-case.md
  - ../prd/PRD-002-self-extending-agent-harness.md
  - ../domain/rules.md
  - ../domain/states.md
status: draft
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - architecture_decision
  - feature_level_test_matrix
---

# UC-006: Reflect On Agent Work

## Goal

The operator or harness builder obtains an inspectable, bounded reflection about
agent work and can decide whether any proposed lesson should affect later work.

## Primary Actor

Agent operator or harness builder; a coding agent may perform the bounded
reflection.

## Trigger

The operator requests reflection, or an accepted policy triggers it after a
defined event, signal, or idle interval.

## Preconditions

- A durable source conversation or work trace exists.
- The trigger, scope, budget, and permitted outputs are bounded by an accepted
  policy.
- The reflection process cannot silently redefine the original conversation.

## Main Flow

1. A manual request or accepted policy starts reflection over an explicit source
   boundary.
2. The reflection evaluates the bounded work for lessons, mistakes, unresolved
   concerns, or candidate improvements.
3. It produces an inspectable artifact with provenance to the source boundary.
4. The operator can accept, reject, revise, or ignore proposed changes before
   they become durable behavioral rules or code changes.

## Alternate Flows / Exceptions

- `ALT-01` Reflection finds no useful change and records that outcome without
  modifying agent behavior.
- `ALT-02` A policy allows a low-risk result to be retained automatically, but
  the result remains visible and reversible.
- `EX-01` The budget or source boundary is exceeded; reflection stops with an
  explicit incomplete outcome.
- `EX-02` Proposed lessons conflict; they remain candidates until reviewed.

## Postconditions

- The source work remains intact.
- The reflection result and its provenance are inspectable.
- No hidden or unbounded self-modification is treated as successful reflection.

## Business Rules

- `BR-01` Reflection is bounded by an explicit policy and source boundary.
- `BR-02` Reflection output is not silently equivalent to accepted product truth
  or executable behavior.
- `BR-03` Any durable behavioral or code change remains observable and reversible.

## Traceability

| Upstream / Downstream | References |
| --- | --- |
| PRD | [PRD-002](../prd/PRD-002-self-extending-agent-harness.md) |
| Related use cases | [UC-001](UC-001-run-agent-task.md), [UC-003](UC-003-fork-and-delegate.md) |
| Existing design note | [`docs/reflection.md`](../../docs/reflection.md) — non-authoritative design input, not shipped behavior |
| Features | none; delivery routing has not happened |
| ADR | none |

