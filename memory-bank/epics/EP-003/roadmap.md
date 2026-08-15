---
title: "EP-003: Roadmap"
doc_kind: epic
doc_function: roadmap
purpose: "Delivery waves, dependencies, gates and stop rules for hcode self-update from GitHub Releases."
derived_from:
  - charter.md
  - subissues.md
status: active
audience: humans_and_agents
must_not_define:
  - code_steps
  - final_artifact_implementation
  - production_rollout_dates
---

# EP-003: Roadmap

## Waves

| Wave | Target | Depends on | Exit gate |
| --- | --- | --- | --- |
| `W0` | Select the supported installation mode, artifact shape, trust metadata and compatibility contract | Owner decision; #54 | `HG-01` |
| `W1` | Publish reproducible GitHub Release artifacts and verification metadata | `W0`; #55 | `HG-02` |
| `W2` | Deliver pre-runtime `hcode update` and `update --check` behavior | `W0`, `W1`; #56 | `HG-03` |
| `W3` | Prove atomic activation, rollback, failure handling and operator recovery | `W2`; #57 | `HG-04` |

## Current Wave State

| Wave | State | Evidence / next gate |
| --- | --- | --- |
| `W0` | ready for research/design | #54 must close the artifact and installation contract |
| `W1` | blocked on `W0` | #55 |
| `W2` | blocked on `W1` | #56 |
| `W3` | blocked on `W2` | #57 |

## First Slice Recommendation

Start with #54. The current repository has tag-only Releases and no established
artifact/install contract; implementation of the updater before that decision
would create an unstable release boundary.

## Handoff Gates

| Gate | Required evidence |
| --- | --- |
| `HG-01` Release contract | Supported installation mode, artifact contents/name, version discovery, trust metadata, Bun compatibility, unsupported layouts and rollback boundary |
| `HG-02` Artifact readiness | A tagged release produces a version-matching artifact and integrity metadata that can be validated from a clean fixture |
| `HG-03` CLI readiness | `update` and `--check` run before runtime bootstrap, select stable versions deterministically, and preserve workspace/session state |
| `HG-04` Recovery readiness | Download, validation, extraction and activation failures leave the previous version runnable and produce actionable diagnostics |

## Stop Rules

- Stop if the updater would silently overwrite an arbitrary checkout or local modifications.
- Stop if release provenance cannot be verified before executable content is activated.
- Stop if a failure can leave a partially active installation.
- Stop if the command initializes workspace state or starts an LLM unnecessarily.
- Stop if platform/Bun compatibility is not represented in the release contract.
- Stop if release packaging and updater behavior diverge from the selected contract.
