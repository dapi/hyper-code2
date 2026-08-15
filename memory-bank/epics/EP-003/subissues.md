---
title: "EP-003: Subissues"
doc_kind: epic
doc_function: subissue_registry
purpose: "Registry of GitHub-linked self-update delivery subissues."
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

| ID | Candidate issue title | Wave | Source | Status | Feature package |
| --- | --- | --- | --- | --- | --- |
| `EP-SI-01` | Select release artifact and installation contract | `W0` | #53 outcome; release ops contract | accepted; research/design first | TBD: #54 |
| `EP-SI-02` | Publish verified GitHub Release artifacts | `W1` | `EP-SI-01`; #53 | accepted; blocked on `W0` | TBD: #55 |
| `EP-SI-03` | Implement `hcode update` and `update --check` | `W2` | `EP-SI-01/02`; #53 | accepted; blocked on `W1` | TBD: #56 |
| `EP-SI-04` | Verify atomic activation and rollback | `W3` | `EP-SI-03`; #53 | accepted; blocked on `W2` | TBD: #57 |

## GitHub Links

- Parent: [#53](https://github.com/dapi/hyper-code2/issues/53)
- `EP-SI-01`: [#54](https://github.com/dapi/hyper-code2/issues/54)
- `EP-SI-02`: [#55](https://github.com/dapi/hyper-code2/issues/55)
- `EP-SI-03`: [#56](https://github.com/dapi/hyper-code2/issues/56)
- `EP-SI-04`: [#57](https://github.com/dapi/hyper-code2/issues/57)

## Creation Rules

- Complete #54 before selecting an artifact or installation mechanism in a feature package.
- Create a `memory-bank/features/FT-<issue>/` package only after the relevant wave gate passes.
- Link each feature package back to this registry and the applicable roadmap gate.
