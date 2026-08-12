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
| `SRC-04` | [Instrument v2](../../../.protocols/experiments/README.md) and [canonical offline report](../../../.protocols/experiments/runs/canonical-offline/report.json) | 2026-08-13 | Credential-owning broker, sandboxed child phases and separate restart verifier | Primary instrument evidence on macOS; production boundary remains unchanged |
| `SRC-05` | [Tag-normalization live v2 report](../../../.protocols/experiments/runs/2026-08-13-tags-v2/report.json), [retain trace](../../../.protocols/experiments/runs/2026-08-13-tags-v2/phase-retain.sanitized.json) and checksums in the [instrument run directory](../../../.protocols/experiments/README.md) | 2026-08-13 | `codex:gpt-5.4`, fixed tag fixture, sanitized primary artifacts | One task family; configured model alias is not an immutable model snapshot |

## Observations

| ID | Observation | Supporting `SRC-*` | Applies to | Interpretation boundary |
| --- | --- | --- | --- | --- |
| `OBS-01` | Scripted control created, hot-reloaded and reused a callable; 22 relevant tests passed. | [SRC-03](../../../src/repl/load.test.ts) | `HYP-01` feasibility | Scripted mock is not agent behavior. |
| `OBS-02` | Live baseline found the exact tool result but exhausted the bounded call budget before a final answer. | [SRC-02](../../../.protocols/experiments/uc005-first-live-observation.md) | `HYP-01` | One model and task family. |
| `OBS-03` | Live retain wrote a callable, passed its control call and remained callable from a second context created inside the same Bun process. | [SRC-01](../../../.protocols/experiments/uc005-live-runner.ts), [SRC-02](../../../.protocols/experiments/uc005-first-live-observation.md) | `HYP-01` | The write path deviated from the intended marker; no OS-process restart was tested. |
| `OBS-04` | Later reuse discovered the callable but supplied the wrong argument key, got an empty result and then claimed the golden answer. | [SRC-02](../../../.protocols/experiments/uc005-first-live-observation.md) | `HYP-01`, `HYP-02` | Shows one concrete false-success failure, not its universal cause. |
| `OBS-05` | The trace showed repeated discovery/signature work; it did not isolate result/diagnostic volume as the material blocker. | [SRC-02](../../../.protocols/experiments/uc005-first-live-observation.md) | `HYP-02` | A dedicated #12 comparison could still find value later. |
| `OBS-06` | The fixed sentinel was absent from captured model messages/events. | [SRC-02](../../../.protocols/experiments/uc005-first-live-observation.md) | Safety observation | The runner was unrestricted and relied on prompt instructions; this does not satisfy `HG-02` or guarantee non-transit across all sinks. |
| `OBS-07` | Instrument v2 ran three agent phases and restart verification in distinct OS processes; agent children used disposable HOME, OS-enforced write/network restrictions and no provider credentials, while a separate broker owned authentication/network. | [SRC-04](../../../.protocols/experiments/README.md), [SRC-05](../../../.protocols/experiments/runs/2026-08-13-tags-v2/report.json) | Revised experiment gate | Establishes the experiment boundary on this macOS host, not the production runtime contract. |
| `OBS-08` | The repeated live baseline produced matching golden tool and final results with no phase error. | [SRC-05](../../../.protocols/experiments/runs/2026-08-13-tags-v2/report.json) | `HYP-01` baseline | Does not exercise retention or later reuse. |
| `OBS-09` | The retain phase spent six continuations inspecting missing files and directory shapes, then hit its call limit without writing a capability or returning a control result. | [SRC-05](../../../.protocols/experiments/runs/2026-08-13-tags-v2/phase-retain.sanitized.json) | `HYP-01`, `HYP-02` | One prompt/model/task; shows discovery and action-efficiency failure under the fixed contract. |
| `OBS-10` | The later-use phase returned an empty result consistent with its tool result, and the separate restart verifier found no callable; no false success occurred. The configured sentinel was not injected into the tested pipeline and did not appear accidentally in captured artifacts. | [SRC-05](../../../.protocols/experiments/runs/2026-08-13-tags-v2/report.json) | `HYP-01`, negative observation | Correct failure reporting is improved evidence, but reuse failed because retain produced nothing; this is not a secret non-transit test. |

## Collection Log

| Date | Activity | Result | Deviation / reason |
| --- | --- | --- | --- |
| 2026-08-13 | Scripted control and relevant tests | Mechanism feasible; 22 pass, 0 fail | Scripted agent behavior |
| 2026-08-13 | First live task family | Concrete discovery/signature/false-success failure | Stopped before families two and three per `STOP-03` |
| 2026-08-13 | Instrument v2 canonical offline fixture | Gold/result/final and separate-process restart checks passed; checksums valid | Mock behavior validates the instrument only |
| 2026-08-13 | Repeated live tag-normalization family on v2 | Baseline passed; retain failed within call budget; reuse/restart correctly reported absence | Stopped before remaining families per `STOP-03` |

## Evidence Quality Check

- [x] Material observations trace to stable source records.
- [x] Source context and limitations are explicit.
- [x] Observation and interpretation are separated.
- [x] Freshness and sample limits are recorded.
- [x] The v2 pass retains sanitized transcripts, report and checksums as stable primary evidence; the first pass remains derived-only and is labeled accordingly.
