---
title: "EP-003: Decision Log"
doc_kind: epic
doc_function: decision_log
purpose: "Epic-local routing, adoption-boundary, ownership, and sequencing decisions for reversible and reconstructable runtime behavior."
derived_from:
  - charter.md
status: active
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - global_architecture_policy_without_adr
---

# EP-003: Decision Log

## Evidence Reading Rule

DeepSeek Harness demonstrates one implementation of useful properties. It does not validate them for hyper-code2 or authorize copying its framework. Current code owns implementation facts, PRD/use cases own product intent, research owns comparative recommendations, and ADRs own project-wide architecture choices.

## Resolved Decisions

| ID | Date | Decision | Facts And Reasoning | Consequences |
| --- | --- | --- | --- | --- |
| `DL-01` | 2026-08-15 | Route the opportunities through a separate epic and GitHub milestone | Independent contracts share risks; owner requested an actionable epic/milestone | EP-003 and `Reversible Runtime` coordinate; PRD-002/roadmap link it |
| `DL-02` | 2026-08-15 | Adopt properties, not the DeepSeek Harness framework | Hyper-code2 is a small Bun-first harness with existing contracts | Preserve Bun, `ctx.fns`, TypeScript and marker protocol; ADR for global change |
| `DL-03` | 2026-08-15 | Keep lifecycle, action and request receipts independent | Different failure modes, dependencies, readiness | W1A/W1B/W1C independently gate their candidates |
| `DL-04` | 2026-08-15 | Reuse current owners | #7, #11, #13, #22, #31/#14, #17/#34, #19, EP-001 and EP-002 own adjacent contracts | EP-003 consumes accepted interfaces only |
| `DL-05` | 2026-08-15 | Preserve `§...` while researching an internal seam | Extensibility does not require a new model protocol | #44/#47 must preserve all kinds, including `§html` semantics |
| `DL-06` | 2026-08-15 | Treat only the harness-bound submitted payload as reconstructable | The harness cannot truthfully know provider-side normalization, injection, or final model input | #45/#48 and UC-009 must name the boundary and unavailable/withheld states |
| `DL-07` | 2026-08-15 | Bootstrap Epic directly | Current PRD/use cases, pinned source and owner map suffice | No intake brief; roadmap ready |
| `DL-08` | 2026-08-15 | Keep unresolved tracker issues mechanism-neutral and blocked | User requested issues; research and cross-epic decisions remain open | #47–#48 remain candidates, not Feature Flow authorization |
| `DL-09` | 2026-08-15 | Authorize W2 delivery after the lifecycle research disposition | R-043 is validated, ADR-002 is accepted, and #46 was independently routed through Feature Flow | FT-046 is the active W2 delivery package; its implementation evidence must satisfy `HG-05A` |
