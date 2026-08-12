---
title: "R-001: Evidence Log"
doc_kind: research
doc_function: canonical
purpose: "Traceable observations from the first scripted and live UC-005 experiment."
derived_from:
  - brief.md
  - plan.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-001: Evidence Log

## Sources

| ID | Source / provenance | Date / freshness | Collection context | Access / quality note |
| --- | --- | --- | --- | --- |
| `SRC-01` | [Reproducible live runner](../../../.protocols/experiments/uc005-live-runner.ts) | 2026-08-13 | Trusted local temp workspace, `codex:gpt-5.4` | Primary instrument; one task family |
| `SRC-02` | [First live observation record](../../../.protocols/experiments/uc005-first-live-observation.md) | 2026-08-13 | Runner JSON plus SQLite transcript inspection | Primary derived record; ephemeral DB summarized, not committed |
| `SRC-03` | [Relevant runtime tests](../../../src/repl/load.test.ts) | 2026-08-13 | `bun test` with four relevant suites | Code-level mechanism evidence, not product validation |

## Observations

| ID | Observation | Supporting `SRC-*` | Applies to | Interpretation boundary |
| --- | --- | --- | --- | --- |
| `OBS-01` | Scripted control created, hot-reloaded and reused a callable; 22 relevant tests passed. | [SRC-03](../../../src/repl/load.test.ts) | `HYP-01` feasibility | Scripted mock is not agent behavior. |
| `OBS-02` | Live baseline found the exact tool result but exhausted the bounded call budget before a final answer. | [SRC-02](../../../.protocols/experiments/uc005-first-live-observation.md) | `HYP-01` | One model and task family. |
| `OBS-03` | Live retain wrote a callable, passed its control call and remained callable after restart. | [SRC-01](../../../.protocols/experiments/uc005-live-runner.ts), [SRC-02](../../../.protocols/experiments/uc005-first-live-observation.md) | `HYP-01` | The write path deviated from the intended marker. |
| `OBS-04` | Later reuse discovered the callable but supplied the wrong argument key, got an empty result and then claimed the golden answer. | [SRC-02](../../../.protocols/experiments/uc005-first-live-observation.md) | `HYP-01`, `HYP-02` | Shows one concrete false-success failure, not its universal cause. |
| `OBS-05` | The trace showed repeated discovery/signature work; it did not isolate result/diagnostic volume as the material blocker. | [SRC-02](../../../.protocols/experiments/uc005-first-live-observation.md) | `HYP-02` | A dedicated #12 comparison could still find value later. |
| `OBS-06` | The fixed sentinel was absent from captured model messages/events. | [SRC-02](../../../.protocols/experiments/uc005-first-live-observation.md) | Safety control | This is not a guarantee for arbitrary secrets or all sinks. |

## Collection Log

| Date | Activity | Result | Deviation / reason |
| --- | --- | --- | --- |
| 2026-08-13 | Scripted control and relevant tests | Mechanism feasible; 22 pass, 0 fail | Scripted agent behavior |
| 2026-08-13 | First live task family | Concrete discovery/signature/false-success failure | Stopped before families two and three per `STOP-03` |

## Evidence Quality Check

- [x] Material observations trace to stable source records.
- [x] Source context and limitations are explicit.
- [x] Observation and interpretation are separated.
- [x] Freshness and sample limits are recorded.
