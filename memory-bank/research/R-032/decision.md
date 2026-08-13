---
title: "R-032: Research Decision"
doc_kind: research
doc_function: canonical
purpose: "Owner disposition and handoff for the network authority contract and mechanism comparison."
derived_from:
  - brief.md
  - synthesis.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-032: Research Decision

## Decision

| Field | Value |
| --- | --- |
| Decision owner | Danil Pismenny |
| Decision date | 2026-08-13 |
| Decision reference | Danil requested an FPF-based decision after accepting the independently reviewed V6.3 evidence |
| Terminal disposition | `inconclusive` for selection of a best mechanism; target-contract direction accepted |

## Rationale

FPF separates the target-contract claim from the mechanism-selection claim and
applies the weakest-link rule within each declared scope. Evidence is sufficient
to accept requirements for explicit caller authority and deferred revalidation.
It is insufficient to rank transport/process alternatives because route
inheritance, real reachability/residual authority and real client lifecycle are
not established. Combining those claims into one optimistic verdict would be
scope inflation.

## Accepted Direction

- `REC-01` Adopt the mechanism-neutral target authority contract summarized in
  [Synthesis](synthesis.md#decision-answer).
- `REC-02` Reject locality-only and route-separation-only approaches as
  sufficient standalone answers to caller authority.
- `REC-03` Do not select a transport, credential, capability, route or process
  mechanism from R-032.
- `REC-04` Do not continue another broad matrix merely to close every gate.
  Collect G3/G4/G6 evidence only for a concrete downstream architecture,
  deployment or client-surface decision.

## Alternatives Considered

| Alternative | Disposition |
| --- | --- |
| Mark the whole question `validated` and choose a layered candidate | Rejected: it would transport bounded synthetic evidence into unsupported topology, overlay and client scopes. |
| Keep R-032 collecting until G3/G4/G6 all close | Rejected: those questions require different operational envelopes and consuming owners; another broad cycle has poor information value. |
| Discard V6.3 as insufficient | Rejected: reviewed evidence supports durable contract-level conclusions even though it cannot select a mechanism. |

## Promotion And Handoff Map

| ID | Accepted fact or unresolved question | Canonical owner / route |
| --- | --- | --- |
| `HD-01` | Required caller-authority and deferred-revalidation properties | [Security boundary](../../engineering/security-boundary.md) |
| `HD-02` | Dynamic route/default/overlay policy | Future ADR or design research only when a mechanism proposal exists |
| `HD-03` | Real interface reachability | Concrete deployment/topology owner; not a generic research prerequisite |
| `HD-04` | Browser and direct CLI/TUI lifecycle | Future Feature Flow for the selected client surface |
| `HD-05` | Process isolation and residual authority | Future ADR/research tied to a concrete process-boundary proposal |

## Closure Check

- [x] The decision distinguishes accepted target-contract requirements from an
  inconclusive mechanism choice.
- [x] Findings and confidence trace to independently accepted bounded evidence.
- [x] No architecture, implementation, deployment or delivery sequence is selected.
- [x] Follow-up evidence is demand-triggered by a downstream owner rather than
  an open-ended continuation of R-032.
