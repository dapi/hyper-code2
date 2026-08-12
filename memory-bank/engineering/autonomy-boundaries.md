---
title: Autonomy Boundaries
doc_kind: engineering
doc_function: canonical
purpose: Repository-specific agent autonomy, supervision, and escalation boundaries.
derived_from:
  - ../dna/governance.md
canonical_for:
  - agent_autonomy_rules
  - escalation_triggers
  - supervision_checkpoints
status: active
audience: humans_and_agents
---

# Autonomy Boundaries

## Allowed Within An Authorized Task

- Read relevant repository files and inspect local git state.
- Edit in-scope code and documentation while preserving unrelated work.
- Install frozen local dependencies and run tests, type-checks, and read-only diagnostics.
- Create migrations or contract changes when the task requires them, but surface
  their risk and verification evidence before handoff.

## Requires Explicit Authority

- Commit, push, open or merge PRs, create external issues, or publish artifacts.
- Deploy or change a non-local environment.
- Send data, source, transcripts, credentials, or messages outside the workspace.
- Run destructive database/filesystem operations or mutate real provider accounts.
- Broaden a local task into a new service, rollout, or product direction.

## Escalate

Escalate when intent or ownership is ambiguous, secrets or production data may be
affected, a required contract decision has no owner, observed sources conflict in
a way that changes implementation, or verification cannot control the risk.
