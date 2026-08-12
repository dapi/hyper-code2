---
title: hyper-code2 Memory Bank
doc_kind: project
doc_function: index
purpose: Canonical entry point to the durable product, domain, engineering, operations, and delivery context of hyper-code2.
derived_from:
  - dna/principles.md
  - dna/governance.md
status: active
audience: humans_and_agents
---

# hyper-code2 Memory Bank

hyper-code2 is a trusted, developer-operated AI-agent server on Bun. Its core
ideas are durable conversations in SQLite, a plain-text marker action protocol,
procedural `ctx.fns` functions that can be reloaded, and a browser UI driven by
server-rendered HTML and incremental event delivery.

## Start Here

- [Product](product/README.md) — why the system exists, its users, workflows,
  constraints, metrics gaps, and product direction.
- [Domain](domain/README.md) — stable language and observable concepts: agents,
  conversations, turns, actions, runs, forks, delegation, workspaces, and artifacts.
- [Use cases](use-cases/README.md) — canonical end-to-end user and agent scenarios.
- [Engineering](engineering/README.md) — runtime architecture, agent protocol,
  trust boundary, UI contract, tests, and code conventions.
- [Operations](ops/README.md) — local setup, configuration, SQLite state, and
  explicit non-local environment gaps.

## Delivery And Governance

- [Delivery flows](flows/README.md) — lifecycle indexes, priming manifests, and
  governed templates for incidents, bugs, research, changes, features, and epics.
- [Task routing](flows/routing.md) — select the smallest lifecycle appropriate to a task.
- [Validation profiles](engineering/validation-profiles.md) — select validation depth independently of delivery flow.
- [PRDs](prd/README.md), [features](features/README.md), [epics](epics/README.md),
  [research](research/README.md), and [ADRs](adr/README.md) — governed delivery artifacts.
- [DNA](dna/README.md) — SSoT, lifecycle, frontmatter, and cross-reference rules.
- [Prompts](prompts/README.md) — human-only reusable prompt catalog; do not use it
  as workflow input unless the current task explicitly concerns prompt artifacts.

## Source-Of-Truth Boundary

- Memory Bank owns durable intent, terminology, invariants, workflows, and
  engineering/operations contracts.
- Current code owns exact implementation behavior and signatures.
- `CLAUDE.md` is an execution-oriented projection and operational cheat sheet.
  It must follow Memory Bank and current code, not become a competing owner.
- A conflict is reported and fixed upstream-first; it is never resolved silently.
