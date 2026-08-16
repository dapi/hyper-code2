---
title: "UC-009: Inspect A Harness-Bound Model Request"
doc_kind: use_case
doc_function: canonical
purpose: "Фиксирует повторяемый read-only сценарий, в котором trusted operator или developer инспектирует request, сформированный харнессом для провайдера, либо получает явный unavailable outcome."
derived_from:
  - ../flows/use-case.md
  - ../product/context.md
  - ../prd/PRD-002-self-extending-agent-harness.md
  - ../engineering/agent-protocol.md
  - ../engineering/security-boundary.md
status: active
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - provider_internal_behavior
  - feature_level_test_matrix
---

# UC-009: Inspect A Harness-Bound Model Request

## Goal

A trusted operator or project developer can inspect the request payload that the harness formed for one identified provider call, together with its provenance, or receives a truthful unavailable/withheld outcome. The scenario does not claim visibility into provider-side prompt injection, normalization, or any other provider-internal model input.

## Primary Actor

Trusted agent operator or project developer.

## Trigger

The actor needs to diagnose an answer, provider failure, prompt/context change, or controlled secret-boundary evidence for a specific model call.

## Preconditions

- The actor can identify a model call in a trusted local harness session.
- The request receipt and every required source snapshot are available under the applicable retention and managed-sink policy, or the system can report why they are unavailable.
- The actor has the existing authority to inspect the relevant durable work; this scenario grants no new execution or mutation authority.

## Main Flow

1. The actor selects one model call from a durable task, including a failed or retried call when relevant.
2. The harness returns a versioned receipt with request identity, provider rendering identity, provenance, and availability state.
3. The harness reconstructs the provider-bound payload from recorded immutable inputs, or reports a specific unavailable or withheld prerequisite.
4. The actor inspects the payload and provenance to diagnose the observed outcome without changing the conversation, future model input, or runtime authority.

## Alternate Flows / Exceptions

- `ALT-01` A retry has a distinct attempt receipt; the actor can distinguish a shared canonical input from a separately rendered or unavailable attempt.
- `EX-01` A source snapshot is stale, absent, or unsupported; the harness marks reconstruction unavailable and does not fabricate a historical payload.
- `EX-02` The applicable secret non-transit or managed-sink policy withholds the requested representation; the harness reports that policy outcome without exposing a credential, authentication header, raw stream chunk, or secret value.
- `EX-03` The provider may have altered or supplemented the submitted payload; the harness reports only its own provider-bound payload and does not claim to reveal provider-internal model input.

## Postconditions

- The actor receives a provenance-linked payload, unavailable state, or withheld state for the selected call.
- The durable conversation remains the canonical transcript; the receipt does not create a competing transcript or modify existing session history.
- Inspection remains read-only and does not add new model-visible content.

## Business Rules

- `BR-01` A receipt represents the harness-bound provider request, not the provider's final internal model input.
- `BR-02` Every reconstructable payload names its request/call identity, provider rendering version, and provenance for each required input.
- `BR-03` Missing, stale, unsupported, or policy-withheld inputs produce an explicit state instead of an invented reconstruction.
- `BR-04` Authentication headers, credential values, raw response chunks, and secret values are never exposed by this scenario.
- `BR-05` A receipt is subject to the same accepted secret-boundary and managed-sink controls as every other durable/external representation.

## Operational Contract

### Observable Status

The scenario exposes `reconstructable`, `unavailable`, or `withheld` for the selected call. Exact schema and retention mechanism belong to downstream design.

### Diagnostics And Recovery

Unavailable and withheld results name the missing snapshot, unsupported provider rendering, or governing policy class. Recovery may create a new request receipt for a later call; it never mutates or invents the selected historical payload.

## Traceability

| Upstream / Downstream | References |
| --- | --- |
| PRD | [PRD-002](../prd/PRD-002-self-extending-agent-harness.md) `G-11`, `BR-10`, `VAL-10` |
| Epic | [EP-003](../epics/EP-003/README.md) |
| Features | Candidate [GitHub #48](https://github.com/dapi/hyper-code2/issues/48); no `FT-*` package yet |
| Engineering | [Agent protocol](../engineering/agent-protocol.md), [Trust and security boundary](../engineering/security-boundary.md) |

## Downstream Behavior Coverage

No delivery feature is accepted yet. Candidate #48 must add feature-level examples and checks after the EP-003 request-envelope research is dispositioned.
