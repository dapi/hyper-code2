---
title: "FT-009: TUI MVP"
doc_kind: feature
doc_function: index
purpose: "Navigation for the first full-screen, incrementally rendered hcode terminal interface."
derived_from:
  - ../../dna/governance.md
  - brief.md
status: active
audience: humans_and_agents
---

# FT-009: TUI MVP

## About

This package owns one delivery unit: turn the existing line-oriented `hcode`
preview into a usable single-agent full-screen terminal interface without
absorbing later session-management, PTY, approval, or sandbox milestones.

## Annotated Index

- [`brief.md`](brief.md) — canonical problem, scope, validation profile, and
  acceptance contract for the TUI MVP.
- [`design.md`](design.md) — selected OpenTUI adapter, live-event reconciliation,
  component boundaries, terminal lifecycle, and failure handling.
- [`implementation-plan.md`](implementation-plan.md) — grounded execution sequence
  and verification plan.
- [`ADR-001`](../../adr/ADR-001-select-opentui-core.md) — accepted choice of the
  imperative OpenTUI core and its consequences.
