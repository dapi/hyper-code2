---
title: "UC-004: Hot-Reload An Agent Capability"
doc_kind: use_case
doc_function: canonical
purpose: Defines the stable developer flow for changing callable behavior without discarding durable agent state.
derived_from:
  - ../flows/use-case.md
  - ../product/context.md
  - ../domain/rules.md
status: active
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - architecture_decision
  - feature_level_test_matrix
---

# UC-004: Hot-Reload An Agent Capability

## Goal

A project developer adds or replaces procedural behavior and makes it available
to running agents without restarting the process or losing durable sessions.

## Primary Actor

Project developer or trusted coding agent.

## Trigger

The actor creates or changes a procedure, route, type, or browser-script surface.

## Preconditions

- The server is running and the REPL is reachable.
- The change follows procedural module and source/overlay boundaries.
- The actor is authorized to modify the target path.

## Main Flow

1. The actor changes a procedure under `src/` or a genuine runtime overlay under `.hyper/`.
2. The affected function/module is reloaded.
3. Types or routes are refreshed when their surfaces changed.
4. The actor verifies the live callable/served behavior.
5. Existing durable agent conversations remain available.

## Alternate Flows / Exceptions

- `ALT-01` An overlay intentionally overrides a shipped function by registered name.
- `EX-01` Reload fails; previous durable state remains and the error is observable.
- `EX-02` A core change was placed in `.hyper/`; it must be moved to `src/` before delivery.

## Postconditions

The new callable behavior is active or failure is explicit; durable session state
is not discarded as part of the reload.

## Business Rules

- `BR-01` Shipped core behavior belongs in `src/`.
- `BR-02` Runtime state and experimental overlays must not become hidden core dependencies.

## Traceability

| Upstream / Downstream | References |
| --- | --- |
| Product | [Vision](../product/vision.md) |
| Engineering | [Architecture](../engineering/architecture.md), [coding style](../engineering/coding-style.md) |
| Operations | [Development](../ops/development.md) |
| Implementation | [REPL loader](../../src/repl/load.ts), [route loader](../../src/http/loadRoutes.ts) |
