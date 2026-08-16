---
title: "EP-003: Roadmap"
doc_kind: epic
doc_function: roadmap
purpose: "Contract-first waves, dependencies, handoff gates and stop rules for reversible runtime extensions, marker-preserving action composition, and reconstructable harness-bound provider-request receipts."
derived_from:
  - charter.md
status: active
audience: humans_and_agents
must_not_define:
  - code_steps
  - final_persistent_schema
  - production_rollout_dates
---

# EP-003: Roadmap

## Waves

| Wave | Target | Depends on | Exit gate |
| --- | --- | --- | --- |
| `W0` | Approved boundary, owner map, risks, GitHub epic/milestone | Owner decision | `HG-01` |
| `W1A` | Resolve reversible extension-effect ownership and teardown | `W0` | `HG-02` |
| `W1B` | Resolve marker-preserving action extension contract | `W0`; parallel with W1A/W1C | `HG-03` |
| `W1C` | Resolve reconstructable harness-bound provider-request receipt contract | `W0`; parallel with W1A/W1B | `HG-04` |
| `W2` | Deliver lifecycle slice selected for `ctx.fns` | `W1A`; #7 and EP-002 reconciled | `HG-05A` |
| `W3` | Deliver accepted marker-action extension seam | `W1B`; #11/#13/#22/#26 reconciled | `HG-05B` |
| `W4` | Deliver accepted harness-bound receipt and read-only inspection | `W1C`; #17/#34, #19 and EP-001 gates | `HG-05C` |
| `W5` | Evaluate integrated behavior and disposition epic | Selected delivered slices | `HG-06` |

## Current Wave State

| Wave | State | Evidence / next gate |
| --- | --- | --- |
| `W0` | completed | Owner decision, active governance files, [#42](https://github.com/dapi/hyper-code2/issues/42), and [milestone #7](https://github.com/dapi/hyper-code2/milestone/7) exist |
| `W1A` | completed: validated | [R-043](../../research/R-043/README.md) is validated by owner disposition; [ADR-002](../../adr/ADR-002-generation-owned-runtime-lifecycle.md) records the accepted bounded contract |
| `W1B` | ready | [#44](https://github.com/dapi/hyper-code2/issues/44) is accepted for Research & Discovery routing |
| `W1C` | ready | [#45](https://github.com/dapi/hyper-code2/issues/45) is accepted for Research & Discovery routing |
| `W2` | in progress | `HG-02` is accepted by [R-043](../../research/R-043/README.md) and [ADR-002](../../adr/ADR-002-generation-owned-runtime-lifecycle.md); [FT-046](../../features/FT-046/README.md) is the active Feature Flow package for [#46](https://github.com/dapi/hyper-code2/issues/46), progressing to `HG-05A` |
| `W3` | blocked candidate | [#47](https://github.com/dapi/hyper-code2/issues/47) waits for `HG-03` and its Feature Flow package |
| `W4` | blocked candidate | [#48](https://github.com/dapi/hyper-code2/issues/48) waits for `HG-04`, #17/#34, #19, security gates and its Feature Flow package |
| `W5` | pending | Representative evidence and owner disposition required |

## First Slice Recommendation

`EP-SI-01` / #43 completed Research & Discovery Flow: [R-043](../../research/R-043/README.md) and [ADR-002](../../adr/ADR-002-generation-owned-runtime-lifecycle.md) accepted the lifecycle boundary, so W2 is active through [FT-046](../../features/FT-046/README.md). W1B and W1C may proceed independently. `FT-047` and `FT-048` remain blocked until their corresponding gates and Feature Flow packages exist.

## Handoff Gates

| Gate | Required evidence |
| --- | --- |
| `HG-01` | Owner decision; pinned prior art; active governance files; GitHub epic/milestone; existing-owner map |
| `HG-02` | Effect inventory; owner/generation model; alternatives for replacement, removal/fallback, captured references, quiescence, disposal and failure; #7/EP-002 compatibility; disposition/ADR assessment |
| `HG-03` | Marker conformance map (including `§html`); identity/dispatch; authority/order; cancellation/nesting/error/single commit; #11/#13/#22/#26 compatibility; disposition/ADR assessment |
| `HG-04` | Provider inventory; canonical versus harness-submitted boundary; inputs; identity/retry/version/provenance/retention/unavailable/withheld contract; #17/#34 and #19 sink/security gates; disposition/ADR assessment |
| `HG-05A` | Accepted `HG-02`; feature package; immutable grounding; stated lifecycle tests; truthful live SelfDescriptor |
| `HG-05B` | Accepted `HG-03`; feature package; all-kind fixtures; no duplicate commit; preserved marker protocol and `§html` semantics; explicit uncontained label |
| `HG-05C` | Accepted `HG-04`; feature package; #17/#34 and #19 ready; provider-bound fixtures; no credential/raw-chunk persistence; read-only UC-009 inspection |
| `HG-06` | Representative traces, regressions/resource evidence, supported/unsupported outcomes, unresolved risks, owner decision |

## Stop Rules

- Stop delivery if its W1 research lacks owner disposition or selected scope.
- Stop if prior art drives framework adoption, the action seam changes `§...`, or in-process hooks/scopes are claimed as containment.
- Stop W3 if it duplicates #11 journal or #13 budget/depth ownership.
- Stop W4 while transcript/fork (#17/#34), secret/sink (#19) or EP-001 gates are open.
- Stop if reconstruction requires fabricated history, mutable source rereads without version proof, credentials, raw chunks, hidden provider state, or an assertion about provider-internal input.
- Stop if a reload claims to dispose behavior still reachable through captured references without an explicit accepted limit.
- Stop if EP-003 duplicates existing owners; promote architecture choices to ADR; record inconclusive evidence honestly.
