---
title: "R-029: Network-to-Process Authority"
doc_kind: research
doc_function: canonical
purpose: "Decide the target contract for the unauthenticated network-to-process path."
derived_from: [../../flows/research.md, ../../engineering/security-boundary.md]
status: active
research_status: framed
audience: humans_and_agents
---
# R-029: Network-to-Process Authority

## Intake

| Field | Value |
| --- | --- |
| Source / trigger | PRD-002 `RISK-01`, GitHub #29 |
| Research / decision owner | Danil Pismenny |
| Research mode | `technical_discovery` |

## Decision Question

- `RQ-01` What contract must close unauthenticated network access to server-process
  authority before any non-local or shared deployment is supported?

## Working Hypotheses

- `HYP-01` Local-only defaults and non-local authority are separable contracts, but
  the exact mechanism needs threat and compatibility evidence.

## Compact Method Record

- Inventory bind defaults and privileged routes from current code; model trusted-local
  and non-local threats; compare loopback/socket, authentication/authorization,
  capability-token, route-separation and process-separation options.
- Primary evidence is current code and controlled reachability tests; no public exposure.
- Disconfirming signal: a route-independent mechanism already enforces equivalent authority.

## Scope

- `RSC-01` Current HTTP reachability and privileged process actions.

## Non-Scope

- `RNS-01` Selecting implementation in this brief or claiming multi-user support.

## Assumptions and Known Evidence

| ID | Statement | Type | Source / confidence |
| --- | --- | --- | --- |
| `EVD-01` | Current documented boundary says HTTP binds `0.0.0.0`, routes lack auth, and `/repl` evaluates in process. | Evidence | [Security boundary](../../engineering/security-boundary.md) |

## Stopping Condition

- `STOP-01` Stop after a reviewed target contract, option comparison and bounded handoff exist.
