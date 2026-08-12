---
title: "PRD-001: Memory Bank Adoption"
doc_kind: prd
doc_function: canonical
purpose: Records the problem, scope, evidence, gaps, and success criteria for adopting Memory Bank in hyper-code2.
derived_from:
  - ../product/context.md
  - ../product/customers.md
  - ../product/metrics.md
  - ../domain/glossary.md
  - ../engineering/architecture.md
  - ../ops/development.md
status: active
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - architecture_decision
  - feature_level_verify_contract
---

# PRD-001: Memory Bank Adoption

## Problem

Project knowledge was spread across the root README, a large `CLAUDE.md`, code,
architecture notes, CI, and TODOs. Fresh agent sessions had no governed index for
product intent, domain language, engineering contracts, operational gaps, or
source ownership. Some existing prose is stale or internally inconsistent.

## Users And Jobs

| User | Job | Current pain |
| --- | --- | --- |
| Project developer | Change the runtime without reconstructing architecture and conventions | Facts are distributed and freshness is uneven |
| Coding agent | Find authoritative context and select a safe delivery flow | Entry points and ownership were implicit |

## Goals

- Install an updateable Memory Bank with a pinned upstream identity.
- Route agents from repository instructions to governance and task routing.
- Adapt product, domain, engineering, and operations owners from repository evidence.
- Preserve unknowns and conflicts rather than filling placeholders with guesses.
- Pass Memory Bank navigation and doctor diagnostics locally.

## Non-Goals

- Change runtime behavior, database schema, or user-facing features.
- Invent a deployment, roadmap, customer segment, metric, or owner.
- Implement the reflection-loop design or TODO items.
- Enable production rollout or publish repository changes.

## Scope

In scope: the installed `memory-bank/`, agent routing block, template ownership
lock, local workflow assets supplied by upstream, an evidence-backed intake, and
project-specific owner documents.

Out of scope: runtime behavior changes, CI enforcement of `memory-bank-cli doctor`,
and a separate delivery feature package.

## Success Criteria

- `memory-bank/.lock` records upstream commit
  `da30530e62ae802a03838df6118b1e3931b4f483`.
- `memory-bank-cli lint` and `memory-bank-cli doctor` have no blocking findings.
- Product, domain, engineering, and operations documents contain project facts or
  explicit gaps/N/A statements rather than generic placeholders.
- Existing Bun type-check and tests remain green.
- Root and section indexes describe the downstream project rather than template adoption.
- Domain concepts are separated from engineering realization details.
- Core agent, action, fork/delegation, and hot-reload scenarios are
  active in the use-case registry.

Validation profile: `documentation`.

Triggers / rationale: governed documentation, comments, and local bootstrap
documentation change; no runtime contract or non-local state is mutated.

Downgrade approval: none required.

## Evidence, Conflicts, And Gaps

The temporary intake is `brownfield-intake-prd.md`. Key conflicts retained from
discovery:

- the beginning of `CLAUDE.md` says one agent/eval-only while current code and
  later docs implement multi-agent markers;
- approximate LOC and marker-count statements in older prose are stale;
- `docs/reflection.md` is design-only and not a shipped capability.

Accountable human ownership, non-local environments, privacy/retention rules,
product metrics, supported platforms/providers, and deployment remain unknown.

## Disposition

The intake remains as historical discovery evidence. The adapted Memory Bank is
active; future changes follow upstream-first ownership and the normal
task-routing contract. External delivery orchestration is intentionally deferred
to separate future tasks.
