---
title: "R-018: Secret Non-Transit Boundary"
doc_kind: research
doc_function: canonical
purpose: "Determine an enforceable secret non-transit contract and validation method."
derived_from: [../../flows/research.md, ../../engineering/security-boundary.md, ../../prd/PRD-002-self-extending-agent-harness.md]
status: active
research_status: framed
audience: humans_and_agents
---
# R-018: Secret Non-Transit Boundary

## Intake

| Field | Value |
| --- | --- |
| Source / trigger | PRD-002 `BR-05/VAL-08`, GitHub #18 |
| Research / decision owner | Danil Pismenny |
| Research mode | `technical_discovery` |
| Timebox | One boundary inventory and sentinel experiment before #19 activation |

## Decision Question

- `RQ-01` What enforceable boundary keeps secret values out of LLM input and
  LLM-visible action-result context, including failure paths?

## Working Hypotheses

- `HYP-01` A mechanism-neutral conformance contract can be defined before choosing
  opaque references, bounded projection, redaction or a combination.

## Scope

- `RSC-01` Model request construction, action/result/error paths, persistence and known external sinks.

## Non-Scope

- `RNS-01` Real credentials, production migration or a preselected projection kernel.

## Stopping Condition

- `STOP-01` Stop when current paths are inventoried, deterministic sentinels cover
  success and failure paths, and alternatives can be recommended with limitations.
