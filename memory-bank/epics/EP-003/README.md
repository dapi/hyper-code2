---
title: "EP-003: Self-update From GitHub Releases"
doc_kind: epic
doc_function: index
purpose: "Navigation and lifecycle stage for delivering a verified, atomic hcode self-update path from GitHub Releases."
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

# EP-003: Self-update From GitHub Releases

## Current Stage

- Stage: `roadmap_ready`
- Epic owner / decision owner: Danil Pismenny
- Source / trigger: [GitHub epic #53](https://github.com/dapi/hyper-code2/issues/53)
- Next gate: `Roadmap Ready -> Execution`
- GitHub milestone: `Self-update from GitHub Releases` (pending GitHub API rate-limit recovery)

## Annotated Index

- [Charter](charter.md) — problem, outcome, scope, non-scope and evidence boundaries.
- [Roadmap](roadmap.md) — delivery waves, dependencies, handoff gates and stop rules.
- [Subissues](subissues.md) — GitHub-linked delivery registry.
- [Risks](risks.md) — release integrity, activation, compatibility and scope risks.
- [Decision Log](decision-log.md) — epic-local decisions and unresolved design choices.

## Handoff

Each delivery subissue must enter its own Feature Flow package before code changes
begin. Do not update an arbitrary checkout with local changes unless the release
contract explicitly approves that installation mode.
