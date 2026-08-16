---
title: "EP-003: Subissues"
doc_kind: epic
doc_function: subissue_registry
purpose: "Registry of contract research and gated delivery candidates for reversible and reconstructable runtime behavior."
derived_from:
  - charter.md
  - roadmap.md
status: active
audience: humans_and_agents
must_not_define:
  - code_steps
---

# EP-003: Subissues

## Registry

| ID | Candidate issue title | Wave | Source | Status | Required route / package |
| --- | --- | --- | --- | --- | --- |
| `EP-SI-01` | Define reversible extension effect ownership and teardown contract | `W1A` | UC-004; prior art; current loaders | validated; ADR-002 accepted; delivery handoff | [#43](https://github.com/dapi/hyper-code2/issues/43); [R-043](../../research/R-043/README.md); Research & Discovery |
| `EP-SI-02` | Define marker-preserving action extension contract | `W1B` | UC-002; agent protocol; `executeMarker` | accepted research | [#44](https://github.com/dapi/hyper-code2/issues/44); Research & Discovery |
| `EP-SI-03` | Define reconstructable harness-bound provider-request receipt contract | `W1C` | UC-001/003/008/009; provider adapters | accepted research | [#45](https://github.com/dapi/hyper-code2/issues/45); Research & Discovery |
| `EP-SI-04` | Deliver the lifecycle slice selected for `ctx.fns` | `W2` | outcome of SI-01; UC-004 | in progress | [#46](https://github.com/dapi/hyper-code2/issues/46); `HG-02` accepted via [R-043](../../research/R-043/README.md) and [ADR-002](../../adr/ADR-002-generation-owned-runtime-lifecycle.md); [FT-046](../../features/FT-046/README.md) Feature Flow package |
| `EP-SI-05` | Deliver the accepted marker-action extension seam | `W3` | outcome of SI-02; UC-002 | blocked delivery candidate | [#47](https://github.com/dapi/hyper-code2/issues/47); Feature Flow after `HG-03` |
| `EP-SI-06` | Record and inspect accepted harness-bound provider-request receipts | `W4` | outcome of SI-03; UC-009 | blocked delivery candidate | [#48](https://github.com/dapi/hyper-code2/issues/48); Feature Flow after `HG-04` and gates |

## Creation Rules

- Accepted research approves a question, evidence boundary and decision owner—not a mechanism.
- Delivery candidates stay blocked until research disposition, named gates, and their own Feature Flow package exist. A candidate with those gates accepted may move to in progress in its linked feature package.
- Do not create `FT-*` merely because a GitHub tracker exists; reuse accepted outputs from existing owners.
- Every delivery issue preserves charter non-scope and records a validation profile.

## Existing Dependencies, Not EP-003 Subissues

| Owner | EP-003 consumes |
| --- | --- |
| [#7](https://github.com/dapi/hyper-code2/issues/7) | Startup, shutdown and ordered recovery |
| [#11](https://github.com/dapi/hyper-code2/issues/11) / [#13](https://github.com/dapi/hyper-code2/issues/13) | Action journal plus budgets/depth limits |
| [#22](https://github.com/dapi/hyper-code2/issues/22) | Durable execution identity/lifecycle vocabulary |
| [#31](https://github.com/dapi/hyper-code2/issues/31) / [#14](https://github.com/dapi/hyper-code2/issues/14) | Capability discovery, retention and surface comparison |
| [#17](https://github.com/dapi/hyper-code2/issues/17) / [#34](https://github.com/dapi/hyper-code2/issues/34) | Transcript identity and immutable fork storage |
| [#19](https://github.com/dapi/hyper-code2/issues/19); [EP-001](../EP-001/README.md) | Secret non-transit and managed-sink controls |
| [EP-002](../EP-002/README.md) | SelfDescriptor provenance and bounded activation/rollback |
