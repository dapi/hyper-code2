---
title: Operations Index
doc_kind: ops
doc_function: index
purpose: Navigation to local development, configuration, environments, release gaps, and runbooks.
derived_from:
  - ../dna/governance.md
  - ../flows/priming/context-priming.md
status: active
audience: humans_and_agents
---

# Operations

- [Development environment](development.md) — prerequisites, initialization,
  Bun startup, SQLite state, tests, and browser verification.
- [Configuration](config.md) — setting resolution, runtime variables, providers,
  credentials, and secret boundaries.
- [Stages and non-local environments](stages.md) — explicit absence of a documented deployment environment.
- [Release and deployment](release.md) — current repository gates and missing release contract.
- [Runbooks](runbooks/README.md) — operational procedure registry.

Before changing operations or release context, apply the
[operations priming manifest](../flows/priming/ops.yaml).
