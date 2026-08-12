---
title: "R-018: Research Synthesis"
doc_kind: research
doc_function: canonical
purpose: "Bounded findings and remaining uncertainty from the first secret non-transit collection cycle."
derived_from: [brief.md, evidence.md]
status: active
audience: humans_and_agents
---
# R-018: Research Synthesis

## Findings

| ID | Finding | Evidence | Confidence | Implication for `RQ-*` / `HYP-*` |
| --- | --- | --- | --- | --- |
| `FND-01` | A mechanism-neutral conformance boundary is expressible: a value classified as secret may be consumed by a privileged provider-transport boundary, but must be absent from agent-executable inputs, model system/messages, action success/error output, persisted transcript/event payloads, rendered diagnostics and other externally observable sinks. | [OBS-02, OBS-03](evidence.md#observations), [SRC-07](evidence.md#sources) | `medium` | Supports `HYP-01` as a reviewable target contract; it does not select how to enforce it. |
| `FND-02` | The sampled current route does not conform: a declared-secret-shaped synthetic value can cross from settings resolution into an action result and then into model-visible, persistent and rendered sinks without a secret-aware projection. | [OBS-03, OBS-05](evidence.md#observations) | `high` for the sampled route | Answers part of `RQ-01`: the current shared `ctx` plus unfiltered result path is not an enforcing boundary. |
| `FND-03` | The finite S0–S8 byte-exact detector is useful for the inventoried transforms because every positive control was detected and the negative control was clean. | [OBS-04](evidence.md#observations) | `high` for declared forms | Supports `HYP-02` only for the declared encoding family and captured layers. |
| `FND-04` | The first prohibited hit is sufficient to reject a clean non-transit claim for the sampled route, but insufficient to choose among opaque references, bounded projection, redaction, authority separation or a combination. | [OBS-05, OBS-06](evidence.md#observations) | `high` for rejection; `low` for mechanism comparison | Keeps implementation #19 and any architecture selection out of this research cycle. |

## Limitations and Disconfirming Evidence

| ID | Limitation / conflicting signal | Effect on conclusion | Mitigation or next question |
| --- | --- | --- | --- |
| `LIM-01` | Static inventory begins from named settings/provider roots and selected action sinks; dynamic functions, future markers, unknown telemetry and provider-side retention were not exhaustively inventoried. | No system-wide absence or completeness claim is justified. | Require a reviewed inventory expansion before treating a later clean matrix as validation. |
| `LIM-02` | Only the first success cell ran; `STOP-03` prevented error, serialization-failure, retry/cancellation and additional source cells. | The failing success route is proven, but other path behavior remains unknown. | After a candidate enforcement boundary exists, rerun all approved outcome cells rather than accumulating current-state failures. |
| `LIM-03` | The experiment used a mock result function and did not execute generated code, shell or a real provider adapter. | It isolates the result/persistence/request path but does not validate arbitrary-code containment or wire behavior. | Validate candidate mechanisms in a separately reviewed isolated runner with no agent access to provider credentials. |
| `LIM-04` | `fetch` was stubbed, but the collector process was not OS-network-sandboxed. | Zero network calls are attributable to the fixed mock path, not a reusable sandbox guarantee. | A future runtime experiment needs enforceable process/network boundaries, not only a stub. |
| `LIM-05` | Byte-exact detectors cover only predeclared forms; an undeclared transform can evade them. | `HYP-02` remains bounded to the transform map. | Add exact deterministic outputs only when static review finds a new transform; do not guess hashes/encryption. |
| `LIM-06` | The worktree was dirty although `src/` matched HEAD. | Production-code provenance is strong; research-instrument provenance depends on committed checksummed carriers rather than HEAD alone. | Review and commit the carrier as one unit before external reliance. |

## Answer to Decision Question

For the inventoried route, an enforceable boundary must separate secret-consuming
provider transport from agent-executable authority and must enforce non-transit
at every model-visible, persistent, rendered and external sink listed in
`FND-01`. The current shared-context/result pipeline is not that boundary:
`CELL-01` demonstrates prohibited local transit before any provider call.

This partial cycle does **not** establish which enforcement mechanism should implement
the boundary. The evidence supports rejecting the current route as conformant
and using the target plus sentinel protocol as acceptance criteria for a later
candidate comparison. Because the collector missed approved containment
preconditions, it does not complete the research plan. It also does not make
R-018 decision-ready, activate #19 or justify an ADR.

## Remaining Research Question

Which candidate, alone or in combination, prevents agent authority from
obtaining secret values while still allowing provider transport, and passes the
full reviewed success/error/serialization/retry matrix without relying on
post-hoc redaction as the only control?

## Review Check

- [x] Every finding traces through linked `OBS-*` to linked `SRC-*`.
- [x] Confidence is bounded to the static sample, fixed mock pipeline and declared detector forms.
- [x] Unexecuted cells, dirty-worktree provenance and containment limitations are explicit.
- [x] No implementation mechanism or architecture decision is selected.
