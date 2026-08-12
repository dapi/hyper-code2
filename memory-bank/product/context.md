---
title: Product Context
doc_kind: product
doc_function: canonical
purpose: Project-wide product problem, users, workflows, outcomes, and constraints for hyper-code2.
derived_from:
  - ../dna/governance.md
  - sources/README.md
status: active
audience: humans_and_agents
canonical_for:
  - project_product_context
  - product_problem_space
  - top_level_outcomes
---

# Product Context

hyper-code2 is a developer-operated AI-agent server for doing software work in a
real workspace while keeping conversation, actions, and results durable and
inspectable. It combines a browser UI, a plain-text action protocol, persistent
agent sessions, and a procedural extension model that can be changed without
discarding runtime state.

## Origin And Rationale

The 2026-08-12 source talk frames hyper-code2 as an experiment in moving beyond
tool-heavy agent harnesses. Its central proposition is that an agent already
knows how to write and compose code, so reusable functions and SDKs can serve
as both capability and durable procedural memory. A reflective runtime, web UI,
forkable context, and hot reload then make the harness itself continuously
adaptable by its operator and agent.

This records the presenter's product rationale, not proof that every described
prototype capability is implemented or production-ready. See
[Primary product sources](sources/README.md) for provenance and the source
boundary.

## Core Workflows

- [`UC-001`](../use-cases/UC-001-run-agent-task.md) — operate an agent from task submission to a durable answer.
- [`UC-002`](../use-cases/UC-002-execute-agent-action.md) — execute a marker action and return its result to the conversation.
- [`UC-003`](../use-cases/UC-003-fork-and-delegate.md) — branch context or delegate bounded work to another agent.
- [`UC-004`](../use-cases/UC-004-hot-reload-capability.md) — add or replace a procedural capability without losing session state.

## Top-Level Outcomes

No product-level metric has an approved baseline or target. Type-checks and tests
are quality gates, not evidence of user value. See [Metrics](metrics.md).

## Product Constraints

- The runtime is Bun-first and procedural.
- Agent actions use the marker protocol rather than native model tool calls.
- Agent work must survive ordinary process restarts through durable storage.
- The product is a trusted local/developer tool, not a sandboxed public or
  multi-tenant service; see the [trust boundary](../engineering/security-boundary.md).
- Shipped runtime behavior belongs in `src/`; `.hyper/` is runtime or experimental state.
- Production deployment, data retention promises, and supported-platform policy
  are not documented and must not be inferred.

## Evidence

- [Root README](../../README.md) — current product overview and capabilities.
- [Runtime entrypoint](../../src/$main.ts) — executable composition of the server.
- [2026-08-12 source talk](sources/2026-08-12-self-extending-ai-harness-transcript.txt)
  — primary source for the product rationale and the “functions instead of
  skills” framing; excludes the unrelated private conversation after the call.
