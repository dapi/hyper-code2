---
title: "R-033: Secret Non-Transit Mechanism Comparison"
doc_kind: research
doc_function: canonical
purpose: "Canonical decision question, boundaries and lifecycle state for comparing secret non-transit enforcement mechanisms."
derived_from:
  - ../../flows/research.md
  - ../R-018/decision.md
  - ../../engineering/security-boundary.md
status: active
research_status: synthesizing
audience: humans_and_agents
---

# R-033: Secret Non-Transit Mechanism Comparison

## Intake

| Field | Value |
| --- | --- |
| Source / trigger | [GitHub #33](https://github.com/dapi/hyper-code2/issues/33), routed separately from terminal R-018 `HD-02` |
| Research owner | Codex orchestration under Danil's approved static/mock/prototype boundary |
| Decision owner | Danil Pismenny |
| Research mode | `technical_discovery` |
| Decision deadline / timebox | One reviewed inventory and one symmetric finite candidate matrix; stop rather than expand the matrix implicitly |

## Decision Question

- `RQ-01` Which mechanism or combination can preserve authenticated provider
  transport while preventing secret values from entering agent-executable
  inputs, model system/messages, action results/errors, persistence, rendering,
  diagnostics and other external sinks?

## Working Hypotheses

- `HYP-01` Opaque references plus a credential-owning broker can separate
  provider authentication material from agent-executable authority without
  changing model request semantics.
- `HYP-02` Source exclusion and bounded projection can prevent secret transit
  earlier than sink redaction, but compatibility costs must be measured against
  every current provider-adapter shape.
- `HYP-03` Redaction alone will be conformant only if the same evidence shows
  that the value is unavailable to agent authority before every unredacted sink;
  otherwise it can qualify only as a composable defense-in-depth control.
- `HYP-04` One finite, symmetric synthetic-sentinel matrix can distinguish
  conformant, adaptable and incompatible candidates without real secrets or a
  real provider call.

## Candidate Set

| ID | Candidate | Comparison boundary |
| --- | --- | --- |
| `CAND-01` | Opaque reference plus credential-owning broker | Agent passes an opaque provider credential reference; only the broker resolves and applies authentication at transport time. |
| `CAND-02` | Source exclusion | Secret-declared values and credential stores are absent from agent-readable context/functions; a privileged transport path may still resolve them. |
| `CAND-03` | Bounded projection | Explicit typed projections admit only allowlisted fields into model, result, persistence, render and diagnostic surfaces. |
| `CAND-04` | Provenance-aware sink redaction | A declared-secret provenance record removes or replaces values at every prohibited sink before commit or delivery. |
| `CAND-05` | Combinations | Test broker + source exclusion + bounded projection, with redaction as defense in depth; other combinations require a recorded plan amendment before collection. |

## Scope

- `RSC-01` Current OpenAI-compatible, Anthropic, Responses/Codex and lazy
  subscription-token adapter shapes, OAuth refresh paths and model-discovery
  bearer path at published repository commit `06ae8df`.
- `RSC-02` Agent authority, endpoint/credential resolution, pre-provider request
  construction and the R-018 model/result/persistence/render sink classes.
- `RSC-03` Symmetric disposable mock/prototype tests of success, error,
  serialization, retry/cancellation and restart/failure behavior where the
  reviewed path supports those outcomes.
- `RSC-04` Compatibility, composition, fail-closed behavior and the trigger for
  a downstream ADR or delivery route.
- `RSC-05` Direct callable authority for endpoint resolution, credential refresh
  and model discovery, including current filesystem/keychain read-write,
  refresh-network and diagnostic/error sinks.
- `RSC-06` Generated-code access to the root `ctx`, including copied process
  environment, shared function registry, raw settings reads/listing, arbitrary
  database selects and the filesystem/keychain authority of the shared process.

## Non-Scope

- `RNS-01` Real credentials, actual credential stores, provider/network calls,
  public listeners, shared/production state or a production implementation.
- `RNS-02` Selecting a mechanism before the complete symmetric matrix and owner
  decision, or activating implementation candidate #19 by implication.
- `RNS-03` Claiming system-wide secrecy, arbitrary-secret detection or inventory
  completeness beyond the reviewed sources, transforms, sinks and commit.
- `RNS-04` Treating the R-018 evidence sandbox as a production isolation design.

## Assumptions and Known Evidence

| ID | Statement | Type | Source / confidence |
| --- | --- | --- | --- |
| `EVD-01` | The sampled current route violates the mechanism-neutral non-transit contract in four prohibited sink classes. | Evidence | [R-018 decision](../R-018/decision.md) and [R-018 evidence](../R-018/evidence.md) |
| `EVD-02` | Current agent authority shares the server process and is not an adversarial sandbox. | Evidence | [Trust and security boundary](../../engineering/security-boundary.md) |
| `EVD-03` | Current endpoint resolution returns the credential value together with URL and provider metadata. | Evidence | [Initial static evidence](evidence.md#observations) |
| `ASM-01` | The adapter shapes in `RSC-01` are sufficient for the first compatibility comparison. | Assumption | Must survive independent inventory review before prototype collection |
| `ASM-02` | Provider request semantics can be checked by a local capture boundary without transmitting a request. | Assumption | Must be demonstrated by positive controls in every adapter cell |

## Material Unknowns

| Question | Blocks | Owner | Resolution evidence |
| --- | --- | --- | --- |
| Can any candidate keep the sentinel solely inside the privileged transport boundary for every adapter? | Candidate recommendation | Research owner and independent reviewer | Complete common matrix and sanitized carrier |
| Which current callers rely on receiving raw `apiKey` from `resolveEndpoint` or reading settings through shared `ctx`? | Compatibility rating | Research owner | Reviewed caller/capability inventory |
| Can agent-executable code directly call refresh procedures and receive raw token values, and can model discovery reuse those values outside provider inference transport? | Authority and discovery-path conformance | Research owner and independent reviewer | Reviewed function-registry/caller map plus `CC-05`, `CC-06` and `CC-13` results |
| Can every candidate prevent or mediate direct generated-code access to synthetic secret values through `ctx.env`, `settings.get/getString/list`, `db.select`, file and keychain paths? | Direct-authority conformance | Research owner and independent reviewer | Reviewed context-construction map plus symmetric `CC-14` results |
| Can identity, revocation, lifetime and retry semantics compose without exposing the value to agent authority? | Combination rating | Research owner | Mock broker/projection lifecycle cells |
| Does any preferred candidate change global credential ownership, process topology, persistence schema or cross-module contracts? | ADR trigger | Danil Pismenny | Decision rationale after symmetric evidence |

## Security and Access Constraints

- Use one deterministic non-secret sentinel and declared transforms only.
- Do not read actual environment secret values, persisted secret settings,
  keychains, CLI credential files or any other credential store.
- Do not call a provider, open a listener, use shared runtime state or give an
  agent-executable process provider authentication material.
- Use fixed mocks and disposable state; fail closed before injection if the
  containment, detector, provenance or write-boundary controls fail.
- Preserve only sanitized captures: record authentication placement and digest,
  never a raw sentinel-bearing authorization field in the stable carrier.

## Stopping Condition

- `STOP-01` Stop when every `CAND-*` has an attributable result against the same
  finite conformance and compatibility matrix and Danil can choose, reject all,
  or request one named additional evidence cell.
- `STOP-02` Stop earlier if independent review rejects inventory symmetry or the
  containment cannot support a reliable comparison.
- `STOP-03` Stop immediately on real-secret access, unplanned network/filesystem
  activity, sentinel transit to a prohibited sink or loss of evidence provenance.

## Boundary Check

- [x] Questions and hypotheses are separate from findings.
- [x] Known facts have clickable sources; candidate claims remain hypotheses.
- [x] No production mechanism, delivery scope, ADR decision or implementation
  sequence is selected.
- [x] Security, privacy and access constraints are explicit.
