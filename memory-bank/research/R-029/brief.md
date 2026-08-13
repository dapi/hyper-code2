---
title: "R-029: Network-to-Process Authority"
doc_kind: research
doc_function: canonical
purpose: "Decide the target contract for the unauthenticated network-to-process path."
derived_from: [../../flows/research.md, ../../engineering/security-boundary.md]
status: active
research_status: validated
audience: humans_and_agents
---
# R-029: Network-to-Process Authority

## Intake

| Field | Value |
| --- | --- |
| Source / trigger | PRD-002 `RISK-01`, GitHub #29 |
| Research owner | Codex orchestration completed the fixed-source reconciliation; Danil validated the bounded caller-control gap after independent review |
| Decision owner | Danil Pismenny |
| Research mode | `technical_discovery` |
| Decision deadline / timebox | Fixed-source collection, independent review and terminal owner disposition completed 2026-08-13; real reachability remains separately gated |

## Decision Question

- `RQ-01` What contract must close unauthenticated network access to server-process
  authority before any non-local or shared deployment is supported?

## Working Hypotheses

- `HYP-01` Local-only defaults and non-local authority are separable contracts, but
  the exact mechanism needs threat and compatibility evidence.

## Compact Method Record

The non-trivial route sample and reachability constraints are owned by
[Research Plan](plan.md). This brief does not select loopback/socket,
authentication/authorization, capability tokens, route separation, process
separation or another mechanism.

## Scope

- `RSC-01` Current listener configuration, route discovery/dispatch and the complete
  static route inventory for the selected repository snapshot.
- `RSC-02` Classification of which routes can directly or transitively exercise
  process, filesystem, shell, credential, session or agent authority.
- `RSC-03` Mocked handler behavior and, only after separate approval, isolated
  network reachability sufficient to evaluate the target contract.

## Non-Scope

- `RNS-01` Selecting implementation in this brief or claiming multi-user support.
- `RNS-02` Public/shared exposure, production deployment, adversarial sandboxing or
  implementation of an authentication/authorization mechanism.
- `RNS-03` Treating a bind-address observation as proof that every route is
  unauthenticated or authority-bearing before the inventory is complete.

## Assumptions and Known Evidence

| ID | Statement | Type | Source / confidence |
| --- | --- | --- | --- |
| `EVD-01` | Current documented boundary says HTTP binds `0.0.0.0`, routes lack auth, and `/repl` evaluates in process. | Evidence | [Security boundary](../../engineering/security-boundary.md) |
| `ASM-01` | Static route discovery and call-graph inspection can enumerate the current route surface at a fixed SHA. | Assumption | Must be tested by the plan; dynamic registration may limit completeness |
| `ASM-02` | Direct handler tests can establish most authorization and authority behavior without opening a real socket. | Assumption | Real reachability remains a separate, gated check |
| `ASM-03` | The broader statement that all routes lack equivalent authority enforcement remains provisional until the inventory is reviewed. | Assumption | Current canonical summary is the starting point, not route-by-route evidence |

## Material Unknowns

| Question | Blocks | Owner | Resolution evidence |
| --- | --- | --- | --- |
| Which target authority contract and mechanism best close the validated gap? | Separate downstream decision | Danil Pismenny | New routed research/ADR package; not answered here |
| Which interfaces can reach the listener under an isolated real network configuration? | Bind/reachability conclusion | Experiment operator and security reviewer | Separately approved isolated-network capture |
| Which target mechanism should close any confirmed gap? | Downstream decision | Decision owner | Post-collection synthesis and decision; no mechanism chosen here |

## Security and Access Constraints

- Static inventory and mocked direct-handler tests are the default. Do not bind a
  real listener merely to inspect handler behavior.
- Any real reachability test requires separate recorded approval and an isolated
  network namespace or equivalent disposable environment with no route to public,
  production, shared or user-local networks.
- Use synthetic requests and disposable state only. Do not load real credentials,
  user sessions, private repositories or customer data.
- The test process must have a minimal allowlisted environment, no home/credential
  mounts, no production service tokens and an enforced disposable write root.
- Never create a tunnel, ingress, port-forward or externally reachable listener.
- A result applies only to the recorded SHA, route inventory and network topology;
  it is not evidence of multi-user safety or sandboxing.

## Stopping Condition

- `STOP-01` Stop collection after the complete static route/authority matrix and
  mocked controls have reviewed results, plus an isolated reachability result only
  if separately approved and still necessary.
- `STOP-02` Stop immediately on unexpected network reachability, access to real
  credentials/private data, an out-of-bound write or incomplete provenance.
- `STOP-03` Do not compare or select mechanisms until route inventory makes the
  broader authority statement evidence-backed.

The technical static/mock collection met `STOP-01` on 2026-08-13. An independent
reviewer then signed off the bounded claim that all 36 committed-`src` entries at
the recorded baseline lack a common or route-local caller identity/auth control.
The package passed through `synthesizing` and `decision_ready` to terminal
`validated` for the bounded committed-`src` gap. Optional real reachability
remains prohibited and is not implied by this disposition.

## Boundary Check

- [x] The brief contains a question, assumptions and unknowns, not findings.
- [x] The known starting statement links to its canonical owner and remains provisional at route granularity.
- [x] No authority mechanism, implementation or multi-user claim is selected.
- [x] Network, credential, data and filesystem constraints are explicit.
