---
title: "EP-001: Subissues"
doc_kind: epic
doc_function: subissue_registry
purpose: "Registry of accepted and conditional research, contract, security and delivery outcomes for EP-001."
derived_from:
  - charter.md
  - roadmap.md
status: active
audience: humans_and_agents
must_not_define:
  - code_steps
---

# EP-001: Subissues

## Registry

| ID | Candidate issue title | Wave | Source | Status | Required route / package |
| --- | --- | --- | --- | --- | --- |
| `EP-SI-01` | Define reusable self-extension experiment contract and baseline | `W0` | `PRD-002 VAL-01…05`, draft UC-005 | experiment contract and instrument complete | [#25](https://github.com/dapi/hyper-code2/issues/25), [R-001](../../research/R-001/README.md) |
| `EP-SI-02` | Run and evaluate current-runtime capability composition and later reuse | `W1` | draft UC-005, `VAL-01…05` | terminal `inconclusive` under the tested contracts; remaining families require a separately routed, versioned research cycle | [R-001](../../research/R-001/README.md), [v2 report](../../../.protocols/experiments/runs/2026-08-13-tags-v2/report.json) |
| `EP-SI-03` | Stabilize marker/result identity as an independent contract outcome | `W2A` | active UC-002; tracker `#17` | accepted | [#26](https://github.com/dapi/hyper-code2/issues/26); Feature Flow because persistent identity changes, not Refactoring Flow |
| `EP-SI-04` | Restore immutable fork inheritance semantics | `W2A` | `DR-05`, active UC-003; tracker `#17` | blocked on persistent-contract research | [#27](https://github.com/dapi/hyper-code2/issues/27); Bug Fix Flow stopped because every correct fix selects a new storage contract; [#34](https://github.com/dapi/hyper-code2/issues/34) owns that prerequisite research |
| `EP-SI-05` | Migrate historical identity and fork boundaries without fabricated history | `W2A` | tracker `#17` | accepted research | [#28](https://github.com/dapi/hyper-code2/issues/28) |
| `EP-SI-06` | Close unauthenticated network-to-process authority | `W2B` | security boundary, `PRD-002 RISK-01` | bounded gap validated; target-contract/mechanism comparison collecting | [#29](https://github.com/dapi/hyper-code2/issues/29), [R-029](../../research/R-029/README.md), [#32](https://github.com/dapi/hyper-code2/issues/32), [R-032](../../research/R-032/README.md); mechanism/reachability undecided |
| `EP-SI-07` | Decide and verify secret non-transit with sentinel evidence | `W2B` | `BR-05`, `VAL-08` | sampled gap validated; mechanism comparison collecting | [#18](https://github.com/dapi/hyper-code2/issues/18), [R-018](../../research/R-018/README.md), [#33](https://github.com/dapi/hyper-code2/issues/33), [R-033](../../research/R-033/README.md); #19 remains parked |
| `EP-SI-08` | Apply approved secret-boundary controls to durable/external sinks | `W2B/W4B` | outcome of `EP-SI-07` | parked candidate | [#19](https://github.com/dapi/hyper-code2/issues/19); activate only after `HG-05` |
| `EP-SI-09` | Measure compact result versus diagnostics separation | `W3` | `VAL-02…05` | deferred candidate | [#12](https://github.com/dapi/hyper-code2/issues/12); first run did not show trigger |
| `EP-SI-10` | Compare versioned discovery/retention contracts over ordinary composition | `W3` | `G-01…04`, R-001/R-014 handoffs | collecting symmetric runtime research; candidate #16 parked | [#31](https://github.com/dapi/hyper-code2/issues/31), [R-031](../../research/R-031/README.md), [#16](https://github.com/dapi/hyper-code2/issues/16) |
| `EP-SI-11` | Transfer legacy issue map and disposition epic `#10` | `W4A` | successor map approved at Roadmap Ready | completed | [#10](https://github.com/dapi/hyper-code2/issues/10) closed as superseded by #24; no delivery handoff implied |

## Creation Rules

- `accepted` approves the outcome and boundary, not the mechanism in an existing issue.
- `candidate` requires its stated gate and owner decision before issue mutation or feature creation.
- Research outcomes use a governed research package, not an `FT-*`.
- A delivery feature starts only after its GitHub issue exists.
- GitHub `#1` and `#3` are not subissues of this epic.
