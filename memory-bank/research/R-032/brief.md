---
title: "R-032: Network Authority Contract And Mechanism"
doc_kind: research
doc_function: canonical
purpose: "Canonical decision question, boundaries and lifecycle state for comparing network authority contracts and candidate mechanisms."
derived_from:
  - ../../flows/research.md
  - ../R-029/decision.md
  - ../../engineering/security-boundary.md
status: active
research_status: collecting
audience: humans_and_agents
---

# R-032: Network Authority Contract And Mechanism

## Intake

| Field | Value |
| --- | --- |
| Source / trigger | [R-029 `HD-02`](../R-029/decision.md#promotion-and-handoff-map), EP-001 `EP-SI-06`, [GitHub #32](https://github.com/dapi/hyper-code2/issues/32) |
| Research owner | Codex orchestration under Danil Pismenny's review |
| Decision owner | Danil Pismenny |
| Research mode | `technical_discovery` |
| Decision deadline / timebox | One bounded symmetric static/mock/prototype cycle; stop at the evidence gates in [the plan](plan.md) |

## Decision Question

- `RQ-01` What target authority contract and candidate mechanism best close the
  validated committed-`src` network-to-process caller-authority gap while
  preserving trusted-local browser and direct CLI/TUI user experience?

## Working Hypotheses

- `HYP-01` A layered contract that states local transport/reachability and caller
  authority separately will cover the gap more completely than either a bind
  restriction or caller credential alone.
- `HYP-02` Route or process separation can reduce residual process authority, but
  cannot by itself establish caller identity and authorization.
- `HYP-03` The candidates can be compared fairly without a real listener by using
  the same committed-route fixtures, dispatcher mocks, authority-timing model and
  synthetic local-client compatibility protocol.

## Method Record

The comparison, prototypes, security controls and evidence thresholds are owned
by the [Research Plan](plan.md). This brief does not select a mechanism.

## Current Lifecycle Note

The independently accepted bounded V6.3 carrier completes one substantial
collection wave against the frozen 9 × 16 runtime matrix. It does not satisfy
the full plan stopping condition: late/unclassified/overlay coverage, empirical
reachability/residual-process separation, and browser/direct-CLI lifecycle
evidence remain outside or below the required fidelity. `research_status`
therefore remains `collecting`; no synthesis, recommendation, ADR or mechanism
selection is authorized by this wave.

## Scope

- `RSC-01` Define a target contract that denies unauthorized callers before
  immediate authority and preserves the initiating authority context across any
  deferred agent/model/marker execution.
- `RSC-02` Compare bind scope/loopback, Unix-domain socket transport, caller
  authentication plus authorization, scoped capability tokens, route separation,
  process separation and reasonable layered combinations.
- `RSC-03` Evaluate bind/reachability, caller authority and residual process
  authority as separate dimensions against the same committed-source surface.
- `RSC-04` Evaluate compatibility for the current trusted-local browser flow and
  the anticipated direct CLI/TUI flow, including start, reconnect, expiry,
  revocation and recovery behavior.
- `RSC-05` Define treatment of runtime route registration and `.hyper` overlays;
  the comparison may use synthetic overlay fixtures but must not load user state.

## Non-Scope

- `RNS-01` Opening a real listener or socket, testing interface reachability, or
  exposing the system to a public, shared, production or user-local network.
- `RNS-02` Using real credentials, secrets, user sessions, provider calls,
  private data or persisted user runtime state.
- `RNS-03` Production implementation, rollout, committed feature scope, accepted
  ADR or mechanism selection before reviewed evidence and Danil's disposition.
- `RNS-04` Claiming current multi-user support, adversarial sandboxing or complete
  limitation of the trusted server process's own authority.
- `RNS-05` Reopening R-029's bounded committed-`src` caller-control finding or
  treating source bind configuration as actual reachability evidence.

## Assumptions and Known Evidence

| ID | Statement | Type | Source / confidence |
| --- | --- | --- | --- |
| `EVD-01` | At its fixed source baseline, all 36 committed-`src` dispatch entries lacked a common or route-local caller identity/auth control. | Evidence | [R-029 decision](../R-029/decision.md) and [independently reviewed synthesis](../R-029/synthesis.md); high within its stated exclusions |
| `EVD-02` | The current listener requests `0.0.0.0` and dispatches a matched handler without a caller-authority gate in that shared path. | Evidence | [HTTP listener implementation](../../../src/http/$start.ts); source evidence, not an interface-reachability test |
| `EVD-03` | Current policy prohibits public or multi-tenant exposure and requires the downstream decision to keep bind/reachability and caller authority explicit. | Evidence | [Security boundary](../../engineering/security-boundary.md) |
| `EVD-04` | Runtime `.hyper` functions load after committed `src` and may override the same registered name. | Evidence | [Engineering architecture](../../engineering/architecture.md#extension-boundary) |
| `ASM-01` | A synthetic local-client handshake can reveal browser and CLI/TUI compatibility differences without opening a transport. | Assumption | Must be tested with identical lifecycle fixtures; it cannot establish OS transport behavior |
| `ASM-02` | A small set of layered combinations can represent meaningful compositions without evaluating the full Cartesian product. | Assumption | Combination-selection rule and excluded combinations must be recorded before collection |

## Material Unknowns

| Question | Blocks | Owner | Resolution evidence |
| --- | --- | --- | --- |
| Which identity or capability lifecycle can cover immediate and deferred authority without exposing bearer material to an LLM-visible context? | Target caller-authority contract | Research owner; Danil decides | Synthetic issuance, scope, propagation, expiry, revocation and non-transit captures |
| Which transport and bind defaults preserve trusted-local browser and direct CLI/TUI startup/reconnect behavior? | Compatibility and reachability contract | Research owner; Danil decides | Symmetric synthetic client-lifecycle results; real reachability remains excluded |
| How should dynamic routes and overlays inherit or be denied authority by default? | Bypass-resistance requirement | Research owner; Danil decides | Static loader trace and synthetic late-registration/override controls |
| Does route or process separation materially reduce residual authority enough to justify its complexity? | Candidate mechanism recommendation | Research owner; Danil decides | Equivalent mock/prototype cases and residual-risk comparison |

## Security and Access Constraints

- Static analysis, direct dispatcher/handler mocks and disposable in-process
  prototypes are the only approved collection modes.
- Prototype transport and peer identity are data abstractions. Do not call
  `Bun.serve`, `listen`, `connect`, tunnel, ingress or port-forward APIs.
- Use deterministic synthetic identities, capability material, sessions and
  files. Stub eval, shell, filesystem, provider, settings and process-control roots.
- Synthetic capability material must not appear in model input, action-result
  context, logs, rendered HTML or durable transcript fixtures.
- Use a minimal allowlisted environment, no home/credential reads and a
  disposable evidence-only write root under `.protocols/experiments/runs/R-032/`.
- A result applies only to its recorded source hash, fixtures and prototype
  semantics. It is not network reachability, rollout or production-security proof.

## Stopping Conditions

- `STOP-01` Stop after every named candidate has an equivalent contract row,
  negative-control result, immediate/deferred authority result, compatibility
  result and residual-risk note; evaluate only the predeclared representative
  combinations.
- `STOP-02` Do not advance to synthesis if fixtures, source provenance, scoring
  rubric or candidate implementation fidelity are asymmetric.
- `STOP-03` Stop immediately if a real socket/listener or unexpected network
  access occurs, a real secret/private source is requested, synthetic authority
  material reaches an LLM-visible sink, or a write escapes the evidence carrier.
- `STOP-04` Conclude `inconclusive` rather than infer a mechanism if prototype
  fidelity cannot support a target-contract comparison without prohibited real
  transport or production implementation.

## ADR Trigger

If Danil selects a target contract that changes the project-wide client/server,
transport, identity/authorization or process trust boundary, route a proposed ADR
before delivery. Research evidence may recommend that handoff but cannot create
an accepted architecture decision.

## Boundary Check

- [x] The brief contains a question and falsifiable hypotheses, not selected mechanisms or findings.
- [x] Known facts link to R-029, the security owner and current code; unsupported statements remain assumptions or unknowns.
- [x] Bind/reachability, caller authority and residual process authority are separate evaluation dimensions.
- [x] Immediate/deferred authority and browser/direct CLI/TUI compatibility are included.
- [x] No real listener, secret, user state, production implementation, accepted ADR or multi-user claim is authorized.
