---
title: "EP-002: Roadmap"
doc_kind: epic
doc_function: roadmap
purpose: Research-first execution waves, dependencies, gates and stop rules for inspectable and bounded self-evolution.
derived_from:
  - charter.md
status: active
audience: humans_and_agents
must_not_define:
  - code_steps
  - final_database_schema
  - production_rollout_dates
---

# EP-002: Roadmap

## Waves

| Wave | Target | Depends on | Exit gate |
| --- | --- | --- | --- |
| `W0` | Product amendment, active UC-008, epic owners, source provenance and measurement/safety boundaries | Owner acceptance | `HG-01` |
| `W1A` | Resolve the minimum useful SelfDescriptor contract and evidence model | `W0` | `HG-02` |
| `W1B` | Resolve surface classification, approval, activation, verification and rollback contracts | `W0`; may run with `W1A` | `HG-03` |
| `W2` | Deliver and dogfood a read-only self-model and inspectable UI/API surface | `W1A`; security constraints refreshed | `HG-04` |
| `W3` | Deliver proposal ledger and bounded `.hyper/` staging/activation/rollback | `W1B`, `W2`; EP-001 constraints accepted where applicable | `HG-05` |
| `W4` | Govern shipped-core and base-prompt self-change paths | `W1B`, evidence from `W3`; ADR when triggered | `HG-06` |
| `W5` | Deliver reflection-to-candidate with manual promotion, budgets, regression checks and kill switch | `W2`; proposal ledger from `W3`; separate reflection review | `HG-07` |
| `W6` | Evaluate end-to-end UC-008 outcomes and record continue/revise/park/stop disposition | Representative evidence from delivered waves | `HG-08` |

## Current Wave State

| Wave | State | Evidence / next gate |
| --- | --- | --- |
| `W0` | completed | PRD-002 amendment, source capture, active UC-008, EP-002 direct bootstrap and owner authorization exist |
| `W1A` | completed: validated | [R-035](../../research/R-035/README.md) accepted a compact grounded descriptor contract; exact mechanism remains downstream design |
| `W1B` | completed: validated | [R-036](../../research/R-036/README.md) accepted surface-aware policy and versioned overlay recovery direction; mutation delivery remains separately gated |
| `W2` | pending | Requires accepted W1A contract, its own Feature Flow package, and verified closure of separately routed prerequisite [#35](https://github.com/dapi/hyper-code2/issues/35) |
| `W3` | blocked | Requires W1B acceptance and verified W2 behavior |
| `W4` | blocked | Requires evidence from W3 and explicit architecture/approval decisions |
| `W5` | blocked | Requires bounded proposal path and separate reflection activation review |
| `W6` | pending | Requires representative delivered evidence |

## First Slice Recommendation

`EP-SI-01` and `EP-SI-02` are validated as separate Research &
Discovery units. They answer different questions: what the agent can truthfully
know about its current implementation, and how a proposed change becomes active
or recoverable. The read-only feature may now be routed. Mutation features remain
blocked on their later roadmap gates and do not inherit delivery approval merely
from R-036 validation.

## Handoff Gates

| Gate | Required evidence |
| --- | --- |
| `HG-01` Product readiness | Exact source and URL preserved; owner interpretation in PRD-002; active UC-008; scope/non-scope, risks and decision owner recorded |
| `HG-02` SelfDescriptor decision readiness | Bounded question; current-runtime/source inventory; candidate contracts; freshness, provenance, override, unknown and secret-value handling; limitations; owner disposition; ADR trigger assessed |
| `HG-03` Self-change decision readiness | Surface classes; authority/approval matrix; proposal and state transitions; atomicity/recovery alternatives; failure semantics; prompt-injection boundary; durable-work preservation; owner disposition; ADR trigger assessed |
| `HG-04` Read-only delivery | Accepted descriptor contract; linked issue and Feature Flow package; validation profile; immutable grounding; tests plus live served behavior; no mutation authority added |
| `HG-05` Overlay mutation delivery | Accepted W1B contract; read-only baseline; constrained `.hyper/` scope; snapshot/recovery proof; denied and approval paths; durable audit; end-to-end rollback evidence |
| `HG-06` Core/prompt governance | Explicit human approval contract; accepted ADR where triggered; independent review; fastest safe rollback; no silent activation |
| `HG-07` Reflection candidate delivery | Candidate-only boundary; provenance; manual promotion; rate/cost limits; regression set; prompt-injection tests; kill switch; no auto-promotion |
| `HG-08` Epic disposition | Representative UC-008 traces; supported/unsupported/inconclusive verdicts; limitations; unresolved risks and owned follow-ups; owner decision |

## Stop Rules

- Stop mutation delivery while `HG-03` is incomplete.
- Stop if the proposed design grants authority beyond the existing task and process boundary.
- Stop if a real secret value is proposed; use only controlled sentinels under the EP-001 security contract.
- Stop if self-description cannot distinguish observed facts, inferences and unavailable facts.
- Stop if an overlay becomes a hidden dependency of shipped core.
- Stop if rollback depends on the exact candidate implementation that may have failed.
- Stop reflection delivery if candidate output can become active without explicit promotion.
- Stop non-local/shared execution while the existing network-to-process authority gap remains open.
- Promote project-wide descriptor, activation, persistence, isolation or recovery architecture to an ADR before delivery.
- Record inconclusive evidence honestly; do not redefine success after collection.
