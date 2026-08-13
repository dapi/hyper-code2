---
title: Use Cases Index
doc_kind: use_case
doc_function: index
purpose: Навигация по instantiated use cases проекта. Читать, чтобы найти канонический сценарий продукта или зарегистрировать новый.
derived_from:
  - ../dna/governance.md
  - ../flows/use-case.md
  - ../flows/templates/use-case/UC-XXX.md
status: active
audience: humans_and_agents
---

# Use Cases Index

Каталог `memory-bank/use-cases/` хранит канонические пользовательские и операционные сценарии проекта.

Use case нужен для сценария, который живет на уровне продукта, повторяется во времени и может быть upstream для нескольких feature packages. Это не замена `SC-*` внутри `brief.md`: `SC-*` описывают acceptance сценарии delivery-единицы, а `UC-*` описывают устойчивое поведение системы на уровне проекта.

Обычно use case наследует общий product context из [`../product/context.md`](../product/context.md). Если сценарий зависит от предметных правил, states или events, он также должен ссылаться на соответствующие документы из [`../domain/README.md`](../domain/README.md).

## Когда Заводить Use Case

- появляется новый стабильный пользовательский или операционный сценарий;
- несколько features реализуют или меняют один и тот же flow;
- нужен канонический owner для trigger, preconditions, main flow и postconditions.

## Когда Use Case Не Нужен

- сценарий одноразовый и живет только внутри одной feature;
- это implementation detail, а не продуктовый или операционный flow;
- его достаточно описать через `SC-*` в `brief.md`.

Подробные критерии, lifecycle создания и правила для operational / agentic
сценариев определяет [`Use Case Flow`](../flows/use-case.md).

## Реестр

Реестр является аннотированным списком instantiated use cases. Для каждой строки
сделай title относительной ссылкой на `UC-*` и кратко опиши наблюдаемый результат
сценария, а не только повтори название.

Active `PRD-002` является product upstream для `UC-001…008`. `UC-001…004`
владеют active supporting scenarios. Новые initiative-specific `UC-005…007`
остаются draft до прохождения собственного Activation Gate; active PRD не
означает, что эти сценарии уже приняты или реализованы.

`UC-008` активирован решением владельца 2026-08-13 как требуемый сценарий
inspectable and bounded self-evolution. Его active status не является заявлением
о готовой runtime-реализации.

| UC ID | Title | Annotation | Status | Primary actor | Upstream PRD | Implemented by | Last updated |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [`UC-001`](UC-001-run-agent-task.md) | Run an agent task | Operator receives a durable answer or explicit recoverable failure | `active` | Agent operator | [`PRD-002`](../prd/PRD-002-self-extending-agent-harness.md) | current runtime | 2026-08-13 |
| [`UC-002`](UC-002-execute-agent-action.md) | Execute an agent action | Agent observes a paired action result and continues the conversation | `active` | Coding agent | [`PRD-002`](../prd/PRD-002-self-extending-agent-harness.md) | marker runtime | 2026-08-13 |
| [`UC-003`](UC-003-fork-and-delegate.md) | Fork context and delegate work | Parent and child agents diverge at a fixed boundary and bounded work returns | `active` | Operator or parent agent | [`PRD-002`](../prd/PRD-002-self-extending-agent-harness.md) | partial: fork/awaited delegation; invariant gaps remain | 2026-08-13 |
| [`UC-004`](UC-004-hot-reload-capability.md) | Hot-reload a capability | New procedural behavior becomes live without losing durable sessions | `active` | Project developer | [`PRD-002`](../prd/PRD-002-self-extending-agent-harness.md) | partial component-level REPL/loaders evidence | 2026-08-13 |
| [`UC-005`](UC-005-extend-and-reuse-capability.md) | Extend and reuse an agent capability | Useful work can become an inspectable callable capability available to later work | `draft` | Developer/operator or harness builder | [`PRD-002`](../prd/PRD-002-self-extending-agent-harness.md) | partial primitives; no end-to-end scenario | 2026-08-13 |
| [`UC-006`](UC-006-reflect-on-agent-work.md) | Reflect on agent work | Bounded reflection produces an inspectable, reviewable result without hidden self-modification | `draft` | Operator or harness builder | [`PRD-002`](../prd/PRD-002-self-extending-agent-harness.md) | design direction only | 2026-08-13 |
| [`UC-007`](UC-007-consolidate-context.md) | Consolidate a long-running context | Operator may explicitly continue from a provenance-linked successor while source history remains intact | `draft` | Agent operator | [`PRD-002`](../prd/PRD-002-self-extending-agent-harness.md) | no verified scenario | 2026-08-13 |
| [`UC-008`](UC-008-inspect-and-evolve-agent.md) | Inspect and evolve the agent | Agent grounds a current self-description and performs only authorized, verified, observable, reversible self-change | `active` | Trusted coding agent with operator/developer | [`PRD-002`](../prd/PRD-002-self-extending-agent-harness.md) | partial: [FT-036](../features/FT-036/README.md) delivers read-only inspection; mutation ledger, activation and rollback remain unimplemented | 2026-08-13 |

## Naming

- Формат файла: `UC-XXX-short-name.md`
- Вместо `XXX` используй стабильный проектный идентификатор
- Один use case может быть upstream для нескольких feature packages

## Template

- Используй шаблон [`../flows/templates/use-case/UC-XXX.md`](../flows/templates/use-case/UC-XXX.md)
- Создавай и обновляй документ по [`Use Case Flow`](../flows/use-case.md)
