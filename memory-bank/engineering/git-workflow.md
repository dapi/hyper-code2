---
title: Git Workflow
doc_kind: engineering
doc_function: convention
purpose: Confirmed branch, commit, review, and publication expectations.
derived_from:
  - ../dna/governance.md
status: active
audience: humans_and_agents
---

# Git Workflow

- Default branch: `main`.
- Keep changes reviewable and preserve unrelated user work in a dirty checkout.
- Use concise present-tense commit messages, commonly with a type and scope.
- Before review, run the checks required by the selected validation profile and
  report remaining manual or external gaps.
- A PR should state outcome, verification, risks, and any follow-up.
- Branch naming, squash policy, required approvals, and issue-reference rules are
  not documented; do not invent them.
- Do not commit, push, publish, or open a PR unless the current task authorizes it.
