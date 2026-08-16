---
title: "R-043: Research Synthesis"
doc_kind: research
doc_function: canonical
purpose: "W1A findings, confidence and lifecycle alternatives for EP-003."
derived_from:
  - brief.md
  - evidence.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-043: Research Synthesis

## Findings

| ID | Finding | Evidence | Confidence | Implication for `RQ-01` / `HYP-01..02` |
| --- | --- | --- | --- | --- |
| `FND-01` | Current `ctx.fns` loading has source-consistency and provenance receipts, but no single owner for the full effect lifecycle. | [OBS-01](evidence.md#observations), [OBS-05](evidence.md#observations) | high | Supports `HYP-01`; delivery must define ownership before changing behavior |
| `FND-02` | Replacement is registry assignment, while removal/fallback is only achieved when a later load resolves a currently existing candidate; absent names are not reconciled away. | [OBS-02](evidence.md#observations), [OBS-03](evidence.md#observations) | high | The minimum contract needs explicit membership reconciliation and fallback states |
| `FND-03` | Targeted failure preserves the prior registry entry, but namespace reload has no transaction boundary and no evidence for in-flight quiescence. | [OBS-04](evidence.md#observations) | medium | Partial-failure and in-flight semantics require dedicated delivery fixtures |
| `FND-04` | SelfDescriptor can truthfully report unavailable/stale source facts, but it is not a revocation, lease or disposal mechanism. | [OBS-06](evidence.md#observations) | high | Preserve descriptor ownership; do not make it the lifecycle owner |

## Alternatives

| Alternative | Strength | Material limitation |
| --- | --- | --- |
| `A-01` Keep replacement-only loader and document limitations | Smallest change; preserves current behavior | Does not satisfy EP-003 W1A removal, quiescence or teardown contract |
| `A-02` Generation-owned registry with staged namespace commit, explicit fallback/removal state, call leases and disposal hooks | Covers replacement, membership, partial failure and in-flight behavior in one bounded owner | Requires a project-level lifecycle contract; captured direct references remain outside control; disposal must be best-effort and observable |
| `A-03` Isolate each extension in a worker/process | Stronger teardown and reference isolation | Conflicts with EP-003 non-scope, Bun/procedural composition and existing `ctx.fns` contracts; high architectural cost |

## Limitations and Disconfirming Evidence

| ID | Limitation / conflicting signal | Effect on conclusion | Mitigation or next question |
| --- | --- | --- | --- |
| `LIM-01` | No dedicated test currently demonstrates absent-name cleanup, concurrent old-generation calls or disposal hooks. | Recommendation is contract-level, not proof of an implementation | Add adversarial fixtures in the separately routed feature |
| `LIM-02` | One bootstrap test failed because `shiki` is missing locally. | No all-suite green claim; reload and descriptor focused observations remain usable | Restore/install pinned dependencies before delivery validation |
| `LIM-03` | Direct captured function references are not discoverable or revocable through property replacement. | No in-process lifecycle can honestly claim universal disposal | Keep explicit uncontained limitation in contract and SelfDescriptor |

## Answer to Decision Question

`RQ-01` is answered by recommending `A-02` as the minimum bounded lifecycle contract: one generation owner stages a replacement set, commits it as a coherent registry update, records fallback/removal truth, tracks managed in-flight calls through leases, and invokes explicit best-effort disposal after quiescence. The contract must state that direct references captured before replacement are uncontained and may outlive the registry generation. `self.describe` remains a read-only truthfulness surface, not the owner of lifecycle effects.

Confidence is high for the current-state gap and medium for the proposed shape because concurrent and teardown fixtures have not yet been implemented.

## Review Check

- [x] Findings trace through observations to sources.
- [x] Confidence reflects source/test coverage.
- [x] Alternatives, disconfirming evidence and uncontained references are visible.
