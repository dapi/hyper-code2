---
title: "R-001: Research Plan"
doc_kind: research
doc_function: canonical
purpose: "Representative-task experiment and measurement protocol for R-001."
derived_from:
  - brief.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-001: Research Plan

## Method

| Question / hypothesis | Method | Why this method fits | Quality threshold |
| --- | --- | --- | --- |
| `RQ-01`, `HYP-01` | Fixed-fixture baseline and later-use agent experiment | Observes the claimed behavior in the current runtime | Exact golden output for all three families; control and fresh-process reuse |
| `RQ-01`, `HYP-02` | Action/result and token trace comparison | Locates failure before choosing a solution | Every conclusion ties to direct trace evidence; zero false-success cases |

## Sources or Sample

| Group / source | Inclusion and exclusion | Target / access boundary | Sampling limitation |
| --- | --- | --- | --- |
| Tag normalization | Deterministic normalization/deduplication; no network | Disposable local workspace | Small synthetic transformation |
| Repository evidence report | Structured extraction from checked-in fixtures | Disposable clone or temp workspace | Does not represent all brownfield repositories |
| Saved JSON API fixture | Offline transformation; no credentials | Local fixture only | No live provider behavior |

## Collection Protocol

For each family, run a one-off baseline and later work by a fresh agent. Retain an
ordinary callable capability only when explicitly requested. Record exact output,
LLM calls, marker actions, provider tokens, wall time, errors/corrections, discovery
or duplication, control call, fresh-process call and LLM-visible result volume.

Thresholds:

- exact golden output for all three families;
- at least two of three later-use agents find and call the retained capability
  without duplicating it;
- zero false-success responses after failed or incorrect action results;
- every retained capability passes control and fresh-process checks;
- the fixed sentinel never appears in model-visible messages or events;
- at most six model continuations per phase.

## Controls

Measurement owner: Danil Pismenny. Codex operates the fixed instrument and records
evidence under the orchestration protocol; it does not own threshold changes or
the terminal verdict.

| Risk | Control | Owner |
| --- | --- | --- |
| Prompt/model variance | Fixed prompt, fixture, model and runner version | Codex, experiment operator |
| False success | Compare action result and final claim to golden output | Codex, experiment operator |
| Secret or network exposure | No HTTP, no real secrets, fixed sentinel and temp workspace | Codex, experiment operator |
| Solution bias | Record failure before mapping it to #12, #14 or #16 | Danil Pismenny, measurement/decision owner |

## Stop Rules

- `STOP-01` Stop a phase after six model continuations or two uncontrolled failures.
- `STOP-02` Stop the whole run on writes outside the temp workspace or sentinel transit.
- `STOP-03` After the first concrete failure, synthesize before expanding the sample.

## Plan Approval

| Field | Value |
| --- | --- |
| Reviewer / decision owner | Danil Pismenny |
| Approval reference | User instruction on 2026-08-13 to execute adapted plan items 1–3 |
