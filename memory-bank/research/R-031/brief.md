---
title: "R-031: Versioned Discovery And Retention Contracts"
doc_kind: research
doc_function: canonical
purpose: "Decision question, boundaries and lifecycle for a symmetric runtime comparison of discovery and retention contracts."
derived_from:
  - ../../flows/research.md
  - ../../prd/PRD-002-self-extending-agent-harness.md
  - ../../use-cases/UC-005-extend-and-reuse-capability.md
  - ../R-001/decision.md
  - ../R-014/decision.md
status: active
research_status: collecting
audience: humans_and_agents
---
# R-031: Versioned Discovery And Retention Contracts

## Intake

| Field | Value |
| --- | --- |
| Source / trigger | [GitHub #31](https://github.com/dapi/hyper-code2/issues/31), R-001 `HD-04`, R-014 runtime-comparison handoff |
| Research owner | Codex orchestration |
| Decision owner | Danil Pismenny |
| Research mode | `product_discovery` with symmetric technical prototypes |
| Decision deadline / timebox | One frozen comparison cycle; stop at the plan thresholds or first contract-invalidating control failure |

## Decision Question

- `RQ-01` Which versioned discovery/retention contract lets agents reliably
  create, find, understand and reuse ordinary callable capabilities while
  preserving free composition and avoiding a mandatory promotion lifecycle?

## Working Hypotheses

- `HYP-01` Explicit discovery/signature projection can improve retention and
  reuse without replacing ordinary `ctx.fns` calls with a mediated runtime.
- `HYP-02` A descriptor-mediated prototype may improve authority clarity but
  will not justify its composition/complexity cost unless it outperforms simpler
  projections on the same fixtures.

## Scope

- `RSC-01` Four frozen contract variants defined in `plan.md`.
- `RSC-02` Three deterministic offline task families with fresh-process reuse.
- `RSC-03` Correctness, discovery effort, artifact inspectability, composition,
  honest failure and bounded authority implications.

## Non-Scope

- `RNS-01` Production runtime replacement, migration, ADR acceptance or #16 implementation.
- `RNS-02` Universal requirement to retain every successful composition.
- `RNS-03` Real secrets, public HTTP, shared state or multi-user workflow.

## Assumptions and Known Evidence

| ID | Statement | Type | Source / confidence |
| --- | --- | --- | --- |
| `EVD-01` | The current runtime can write/hot-reload a callable, but two first-family passes did not confirm reliable retention/reuse. | Evidence | [R-001 decision](../R-001/decision.md) |
| `EVD-02` | Existing candidate surfaces lack symmetric runtime evidence. | Evidence | [R-014 decision](../R-014/decision.md) |
| `ASM-01` | Disposable projections can compare discovery contracts without committing production architecture. | Assumption | Must be verified by the frozen instrument and review |

## Stopping Condition

- `STOP-01` Stop when every admitted variant has attributable results across the
  frozen sample, or when a control failure invalidates the comparison.
- `STOP-02` Stop immediately on boundary escape, real secret access, false
  success, non-versioned prompt/contract drift or an unreviewed production change.
- `STOP-03` Do not convert a winning research variant into delivery or ADR inside
  this package.

## Open Questions

| Question | Blocks | Owner | Resolution evidence |
| --- | --- | --- | --- |
| Can all four variants be represented as disposable projections over the same ordinary callable substrate? | Symmetric comparison | Research owner | Instrument review and control run |
| Does any variant meet correctness/reuse thresholds without reducing ordinary composition? | Owner disposition | Danil Pismenny | Complete evidence and synthesis |

## Boundary Check

- [x] Question, hypotheses and known evidence are separated.
- [x] No mechanism, production feature or ADR is selected.
- [x] Safety and stopping conditions are explicit.
