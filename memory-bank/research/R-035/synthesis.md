---
title: "R-035: Research Synthesis"
doc_kind: research
doc_function: canonical
purpose: Findings, confidence, candidate comparison and limitations for the truthful SelfDescriptor contract.
derived_from:
  - brief.md
  - evidence.md
status: active
audience: humans_and_agents
---

# R-035: Research Synthesis

## Findings

| ID | Finding | Evidence | Confidence | Implication |
| --- | --- | --- | --- | --- |
| `FND-01` | Prompt-only “self-knowledge” is an instruction projection, not reliable evidence of current implementation. | `OBS-01/02` | high | Contradicts using the current prompt as the SelfDescriptor contract |
| `FND-02` | Raw live registry discovery proves callable presence but cannot by itself establish source origin, loaded revision, effective override or semantic authority/state class. | `OBS-03/06/07/09` | high | Contradicts registry-only descriptor |
| `FND-03` | The minimum useful contract is a compact runtime-derived descriptor that joins live registry facts, explicit effective-origin metadata, source identity and safe state/authority projections. | `OBS-03/06/07/08`, candidate comparison | medium-high | Supports `CAND-03` as contract direction, not implementation mechanism |
| `FND-04` | Descriptor facts need per-field status and provenance: at minimum `observed`, `inferred`, `unavailable` and `unsupported/stale`, plus a snapshot/generated identity. | `OBS-01/02/05/06` | medium-high | Prevents unknowns and stale prompt claims from becoming facts |
| `FND-05` | Startup and hot-reload origin selection disagree for duplicate function names at the grounded revision. | `OBS-04/05` | high for static source | Effective-origin semantics must be verified and resolved before W2 can claim correct override provenance |
| `FND-06` | Authority can be reported as metadata/categories without returning environment or credential values, but current secret non-transit enforcement is not proven. | `OBS-08` | medium | Descriptor delivery must consume EP-001 controls and use sentinels, not real secrets |

## Minimum Contract Direction

The recommended contract is a versioned, query-bounded snapshot containing:

- snapshot identity: schema version, generated time, workspace/repository identity,
  grounded source revision when available, and dirty/unknown indication;
- agent identity: agent ID, provider/model identifier, parent/fork identity and
  prompt-layer identities/hashes without dumping sensitive contents;
- capabilities: registered name/kind, callable signature projection, candidate
  sources, effective source, implementation identity, override state and load generation;
- state boundaries: durable, synchronized-view, transient and external categories
  without returning state blobs by default;
- mutable surfaces: overlay, core, prompt, migration, security-sensitive,
  destructive/external and production classifications;
- authority: declared/effective categories and known gaps, never credential values;
- epistemic metadata per field/component: status, provenance and freshness.

Exact API shape, storage and hashing mechanism remain downstream design choices.

## Limitations And Disconfirming Evidence

| ID | Limitation / conflicting signal | Effect | Mitigation or next question |
| --- | --- | --- | --- |
| `LIM-01` | Static inspection did not instantiate a live descriptor | Contract feasibility is strong but usability/performance is unmeasured | W2 prototype after owner disposition |
| `LIM-02` | `.hyper` may contain untracked per-user overlays outside the clean worktree sample | Absence and origin claims cannot generalize across installations | Live descriptor must inspect actual runtime roots |
| `LIM-03` | Startup/hot-reload resolution conflict is not covered by an override regression test | Effective-origin contract is blocked | Route a bounded bug/contract outcome before or inside W2 design |
| `LIM-04` | Safe authority projection depends on unresolved secret non-transit controls | Metadata design alone cannot guarantee no leakage | Consume R-033/EP-001 outcome; sentinel verification in delivery |

## Answer To Decision Question

Adopt `CAND-03` as the minimum contract direction: a compact, versioned,
runtime-derived SelfDescriptor that joins live registry facts to explicit source
and load provenance and reports safe state/authority classifications with
per-field epistemic status. Reject prompt-only, registry-only and raw-dump
contracts as insufficient. Before W2 delivery claims effective override
correctness, resolve or explicitly model the startup/hot-reload origin conflict.

## Review Check

- [x] Findings trace to evidence observations and sources.
- [x] Confidence reflects static-source scope.
- [x] Conflicts and remaining uncertainty are explicit.
