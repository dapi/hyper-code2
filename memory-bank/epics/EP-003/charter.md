---
title: "EP-003: Reversible And Reconstructable Runtime"
doc_kind: epic
doc_function: canonical
purpose: "Govern the contract-first initiative for reversible runtime extension effects, marker-preserving action composition, and reconstructable harness-bound provider requests."
derived_from:
  - ../../flows/epic.md
  - ../../prd/PRD-002-self-extending-agent-harness.md
  - ../../use-cases/UC-001-run-agent-task.md
  - ../../use-cases/UC-002-execute-agent-action.md
  - ../../use-cases/UC-003-fork-and-delegate.md
  - ../../use-cases/UC-004-hot-reload-capability.md
  - ../../use-cases/UC-005-extend-and-reuse-capability.md
  - ../../use-cases/UC-008-inspect-and-evolve-agent.md
  - ../../use-cases/UC-009-inspect-harness-bound-model-request.md
  - ../../engineering/agent-protocol.md
  - ../../engineering/security-boundary.md
status: active
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - feature_mechanism_before_research_disposition
  - global_architecture_policy_without_adr
---

# EP-003: Reversible And Reconstructable Runtime

## Origin And Epic Route

| Field | Value |
| --- | --- |
| Source / trigger | Review of [DeepSeek Harness at commit `47f9438`](https://github.com/deepseek-ai/deepseek-harness/tree/47f943859bef60e4160492346772ded9b24f765a) and the owner request to create a separate epic or milestone dated 2026-08-15 |
| Epic owner / decision owner | Danil Pismenny |
| Why Epic | Extension lifecycle, action composition, and request reconstruction have different contracts and delivery units but share reload, identity, security, and observability risks |
| Intake proposal | Not used; direct Bootstrap Epic |
| GitHub coordination | [Epic #42](https://github.com/dapi/hyper-code2/issues/42) and [Reversible Runtime milestone](https://github.com/dapi/hyper-code2/milestone/7) |

## Problem

The harness has useful small primitives but not three dependable runtime contracts. Reload replaces `ctx.fns` values and records source receipts, yet ownership, removed-overlay fallback, in-flight behavior, and teardown are not one explicit contract. `agent.executeMarker` preserves the marker protocol but centralizes dispatch, execution, result shaping, durable pairing, and events, making extension behavior susceptible to parallel paths and semantic drift. Provider adapters construct provider-bound requests from dynamic prompt, transcript, runtime, model, and provider inputs, but the harness cannot reconstruct its submitted payload for a call or truthfully name missing inputs. It cannot claim visibility into provider-internal model input.

## Outcome

- Runtime-provided behavior has explicit ownership, generation, replacement, quiescence, and teardown semantics.
- Marker actions have an accepted extensibility seam while preserving the existing wire protocol and durable marker/result behavior.
- Each outbound provider call can have an identity-linked, versioned receipt supporting reconstruction of the harness-bound payload or an explicit unavailable/withheld state.
- Evidence remains compatible with SelfDescriptor, durable execution identities, immutable forks, and the named security owner.

## Stakeholder Channels

| Channel | ID / URL | Purpose |
| --- | --- | --- |
| Product decision | Danil Pismenny, owner routing approval dated 2026-08-15 | Scope, contract dispositions, delivery activation, final verdict |
| Product source | [PRD-002](../../prd/PRD-002-self-extending-agent-harness.md) | Self-extending and inspectable harness intent |
| Scenario owners | [UC-002](../../use-cases/UC-002-execute-agent-action.md), [UC-004](../../use-cases/UC-004-hot-reload-capability.md), [UC-005](../../use-cases/UC-005-extend-and-reuse-capability.md), [UC-008](../../use-cases/UC-008-inspect-and-evolve-agent.md), [UC-009](../../use-cases/UC-009-inspect-harness-bound-model-request.md) | Observable action, reload, reuse, inspect/evolve, and request-inspection behavior |
| Prior art | [DeepSeek Harness `47f9438`](https://github.com/deepseek-ai/deepseek-harness/tree/47f943859bef60e4160492346772ded9b24f765a) | Comparative evidence, not project authority |
| Security owner | [#19](https://github.com/dapi/hyper-code2/issues/19); EP-001 | Secret non-transit and managed-sink controls for receipts |
| Existing owners | #7, #11, #13, #22, #31, #14, #17, #34; EP-001 and EP-002 | Dependencies EP-003 consumes rather than duplicates |

## Scope

- `REQ-01` Define effect owner, scope, generation, replacement, quiescence, disposal, partial-failure, and removed-overlay fallback semantics before changing loader behavior.
- `REQ-02` Select and deliver only the lifecycle slice for `ctx.fns` that `REQ-01` accepts; direct captured references and uncontained work must have explicit limits or be excluded.
- `REQ-03` Define a marker-preserving action contract covering identity, dispatch, ordering, authority, cancellation, nesting, terminal behavior, and durable commit ownership.
- `REQ-04` Route every existing marker kind through the accepted seam without changing marker syntax, provider-native tool policy, or marker/result pairing; preserve `§html` behavior, including no synthetic result where that is current behavior.
- `REQ-05` Define a provider-request receipt contract covering transcript/fork revision, exclusions/compaction, prompt layers, runtime context, configuration, capabilities, retries, provenance, versioning, retention, and unavailable/withheld states.
- `REQ-06` Record and inspect accepted harness-bound provider-request receipts only after #17/#34, #19 and other required contract gates are ready.
- `REQ-07` Keep SelfDescriptor generation/source reporting truthful through replacement, removal, fallback, failure, and shutdown.
- `REQ-08` Reuse existing startup, execution identity, action journal/depth/budget, capability discovery, transcript/fork, self-change, network-authority, and secret-boundary owners.
- `REQ-09` Verify representative reload, action, and request-inspection scenarios before final disposition.

## Non-Scope

- `NS-01` Adopting DeepSeek Harness, Cordis, or another general plugin framework wholesale.
- `NS-02` Replacing Bun, `ctx.fns`, ordinary TypeScript composition, or the `§...` marker protocol.
- `NS-03` Provider-native JSON tool calling or a second model action protocol.
- `NS-04` Treating in-process scopes, hooks, `node:vm`, or registries as an adversarial sandbox or authority boundary.
- `NS-05` Replacing #7 startup/shutdown, #22 execution lifecycle, #11 action journal, #13 action budgets/depth, #31/#14 capability comparison, or #17/#34 transcript/fork contracts.
- `NS-06` Selecting a persistent fork/session representation here.
- `NS-07` Persisting or exposing authentication headers, credentials, raw response chunks, hidden provider state, or provider-internal model input.
- `NS-08` Adding new model-visible values, mutation authority, public access, or multi-user operation.
- `NS-09` Implementing EP-002 proposal/activation policy or reopening EP-001 security decisions.

## Source / Evidence Boundaries

| Source | Authority | Refresh rule |
| --- | --- | --- |
| PRD-002 and active use cases | Product intent and observable behavior | Update after material upstream change |
| DeepSeek Harness pinned commit | Prior-art implementation and vocabulary | Comparative evidence only |
| Current code and tests | Exact implementation behavior | Re-ground each research/feature at immutable revision |
| #7/#11/#13/#22/#31/#14/#17/#34/#19 | Existing ownership and pending contracts | Consume accepted outputs; do not choose their open decisions implicitly |
| EP-001 / security boundary | Network authority, secrets and managed sinks | Refresh before receipt delivery |
| EP-002 / SelfDescriptor | Provenance and activation/rollback | Preserve truthfulness; do not widen mutation policy |

## Acceptance

| Criterion | Check |
| --- | --- |
| `EAC-01` | Lifecycle research has owner disposition, alternatives, captured-reference limitations, failure semantics, and ADR assessment |
| `EAC-02` | Accepted `ctx.fns` slice proves its stated replacement/removal/fallback, in-flight, teardown, partial-failure and SelfDescriptor semantics without claiming to control uncontained references |
| `EAC-03` | Action research defines authority, ordering, cancellation, nesting, terminal behavior, special-marker conformance and one durable commit owner; it consumes #11/#13 |
| `EAC-04` | Existing marker kinds preserve wire, pairing, cursor, event, error and cancellation behavior through the accepted seam |
| `EAC-05` | Receipt research defines canonical inputs, submitted-payload boundary, provider rendering, identities, retries, provenance, retention, unavailable/withheld states, #19 sink controls and no provider-internal claim |
| `EAC-06` | Supported provider fixtures reconstruct the harness-bound submitted payload or fail truthfully without invented history |
| `EAC-07` | No raw response chunks, authentication data, credential values, new model-visible content, or provider-internal state are persisted by the initiative |
| `EAC-08` | Existing owners remain authoritative; no duplicate transcript, lifecycle, action journal/budget or security contract is introduced |
| `EAC-09` | Integration evidence covers reload failure, action failure/cancellation, retry/error, prompt override, exclusion/compaction, fork and withholding behavior |
| `EAC-10` | Danil Pismenny records final continue, revise, park, or stop disposition |

## Handoff

Contract questions use Research & Discovery packages. Delivery uses `memory-bank/features/FT-<issue>/` only after research disposition and cross-epic gates. Project-wide architecture choices require an ADR before implementation.
