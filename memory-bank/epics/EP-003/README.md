---
title: "EP-003: Reversible And Reconstructable Runtime"
doc_kind: epic
doc_function: index
purpose: "Навигация и lifecycle stage инициативы по обратимым runtime extensions, marker-preserving action composition и воспроизводимым harness-bound provider-request receipts."
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

# EP-003: Reversible And Reconstructable Runtime

## Current Stage

- Stage: `roadmap_ready`
- Epic owner / decision owner: Danil Pismenny
- Source / trigger: review of [DeepSeek Harness at `47f9438`](https://github.com/deepseek-ai/deepseek-harness/tree/47f943859bef60e4160492346772ded9b24f765a) and owner routing decision dated 2026-08-15
- GitHub epic: [#42](https://github.com/dapi/hyper-code2/issues/42)
- Delivery milestone: [Reversible Runtime](https://github.com/dapi/hyper-code2/milestone/7)
- Next gate: `Roadmap Ready -> Execution`
- Identifier note: `EP-003` is the Memory Bank initiative ID and is not GitHub issue `#3`.

## Annotated Index

- [Charter](charter.md) — canonical problem, outcome, scope, evidence boundaries and epic acceptance.
- [Roadmap](roadmap.md) — contract-first waves, dependencies, handoff gates and stop rules.
- [Subissues](subissues.md) — accepted research outcomes and gated delivery candidates linked to GitHub.
- [Risks](risks.md) — cross-feature reload, action, reconstruction, security and scope risks.
- [Decision Log](decision-log.md) — owner-approved routing, adoption boundaries and sequencing decisions.
- [PRD-002](../../prd/PRD-002-self-extending-agent-harness.md) — upstream product initiative and delivery boundary.
- [UC-001](../../use-cases/UC-001-run-agent-task.md), [UC-002](../../use-cases/UC-002-execute-agent-action.md), [UC-003](../../use-cases/UC-003-fork-and-delegate.md), [UC-004](../../use-cases/UC-004-hot-reload-capability.md), [UC-005](../../use-cases/UC-005-extend-and-reuse-capability.md), [UC-008](../../use-cases/UC-008-inspect-and-evolve-agent.md), and [UC-009](../../use-cases/UC-009-inspect-harness-bound-model-request.md) — project-level scenarios consumed by the epic.

## Route And Promotion Record

- Task Routing selected Epic Flow because the change requires three independent contract decisions, three gated delivery slices, a shared roadmap, and cross-feature risk governance.
- Epic Intake was skipped because PRD-002, current code, the pinned prior-art source, the non-duplication map, and the owner's explicit epic/milestone decision provide sufficient facts for direct Bootstrap Epic.
- No `brief.md` exists and no intake facts require promotion.
- `charter.md` is active at Epic Ready.
- `roadmap.md`, `subissues.md`, `risks.md`, and `decision-log.md` are active at Roadmap Ready.
- Template-owned `epics/README.md` remains unchanged by lock policy. PRD-002, the product roadmap, GitHub epic #42, and this package provide project-owned reachability.

## Handoff

[FT-046](../../features/FT-046/README.md) is the active W2 delivery package:
R-043 is validated, ADR-002 is accepted, #46 is linked, Feature Flow was
selected, and the package records its validation profile and immutable grounding
revision. It now needs the implementation evidence for `HG-05A`.

No additional delivery `FT-*` package may be created until:

1. the corresponding research contract has an owner disposition;
2. the relevant `EP-SI-*` is accepted for delivery;
3. its GitHub issue exists and is linked here;
4. all applicable cross-epic and security gates pass;
5. Task Routing selects its own delivery flow;
6. the feature records its validation profile and immutable grounding revision.
