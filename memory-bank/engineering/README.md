---
title: Engineering Documentation Index
doc_kind: engineering
doc_function: index
purpose: Navigation to the runtime, protocol, trust, UI, testing, and repository conventions of hyper-code2.
derived_from:
  - ../dna/governance.md
  - ../domain/context-map.md
status: active
audience: humans_and_agents
---

# Engineering Documentation

- [Architecture](architecture.md) — Bun process composition, `ctx.fns`, SQLite,
  scheduling, HTTP data plane, and extension boundary.
- [Agent protocol](agent-protocol.md) — marker grammar, execution loop,
  messages/events, synthetic results, and marker-pair invariants.
- [Trust and security boundary](security-boundary.md) — trusted-local execution,
  filesystem/shell/eval authority, credentials, network, and unsupported exposure.
- [Frontend](frontend.md) and [UI guide](ui-design-guide/README.md) — SSR/htmx
  surfaces, fragments, rendering, scripts, and served-output verification.
- [Testing policy](testing-policy.md) and [validation profiles](validation-profiles.md)
  — required automated and manual evidence.
- [Coding style](coding-style.md) — procedural TypeScript and documentation ownership.
- [Autonomy boundaries](autonomy-boundaries.md) — actions requiring supervision or authority.
- [Git workflow](git-workflow.md) — local changes, commits, PRs, and publication boundary.

## Documentation Ownership

Memory Bank owns durable intent, terms, invariants, and engineering contracts.
Code owns exact implementation. `CLAUDE.md` is a concise execution projection
for coding tools; when it conflicts with Memory Bank or current code, report the
conflict, update the canonical owner first, then synchronize the projection.
