---
title: "EP-001: Validate Reusable Self-Extension"
doc_kind: epic
doc_function: index
purpose: "Навигация и lifecycle stage инициативы по проверке reusable self-extension, устранению блокирующих contract/security gaps и evidence-led выбору следующей архитектуры."
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

# EP-001: Validate Reusable Self-Extension

## Current Stage

- Stage: `roadmap_ready`
- Epic owner / decision owner: Danil Pismenny
- Source / trigger: active [PRD-002](../../prd/PRD-002-self-extending-agent-harness.md) and owner request dated 2026-08-13
- GitHub epic: [#24](https://github.com/dapi/hyper-code2/issues/24)
- Next gate: `Roadmap Ready -> Execution`
- Identifier note: `EP-001` is the Memory Bank initiative ID and is not GitHub issue `#1`.

## Annotated Index

- [Charter](charter.md) — canonical problem, outcome, scope, evidence boundaries and epic acceptance.
- [Roadmap](roadmap.md) — waves, dependencies, handoff gates and stop rules.
- [Subissues](subissues.md) — accepted and conditional outcomes mapped to waves and product evidence.
- [Risks](risks.md) — cross-feature product, contract, security and scope risks with controls.
- [Decision Log](decision-log.md) — resolved epic-local scope and sequencing decisions; global architecture choices still require ADR when triggered.
- [R-001](../../research/R-001/README.md) — current-runtime UC-005 experiment and first-run synthesis.
- [R-014](../../research/R-014/README.md) — capability-surface comparison and architecture non-selection.
- [R-018](../../research/R-018/README.md) — secret non-transit research and sentinel plan.
- [R-029](../../research/R-029/README.md) — network-to-process authority research.

## Route And Promotion Record

- Task Routing selected Epic Flow because the initiative requires multiple delivery units, a shared roadmap and cross-feature risk governance.
- Epic Intake was skipped because active PRD-002, the owner decision and the approved adapted plan already provide sufficient canonical facts for direct Bootstrap Epic.
- No `brief.md` exists and no intake facts require promotion.
- `charter.md` is active at Epic Ready.
- `roadmap.md`, `subissues.md`, `risks.md` and `decision-log.md` are active at Roadmap Ready.
- Template-owned `epics/README.md` and `research/README.md` remain unchanged by
  lock policy. The adapted PRD index routes to this package; this package indexes
  its research packages. Doctor therefore reports deep-navigation warnings, not errors.

## Handoff

No delivery `FT-*` package may be created until:

1. a relevant `EP-SI-*` is accepted;
2. its GitHub issue exists and is linked here;
3. all applicable `HG-*` gates pass;
4. Task Routing selects its own flow;
5. a delivery feature records its own validation profile.
