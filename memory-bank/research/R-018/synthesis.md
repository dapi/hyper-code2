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
| `FND-04` | The first prohibited hit is sufficient to reject a clean non-transit claim for the sampled route, but insufficient to choose among opaque references, bounded projection, redaction, authority separation or a combination. | [OBS-05, OBS-06, OBS-10](evidence.md#observations) | `high` for rejection; `low` for mechanism comparison | Keeps implementation #19 and any architecture selection out of this research cycle. |
| `FND-05` | The `-03` repetition establishes that the observed transit is reproducible inside the recorded experimental boundary: containment preceded injection; no provider-auth environment material was passed; tested home/keychain paths, network, outside-root writes and two named securityd Mach lookups were denied; and no provider call occurred. | [OBS-12, OBS-13, OBS-14, OBS-15](evidence.md#observations) | `high` for the independently reviewed named controls on the recorded platform | Removes the identified containment evidence defects without claiming that `sandbox-exec` is a production mechanism or that every credential store is inaccessible. |

## Limitations and Disconfirming Evidence

| ID | Limitation / conflicting signal | Effect on conclusion | Mitigation or next question |
| --- | --- | --- | --- |
| `LIM-01` | Static inventory begins from named settings/provider roots and selected action sinks; dynamic functions, future markers, unknown telemetry and provider-side retention were not exhaustively inventoried. | No system-wide absence or completeness claim is justified. | Require a reviewed inventory expansion before treating a later clean matrix as validation. |
| `LIM-02` | Only the first success cell ran; `STOP-03` prevented error, serialization-failure, retry/cancellation and additional source cells. | The failing success route is proven, but other path behavior remains unknown. | After a candidate enforcement boundary exists, rerun all approved outcome cells rather than accumulating current-state failures. |
| `LIM-03` | The experiment used a mock result function and did not execute generated code, shell or a real provider adapter. | It isolates the result/persistence/request path but does not validate arbitrary-code containment or wire behavior. | Validate candidate mechanisms in a separately reviewed isolated runner with no agent access to provider credentials. |
| `LIM-04` | The first collector was not OS-contained, and `-02` allowed broad Mach lookup. Only `-03` removes all Mach lookup allowances and adds named securityd/keychain probes. | The result no longer relies on either earlier boundary, but remains platform-, profile- and named-service-specific experimental evidence. | Reuse or replace the reviewed v2 containment harness for future candidate tests; do not promote it as the production boundary without a separate decision. |
| `LIM-05` | Byte-exact detectors cover only predeclared forms; an undeclared transform can evade them. | `HYP-02` remains bounded to the transform map. | Add exact deterministic outputs only when static review finds a new transform; do not guess hashes/encryption. |
| `LIM-06` | The worktree was dirty although `src/` matched HEAD. | Production-code provenance is strong; research-instrument provenance depends on committed checksummed carriers rather than HEAD alone. | Review and commit the carrier as one unit before external reliance. |
| `LIM-07` | The bounded static inventory has not received an independent second-person completeness review. | The reproduced prohibited route is still valid, but no claim covers unlisted sources, transforms or sinks. | Require independent inventory review before using the matrix to validate a future candidate as clean. |
| `LIM-08` | `sandbox-exec` is deprecated and the policy probe uses the private `sandbox_check` ABI. Only `com.apple.securityd`, `com.apple.securityd.xpc` and the direct login-keychain path were tested. | The evidence does not generalize to other macOS versions, credential services, keychains, browsers, environment brokers or production isolation. | Treat these as evidence-harness controls only; future delivery must define and validate its own supported boundary. |

## Answer to Decision Question

For the inventoried route, an enforceable boundary must separate secret-consuming
provider transport from agent-executable authority and must enforce non-transit
at every model-visible, persistent, rendered and external sink listed in
`FND-01`. The current shared-context/result pipeline is not that boundary:
`CELL-01` demonstrates prohibited local transit before any provider call.

This completed bounded evidence cycle does **not** establish which enforcement mechanism should implement
the boundary. The evidence supports rejecting the current route as conformant
and using the target plus sentinel protocol as acceptance criteria for a later
candidate comparison. The `-03` repetition satisfies the corrected named
containment controls and reproduces the same prohibited transit. It does not make
R-018 decision-ready by itself, activate #19 or justify an ADR; Danil still owns
the disposition and any authorization to compare mechanisms.

## Remaining Research Question

Which candidate, alone or in combination, prevents agent authority from
obtaining secret values while still allowing provider transport, and passes the
full reviewed success/error/serialization/retry matrix without relying on
post-hoc redaction as the only control?

## Review Check

- [x] Every finding traces through linked `OBS-*` to linked `SRC-*`.
- [x] Confidence is bounded to the static sample, fixed mock pipeline, recorded macOS sandbox profile, named keychain controls and declared detector forms.
- [x] Unexecuted cells, source provenance and experimental-containment limitations are explicit.
- [x] No implementation mechanism or architecture decision is selected.
