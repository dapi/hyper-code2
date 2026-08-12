---
title: Product Vision
doc_kind: product
doc_function: canonical
purpose: Observed product direction, experience principles, and non-goals for hyper-code2.
derived_from:
  - ../dna/governance.md
  - context.md
  - sources/README.md
status: active
audience: humans_and_agents
canonical_for:
  - product_vision
  - product_strategy_principles
---

# Product Vision

## Product Promise

Make a coding agent understandable and modifiable from the same project it
works on: durable state in SQLite, small procedural functions, a visible browser
trace, and a single plain-text action protocol.

## Experience Principles

- `XP-01` Prefer inspectable state and ordinary files over opaque framework machinery.
- `XP-02` Keep the runtime small and Bun-native when the platform already offers the primitive.
- `XP-03` Preserve agent work across restarts and forks.
- `XP-04` Keep user-visible execution observable in the browser.
- `XP-05` Treat reusable code as procedural memory: let agents discover,
  compose, create, and improve small functions instead of forcing every
  capability through a bespoke tool or CLI wrapper.
- `XP-06` Make the harness itself adaptable: UI, memory, context management,
  and workflows should be inspectable extension points rather than fixed
  behavior hidden behind a provider-owned client.

## Product Non-Goals

- `PNG-01` Becoming a general wiki, task tracker, or deployment platform.
- `PNG-02` Treating `.hyper/` runtime overlays as shipped core code.
- `PNG-03` Claiming production readiness, public-network safety, or commercial
  positioning without evidence.

## Strategic Bets

The repository documents architectural direction but no approved product bets,
review cadence, or decision owner. Do not convert `TODO.md` or
`docs/reflection.md` into an approved roadmap.
