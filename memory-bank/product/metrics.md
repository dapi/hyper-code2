---
title: Product Metrics
doc_kind: product
doc_function: canonical
purpose: Product measurement gaps and currently available engineering signals.
derived_from:
  - ../dna/governance.md
  - context.md
status: active
audience: humans_and_agents
canonical_for:
  - product_metrics
  - success_measurement
---

# Product Metrics

No product North Star, baseline, target, measurement owner, or analytics source
is documented. This is an explicit gap.

## Available Engineering Signals

| Signal | Current contract | Source | Limitation |
| --- | --- | --- | --- |
| Type safety | `bunx tsc --noEmit` passes | `.github/workflows/test.yml` | Quality gate, not user value |
| Regression suite | `bun test --timeout 5000` passes after frozen install | `.github/workflows/test.yml` | Mock-first and repository-local |
| Session durability | Covered by SQLite/session tests | `src/session/*.test.ts` | No production reliability target |

## Guardrails And Gaps

- Do not turn test counts, LOC, provider count, or agent count into product metrics.
- Product adoption, task completion, latency, cost, reliability, and satisfaction
  need an owner and instrumentation decision before they can become metrics.
- Conversation content may be sensitive; analytics must not be added without an
  explicit privacy and retention contract.
