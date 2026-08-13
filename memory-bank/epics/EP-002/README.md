---
title: "EP-002: Inspectable And Bounded Self-Evolution"
doc_kind: epic
doc_function: index
purpose: Navigation and lifecycle stage for the initiative that makes the agent's implementation inspectable and its self-change policy-bounded, observable, verified, and reversible.
derived_from:
  - ../../flows/epic.md
  - charter.md
  - roadmap.md
  - subissues.md
  - risks.md
  - decision-log.md
status: active
epic_stage: roadmap_ready
audience: humans_and_agents
---

# EP-002: Inspectable And Bounded Self-Evolution

## Current Stage

- Stage: `roadmap_ready`
- Epic owner / decision owner: Danil Pismenny
- Source / trigger: [Николай Рыжиков Telegram comment](https://t.me/c/1951583351/97428), accepted PRD-002 amendment, and owner authorization dated 2026-08-13
- GitHub epic: not created
- Next gate: `Roadmap Ready -> Execution`
- Identifier note: `EP-002` is the Memory Bank initiative ID and is not a GitHub issue number.

## Annotated Index

- [Charter](charter.md) — canonical problem, outcome, scope, evidence boundaries and acceptance.
- [Roadmap](roadmap.md) — research-first waves, dependencies, handoff gates and stop rules.
- [Subissues](subissues.md) — accepted research outcomes and gated delivery candidates.
- [Risks](risks.md) — cross-feature safety, recovery, prompt-injection and scope risks.
- [Decision Log](decision-log.md) — owner-approved interpretation and epic-local sequencing decisions.
- [UC-008](../../use-cases/UC-008-inspect-and-evolve-agent.md) — active project-level inspect-and-evolve scenario.
- [R-035](../../research/R-035/README.md) — decision-ready truthful SelfDescriptor contract research.
- [R-036](../../research/R-036/README.md) — decision-ready surface-aware activation and recovery contract research.
- [Execution protocol](../../../.protocols/ep-002-self-evolution-orchestration.md) — mutable orchestration status and completion checklist.

## Route And Promotion Record

- Task Routing selected Epic Flow because the requirement spans multiple delivery
  units, shared activation/rollback contracts, cross-feature security risks, and
  a later reflection stream.
- Epic Intake was skipped because the accepted PRD amendment, active UC-008,
  source comment, owner-approved plan, and explicit execution authorization
  provide sufficient facts for direct Bootstrap Epic.
- No `brief.md` exists and no intake facts require promotion.
- `charter.md` is active at Epic Ready.
- `roadmap.md`, `subissues.md`, `risks.md`, and `decision-log.md` are active at Roadmap Ready.
- Managed `memory-bank/epics/README.md` is not modified; PRD-002, product roadmap,
  UC-008, and this package provide project-owned reachability.

## Handoff

No delivery `FT-*` package may be created until:

1. the relevant `EP-SI-*` is accepted for delivery;
2. its GitHub issue exists and is linked here;
3. all applicable `HG-*` gates pass;
4. Task Routing selects its own delivery flow;
5. the feature records its validation profile and immutable grounding revision.
