---
title: Product Roadmap
doc_kind: product
doc_function: canonical
purpose: Approved roadmap state and the boundary between direction, debt, and design notes.
derived_from:
  - ../dna/governance.md
  - context.md
  - vision.md
  - metrics.md
status: active
audience: humans_and_agents
canonical_for:
  - product_roadmap
  - product_themes
---

# Product Roadmap

No project-wide product roadmap or planning owner is approved.

The active initiative roadmap for reusable self-extension is owned by
[`EP-001`](../epics/EP-001/roadmap.md). It governs that initiative only and does
not create project-wide `now/next/later` commitments.

The owner-approved roadmap for inspectable self-model and bounded self-change is
owned by [`EP-002`](../epics/EP-002/roadmap.md). It is a separate initiative:
EP-001 evidence and security handoffs remain with their existing owners.

The owner-approved roadmap for reversible runtime extensions, marker-preserving
action composition, and reconstructable harness-bound provider requests is owned by
[`EP-003`](../epics/EP-003/roadmap.md) and coordinated through the
[Reversible Runtime milestone](https://github.com/dapi/hyper-code2/milestone/7).
EP-003 consumes the existing startup, execution-identity, capability-discovery,
transcript/fork, security, and self-change contracts; it does not replace their
owners or imply that its gated delivery candidates are approved for execution.

- `TODO.md` is an engineering-risk list, not a committed product roadmap.
- `docs/reflection.md` is explicitly a design that is not implemented.
- Git branches and commit messages are historical delivery evidence, not roadmap authority.

Any additional horizon or bet requires a named decision owner and evidence.
This file intentionally contains no invented project-wide `now/next/later` plan.
