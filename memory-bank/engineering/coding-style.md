---
title: Coding Style
doc_kind: engineering
doc_function: convention
purpose: Project-specific Bun and procedural TypeScript conventions.
derived_from:
  - ../dna/governance.md
  - architecture.md
status: active
audience: humans_and_agents
---

# Coding Style

- Use Bun, `bun:test`, and Bun built-ins before adding Node-oriented libraries.
- Keep one anonymous default-exported procedure per file.
- Use `(ctx, opts)` and call other project functions through `ctx.fns`.
- Keep project types global through `$type_*` files and generated `ctx_ns.d.ts`;
  do not add cross-module type imports.
- Put optional values inside the options object and use explicit defaults.
- Keep comments for rationale and boundary conditions, especially persistence,
  scheduling, and marker invariants.
- Use special filename conventions exactly as implemented by project scanners.
- Keep core code in `src/`, runtime overlays in `.hyper/`, and test fixtures in
  `.test-tmp/`.

There is no configured formatter or standalone linter. The canonical static
check is `bunx tsc --noEmit`; preserve the existing local formatting style.
[CLAUDE.md](../../CLAUDE.md) contains the expanded operational cheat sheet.

## Documentation Ownership

- Memory Bank owns durable terms, invariants, workflows, and engineering contracts.
- Code owns exact signatures, algorithms, schemas, routes, and current behavior.
- `CLAUDE.md` projects current coding instructions for tools and must link back to
  canonical Memory Bank owners instead of becoming an independent source of truth.
- Update the canonical owner first, then synchronize affected projections and indexes.
