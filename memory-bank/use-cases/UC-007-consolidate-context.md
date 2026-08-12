---
title: "UC-007: Consolidate A Long-Running Context"
doc_kind: use_case
doc_function: canonical
purpose: Defines the draft bounded sleep and context-consolidation scenario that preserves source history and requires an explicit continuation choice.
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

# UC-007: Consolidate A Long-Running Context

## Goal

The operator obtains a smaller, inspectable successor context for continued work
without losing the original history or being switched to the successor silently.

## Primary Actor

Agent operator; a coding agent may prepare the consolidation.

## Trigger

The operator requests consolidation, or an accepted bounded sleep policy fires
after a defined idle interval or context threshold.

## Preconditions

- The source session and consolidation boundary are durable and identifiable.
- The policy defines scope, budget, provenance, and the required review surface.
- The original session remains available independently of the successor.

## Main Flow

1. The trigger identifies the source session boundary to consolidate.
2. The consolidation process derives a candidate successor context and records
   provenance back to the source.
3. The operator inspects the candidate, including material omissions or
   uncertainty when known.
4. The operator explicitly chooses whether to continue from the successor,
   revise it, or remain in the source context.
5. Both the source history and the accepted continuation remain recoverable.

## Alternate Flows / Exceptions

- `ALT-01` The operator rejects the candidate and continues in the source session.
- `ALT-02` Consolidation is initiated during bounded sleep and is ready for
  review when the operator returns; it does not switch context automatically.
- `EX-01` The candidate cannot preserve required information; the process reports
  the gap and does not present it as a safe successor.
- `EX-02` Consolidation fails or stops; the source session remains unchanged.

## Postconditions

- Source history remains durable and inspectable.
- Any successor context has explicit provenance and acceptance state.
- Continuation never changes silently as a side effect of idle time.

## Business Rules

- `BR-01` Consolidation does not delete or overwrite its source history.
- `BR-02` Switching to a successor context requires explicit operator intent.
- `BR-03` Bounded sleep may prepare a candidate but cannot silently accept it.

## Traceability

| Upstream / Downstream | References |
| --- | --- |
| PRD | [PRD-002](../prd/PRD-002-self-extending-agent-harness.md) |
| Related use cases | [UC-001](UC-001-run-agent-task.md), [UC-003](UC-003-fork-and-delegate.md) |
| Features | none; delivery routing has not happened |
| ADR | none |

