---
title: "R-031: Research Plan"
doc_kind: research
doc_function: canonical
purpose: "Frozen symmetric comparison method for versioned discovery and retention contracts."
derived_from: [brief.md, ../../flows/research.md]
status: active
audience: humans_and_agents
---
# R-031: Research Plan

## Contract Variants

| ID | Contract | Disposable realization | Disqualifying drift |
| --- | --- | --- | --- |
| `V0` | Ordinary `ctx.fns` plus explicit retention instruction | Versioned prompt and direct signature inspection | Hidden catalog/descriptor assistance |
| `V1` | Read-only capability manifest over ordinary functions | Generated names, source paths and concise signatures | Mediated invocation or privileged metadata |
| `V2` | Generated signature/type projection | Versioned type/signature artifact available to the agent | Extra runtime mediation |
| `V3` | Descriptor-mediated prototype | Disposable adapter exposing the same admitted callables | Different underlying functions, fixtures or authority |

Variants compare discovery contracts. The retained artifact must remain an
ordinary inspectable callable for `V0…V2`; `V3` is admitted only as a symmetric
prototype and cannot win by receiving broader authority or richer hidden data.

## Method

| Question / hypothesis | Method | Quality threshold |
| --- | --- | --- |
| `RQ-01`, `HYP-01` | Frozen cross-variant runtime experiment | Same fixtures/model/call budget; exact primary artifacts and checksums |
| `RQ-01`, `HYP-02` | Composition/authority review of each projection | Explicit differences; no architecture conclusion from prompt prose alone |

## Sample

Use versioned successors of the three R-001 offline families: tag normalization,
repository evidence extraction and saved JSON transformation. Fixture inputs and
golden outputs remain semantically equivalent, but prompts/contracts are new and
identified as R-031; this is not continuation of the closed R-001 cycle.

For each variant/family run baseline, explicit retention/control, later reuse by
a fresh agent process and a separate callable verifier.

## Evidence Contract

- exact golden tool and final output;
- model calls, marker actions, tokens where available and elapsed time;
- discovery/signature steps and errors/corrections;
- retained artifact digest, inspectability and ordinary composition check;
- fresh-process discovery/call result and duplicate creation;
- false-success detection and versioned contract identity;
- sanitized transcript/events/logs and checksums.

Decision thresholds:

- zero false-success cases;
- exact output and control/fresh-process reuse for every claimed success;
- at least two of three later-use tasks find and call the retained capability;
- no variant exceeds six model continuations per phase;
- every admitted variant must preserve ordinary callable composition; a variant
  that replaces the retained capability with a non-composable mediated-only
  object is disqualified rather than scored as a trade-off;
- no conclusion if variants receive materially different authority or context.

## Controls

| Risk | Control | Owner |
| --- | --- | --- |
| Model/prompt drift | Freeze model alias, prompt/contract digests, fixtures and call budget | Research owner |
| Asymmetric implementation | Common runner and callable substrate; independent pre-run review | Research owner + reviewer |
| False success | Compare tool and final outputs to golden result | Instrument |
| Boundary escape | Reuse the credential-broker/process boundary; no real secrets or HTTP | Experiment operator |
| Solution bias | Preserve failed variants and score before recommendation | Decision owner |

## Stop Rules

- `STOP-01` Do not start live comparison until all four disposable variants and
  the common runner pass offline controls and independent symmetry review.
- `STOP-02` Stop the entire cycle on boundary failure, contract drift or
  materially unequal authority/context.
- `STOP-03` Stop a phase at six continuations and record failure honestly.
- `STOP-04` Do not change a contract after collection begins; create a new
  version/run instead.

## Plan Approval

| Field | Value |
| --- | --- |
| Reviewer / decision owner | Danil Pismenny or delegated independent reviewer |
| Approval reference | Danil Pismenny, 2026-08-13: proceed as orchestrator with the separately routed next wave |
