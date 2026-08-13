---
title: "R-035: Evidence Log"
doc_kind: research
doc_function: canonical
purpose: Traceable current-code evidence and observations for the truthful SelfDescriptor contract.
derived_from:
  - brief.md
  - plan.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-035: Evidence Log

Grounded repository revision: `e301161a70ca685feedfaa5bfba0d3580c73e3f7`.
No environment values, credentials, external services or runtime mutations were inspected.

## Sources

| ID | Source / provenance | Date / freshness | Collection context | Access / quality note |
| --- | --- | --- | --- | --- |
| `SRC-01` | [Base system prompt](../../../src/agent/SYSTEM_PROMPT_CORE.txt) and [prompt composition](../../../src/agent/fullSystemPrompt.ts) | Revision above, inspected 2026-08-13 | Local source read | Primary implementation source; prompt claims are instructions, not live proof |
| `SRC-02` | [Project scanner](../../../src/project/scan.ts), [classifier](../../../src/project/classify.ts), and [roots](../../../src/project/roots.ts) | Revision above | Local source read | Primary source for candidate discovery |
| `SRC-03` | [Startup function loader](../../../src/loadFns.ts) | Revision above | Local source read | Primary source for initial effective registry composition |
| `SRC-04` | [REPL loader](../../../src/repl/load.ts) | Revision above | Local source read | Primary source for hot-reload resolution |
| `SRC-05` | [Agent type](../../../src/agent/$type_Agent.ts) and [session synchronization](../../../src/session/syncAgentState.ts) | Revision above | Local source read | Primary source for current runtime agent fields and DB-backed views |
| `SRC-06` | [Security boundary](../../engineering/security-boundary.md), [filesystem resolver](../../../src/files/resolveSafe.ts), [in-process eval](../../../src/repl/eval.ts), and [shell execution](../../../src/agent/executeBash.ts) | Revision above | Canonical contract plus local source read | Authority metadata is clear; secret non-transit remains a gap |
| `SRC-07` | [Generated type registry](../../../src/genTypes.ts) | Revision above | Local source read | Shows compile-time registry projection, including source/overlay imports |
| `SRC-08` | [Generated context declarations](../../../src/ctx_ns.d.ts) and repository search for `SelfDescriptor` / `self.describe` | Revision above | Local `rg` inspection | Absence claim bounded to tracked repository revision |

## Observations

| ID | Observation | Supporting `SRC-*` | Applies to | Interpretation boundary |
| --- | --- | --- | --- | --- |
| `OBS-01` | The prompt states runtime identity, context shape, agent shape, namespace map, source conventions and live discovery instructions. | `SRC-01` | `RQ-01`, `HYP-02` | Static text can be stale and does not identify the effective implementation object |
| `OBS-02` | Fresh runtime context currently injects only cwd, agent ID and DB path; model/provider is available on the agent object but not represented as a structured descriptor. | `SRC-01`, `SRC-05` | `RQ-01` | Does not establish which additional fields should be model-visible |
| `OBS-03` | `project.scan` enumerates both `src` and `.hyper` candidates with root, relative path and absolute path metadata. | `SRC-02` | `HYP-01` | Candidate enumeration is not the same as effective runtime resolution |
| `OBS-04` | Startup loading processes scan entries in root order and later assignments replace earlier functions, so an existing `.hyper` function can become effective after `src`. | `SRC-02`, `SRC-03` | `RQ-01` override provenance | Static ordering does not record the chosen origin on the function registry |
| `OBS-05` | Targeted `repl.load` searches roots in `src` then `.hyper` order and returns the first existing file; for duplicate names this differs from startup's later-overlay-wins behavior. Whole-module reload repeatedly calls the same first-match resolver. | `SRC-02`, `SRC-04` | `RQ-01`, freshness and effective override | This is a contract conflict requiring verification/resolution before descriptor or overlay activation claims |
| `OBS-06` | The live `ctx.fns` registry stores callable values by namespace/name but no explicit source path, root, hash, load generation or loaded-at metadata. | `SRC-03`, `SRC-04` | `HYP-01/02` | Function `toString()` exposes code shape but is not durable source provenance |
| `OBS-07` | The agent type separates persistent-ish fields and transient runtime controls only through code/comments; no machine-readable state-class metadata exists. | `SRC-05` | `RQ-01` state boundary | A descriptor can classify fields without returning their contents, but that classification needs an owner |
| `OBS-08` | Current authority includes unrestricted in-process eval, shell and filesystem paths outside cwd; the canonical boundary says the product is not a sandbox. | `SRC-06` | `RQ-01` authority | Reporting authority must not imply enforcement or reveal credential values |
| `OBS-09` | Generated TypeScript declarations include functions/types from scanned roots but do not preserve runtime winner, loaded revision or freshness. | `SRC-07` | `HYP-02` | Compile-time discoverability is useful but insufficient as a live self-model |
| `OBS-10` | No unified SelfDescriptor type or `ctx.fns.self.describe` implementation exists in the grounded repository. | `SRC-08` | `RQ-01` current gap | Does not rule out untracked runtime overlays outside this clean research worktree |

## Candidate Comparison

| Candidate | Truthfulness / provenance | Freshness / overrides | Context and secret posture | Main limitation |
| --- | --- | --- | --- | --- |
| `CAND-01` Prompt-only static map | Low | Low | Compact but can contain stale claims | Cannot prove current implementation |
| `CAND-02` Raw live registry introspection | Medium for callable presence | Medium; no origin/load generation | Compact if queried | Loses source provenance and authority/state classifications |
| `CAND-03` Compact runtime-derived descriptor joining live registry, source candidates, effective-origin metadata and safe projections | High target | High target with generation/identity | Can be bounded and value-redacted | Requires an explicit resolver/provenance contract and downstream implementation |
| `CAND-04` Full raw source/state/environment dump | Superficially detailed | Snapshot-only | Excessive context and secret risk | Violates compactness and non-transit posture; still lacks semantic truth labels |

## Collection Log

| Date | Activity | Result | Deviation / reason |
| --- | --- | --- | --- |
| 2026-08-13 | Grounded prompt, scanner, loader, agent-state and authority sources | Required field inventory completed | None |
| 2026-08-13 | Compared four descriptor contracts | `CAND-03` best satisfies product rules; mechanism remains unselected | No runtime prototype by scope |
| 2026-08-13 | Checked startup versus hot-reload origin resolution | Found a material resolution conflict | Added as blocker/limitation rather than silently normalizing it |

## Evidence Quality Check

- [x] Material observations trace to repository sources.
- [x] Sources are revision-grounded and access-controlled locally.
- [x] Observations are separated from interpretation and candidate recommendation.
- [x] Static-source limits and the origin-resolution conflict are explicit.
