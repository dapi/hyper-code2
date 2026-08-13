---
title: "R-033: Research Synthesis"
doc_kind: research
doc_function: canonical
purpose: "Bounded synthesis of the symmetric synthetic comparison of secret non-transit candidates."
derived_from:
  - brief.md
  - plan.md
  - evidence.md
status: active
audience: humans_and_agents
---

# R-033: Research Synthesis

## Synthesis Boundary

This synthesis compares all five candidates only against the accepted V5.2
disposable fixture at the recorded source snapshot and freeze `36705a74…`. It
does not rank candidates, recommend a mechanism, select a combination, claim
production conformance or authorize implementation. The rejected V5.1 carrier
is diagnostic history and contributes no candidate totals.

## Findings

| ID | Finding | Evidence | Confidence |
| --- | --- | --- | --- |
| `FND-01` | The accepted V5.2 carrier is complete for the planned finite synthetic matrix: 70 attributable rows, 14 cells per candidate, stable per-row checksums and exact containment/execution/provenance bindings. | [`OBS-19`, `OBS-21`](evidence.md#observations), [`SRC-19`](evidence.md#sources) | High for carrier integrity and fixture accounting; none for production fidelity. |
| `FND-02` | `CAND-01` opaque broker/reference, `CAND-02` source exclusion, `CAND-03` bounded projection and `CAND-05` composition each pass `CC-01…14` inside the V5.2 fixture. | [`OBS-19`](evidence.md#observations), [`SRC-19`](evidence.md#sources) | High for the frozen synthetic paths; low for unimplemented production paths. |
| `FND-03` | `CAND-04` provenance-aware sink redaction passes `CC-01…13` but is incompatible with the common `CC-14` direct-authority requirement in this fixture: all seven generated-code probes can read detectable secret-bearing values, so zero are denied or bounded. | [`OBS-19`, `OBS-20`](evidence.md#observations), [`SRC-19`](evidence.md#sources) | High for this fixture and contract; no claim about materially different redaction architectures. |
| `FND-04` | The matrix distinguishes sink cleanliness from source/authority non-transit. A candidate can sanitize downstream transport, persistence, rendering and diagnostics while still failing if agent-executable authority can obtain the raw value directly. | [`OBS-10…13`, `OBS-20`](evidence.md#observations) | High for the stated common contract; production enforcement remains untested. |
| `FND-05` | V5.2 establishes bounded behavior for synthetic inference, staged refresh, durability, retry/restart, discovery and direct-authority adapters without using real credentials, providers, network, operator-home stores or shared runtime state. | [`OBS-19…21`](evidence.md#observations), [`SRC-19`](evidence.md#sources) | High that the recorded fixture stayed within its containment; low for external validity. |

## Candidate Comparison

| Candidate | V5.2 fixture result | Distinguishing fixture observation | Production interpretation boundary |
| --- | --- | --- | --- |
| `CAND-01` opaque reference plus broker | 14/14 pass | Synthetic raw credential stays behind the broker-shaped transport boundary, including seven bounded direct-authority probes. | Does not establish broker process placement, IPC, reference lifecycle, concurrency or provider acceptance. |
| `CAND-02` source exclusion | 14/14 pass | Synthetic agent-facing adapters exclude raw values while a separate privileged transport path completes the fixture operations. | Does not prove exclusion from the current shared-process root context, filesystem, keychain, shell or generated registry in production. |
| `CAND-03` bounded projection | 14/14 pass | Frozen schemas reject or project synthetic secret-bearing fields before the fixture's prohibited sinks and direct-authority results. | Does not prove schema completeness across current/future data shapes, transforms, plugins or unknown sinks. |
| `CAND-04` provenance-aware sink redaction | 13/14 pass; `CC-14` fail | Downstream fixture cells are clean, but each of seven direct-authority adapters returns detectable raw values; `deniedOrBounded=0`. | Incompatible with the current common contract as implemented in V5.2; no broader conclusion about redesigned source mediation plus redaction. |
| `CAND-05` broker + exclusion + projection + defense-in-depth redaction | 14/14 pass | The composed synthetic path preserves all common checks and bounds all seven direct-authority probes. | Does not establish component ownership, composition failure modes, operational complexity or whether every component is necessary. |

The pass counts are matrix observations, not scores. They provide no ranking
among `CAND-01`, `CAND-02`, `CAND-03` and `CAND-05`, and they do not convert the
fixture into evidence that any candidate is ready for production.

## Disconfirming And Absent Evidence

- `HYP-03` is disconfirmed for the tested standalone `CAND-04` shape: sink
  redaction does not satisfy non-transit while raw values remain available to
  direct agent authority.
- No V5.2 cell disconfirms the four other candidates inside the frozen fixture.
  Equal fixture pass counts do not show equivalent production feasibility,
  security strength, cost or compatibility.
- V5.1 is explicitly absent from synthesis because its occurrence-based
  `CC-14` arithmetic produced an invalid negative derived count.
- No real provider response, OAuth exchange, credential-store behavior,
  production process boundary, end-user workflow or current-code integration
  was observed.

## Limitations And Production Unknowns

| ID | Unresolved production question |
| --- | --- |
| `LIM-01` | Whether real OpenAI-compatible, Anthropic, Responses/Codex and future providers accept requests produced through any candidate without semantic drift. |
| `LIM-02` | Whether real OAuth refresh, expiry, revocation, account-claim parsing, file-backed credentials and macOS keychain behavior preserve non-transit and fail closed. |
| `LIM-03` | Which production process/service topology, IPC boundary and OS controls could enforce privileged transport separation; the fixture is not an isolation design. |
| `LIM-04` | How each candidate integrates with the current shared root `ctx`, generated function registry, settings/SQL/filesystem/shell/keychain authority and every actual caller without bypass. |
| `LIM-05` | The full migration surface for endpoint contracts, provider adapters, persisted schemas, credential/reference ownership and compatibility with existing installations. |
| `LIM-06` | Behavior under concurrent requests, races, cancellation timing, load, partial failure and multi-process restart beyond the deterministic fixture. |
| `LIM-07` | Opaque-reference identity, scoping, storage, distribution, rotation, revocation, lifetime, replay prevention and cross-provider non-reuse. |
| `LIM-08` | Completeness of projections, provenance propagation and detectors across unknown shapes, transforms, plugins, dynamic overlays, future routes and future providers. |
| `LIM-09` | Coverage of every production sink, including telemetry, logs, traces, crash reports, caches, queues, diagnostics, browser/CLI rendering and provider-side retention. |
| `LIM-10` | Operator and end-user behavior for browser, CLI/TUI setup, refresh, recovery, revocation, error diagnosis and restart. |
| `LIM-11` | Production auditability, observability and useful non-secret failure diagnostics without creating a new disclosure or availability risk. |
| `LIM-12` | Performance, latency, capacity, deployment, support burden and operational cost for each mechanism or composition. |
| `LIM-13` | Whether `CAND-02` can honestly exclude sources while agent code retains same-process file, shell and keychain authority, and whether `CAND-05` composition closes every such bypass. |
| `LIM-14` | Whether `CAND-03` or a provenance-based control remains fail closed when classifications are missing, stale or transformed outside the frozen schemas. |
| `LIM-15` | Whether the reviewed source/sink inventory is complete for production; R-033 covers the pinned files and fixture only and makes no arbitrary-secret or system-wide secrecy claim. |

## Confidence

Confidence is high that the accepted V5.2 carrier faithfully records the frozen
synthetic fixture and its one differentiating failure. Confidence is low that
the matrix predicts production feasibility or total security because none of
the production paths, authority boundaries, provider systems or operator stores
were exercised.

## Decision Boundary

R-033 is `synthesizing`, not `decision_ready`. The bounded comparison is now
available to Danil Pismenny, but no recommendation, ranking, owner choice,
`decision.md`, ADR or delivery route is created here. Any mechanism choice and
any further evidence request remain explicit owner actions.
