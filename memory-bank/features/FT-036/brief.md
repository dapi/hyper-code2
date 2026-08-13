---
title: "FT-036: Read-only SelfDescriptor"
doc_kind: feature
doc_function: canonical
purpose: "Canonical brief для read-only, source-grounded описания текущего агента и его runtime capabilities."
derived_from:
  - ../../flows/feature.md
  - ../../prd/PRD-002-self-extending-agent-harness.md
  - ../../use-cases/UC-008-inspect-and-evolve-agent.md
  - ../../research/R-035/decision.md
status: active
delivery_status: done
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - solution_space
---

# FT-036: Read-only SelfDescriptor

## What

### Problem

The agent has prompt-level navigation hints but no compact runtime-derived way
to answer what functions and prompt layers are active, where a function was
loaded from, how fresh that source is, and which state and authority classes
exist. Filling these gaps from model memory would be misleading.

### Outcome

| Metric ID | Metric | Baseline | Target | Measurement method |
| --- | --- | --- | --- | --- |
| `MET-01` | Truthful descriptor acceptance scenarios | No descriptor | All `SC-*` and `NEG-*` pass | Automated tests plus real served JSON check |

### Scope

- `REQ-01` Expose a versioned descriptor through `ctx.fns.self.describe` and a loopback-only read-only JSON HTTP route; loopback includes IPv6 `::1` and the complete IPv4 `127.0.0.0/8` range.
- `REQ-02` Report registered function candidates and the effective source actually loaded by startup or hot reload, with provenance and freshness, only while the receipt's loaded-function identity still matches the live registry entry.
- `REQ-03` Report identities for prompt layers established by the active composer, plus state and authority categories, without returning their content or values; unknown or replaced composer structure is `unavailable`.
- `REQ-04` Material facts distinguish `observed`, `inferred` and `unavailable` instead of inventing missing evidence.

### Non-Scope

- `NS-01` No write, activation, rollback, proposal-ledger or reflection capability.
- `NS-02` No visual UI; the JSON route is the W2 inspectable surface.
- `NS-03` No prompt contents, environment values, credentials, messages, scratchpads, database rows or other durable state values.
- `NS-04` No claim that every possible process authority or dynamically assigned function can be discovered.

### Constraints / Assumptions

- `CON-01` R-035 recommendations and issue #35 overlay-wins semantics are prerequisites.
- `CON-02` The feature uses the existing single Bun process and route loader; it adds no deployable or persistent schema.
- `CON-03` Secret non-transit is verified with a controlled sentinel.

## Design Requirement Decision

| Decision | Reason | Downstream owner |
| --- | --- | --- |
| `Design required: yes` | A new JSON/API contract and runtime provenance state require explicit compatibility, security and failure semantics. | `design.md` |

## Artifact Routing Decision

| Artifact | Decision | Trigger / reason | Route / owner |
| --- | --- | --- | --- |
| Separate interaction contract | omitted | Contract is compact and has no independent consumer lifecycle. | Inline `CTR-*` in `design.md` |
| UI reference | omitted | Visual UI is `NS-02`. | none |
| Runtime surfaces | omitted | Current surface is small and grounded directly in the plan. | `implementation-plan.md` |

## Validation Profile Decision

| Profile | Triggers / rationale | Downgrade approval |
| --- | --- | --- |
| `standard` | New read-only API and provenance contract; no live/production mutation. | none |

## Verify

### Exit Criteria

- `EC-01` Descriptor and JSON route expose the same versioned read-only contract.
- `EC-02` Overlay precedence and loaded-source freshness are evidence-backed.
- `EC-03` Secret and durable values do not transit the serialized descriptor.

### Traceability matrix

| Requirement ID | Problem refs | Acceptance refs | Checks | Evidence IDs |
| --- | --- | --- | --- | --- |
| `REQ-01` | `CON-02` | `EC-01`, `SC-01` | `CHK-01`, `CHK-04` | `EVID-01`, `EVID-04` |
| `REQ-02` | `CON-01` | `EC-02`, `SC-02` | `CHK-02` | `EVID-02` |
| `REQ-03` | `CON-03` | `EC-03`, `NEG-01` | `CHK-03` | `EVID-03` |
| `REQ-04` | `CON-01` | `SC-03` | `CHK-02`, `CHK-03` | `EVID-02`, `EVID-03` |

### Acceptance Scenarios

- `SC-01` A caller invokes the function or GET route and receives schema version 1 with capabilities, prompts, state and authority sections.
- `SC-02` A duplicate function loaded from `.hyper` reports both candidates, `.hyper` as effective origin and fresh/stale status against the loaded hash while the loaded function identity remains live.
- `SC-03` A live function without recorded source provenance, or whose registry identity no longer matches its receipt, is returned as `unavailable`, not assigned a guessed path.
- `SC-04` The shipped fresh composer reports its known prompt layers; an overlay, direct replacement or composer without validated provenance reports its internal layer composition as `unavailable`.
- `SC-05` Native IPv4 peers throughout `127.0.0.0/8`, IPv4-mapped equivalents and IPv6 `::1` can read the route; malformed or non-loopback peers cannot.
- `NEG-01` A sentinel in environment, custom prompt and runtime state never appears in serialized output.
- `NEG-02` A non-loopback HTTP caller receives 403 and the descriptor is not evaluated.

### Checks

| Check ID | Covers | How to check | Expected result | Evidence path |
| --- | --- | --- | --- | --- |
| `CHK-01` | `EC-01`, `SC-01`, `SC-05` | Targeted descriptor and route tests | Contract schema, parity and complete loopback classification pass | test output |
| `CHK-02` | `EC-02`, `SC-02`, `SC-03`, `SC-04` | Loader/reload and descriptor tests | Effective origin, identity invalidation, active-composer layers and epistemic states pass | test output |
| `CHK-03` | `EC-03`, `NEG-01` | Sentinel non-transit test | Serialized output excludes sentinel | test output |
| `CHK-04` | `EC-01` | Start actual server and GET `/self` | HTTP 200 JSON schema version 1 | served response summary |
| `CHK-05` | all | Canonical install, typecheck, full tests and Memory Bank validation | All required gates pass | command logs |

### Evidence

- `EVID-01` Targeted SelfDescriptor and route test results.
- `EVID-02` Effective-origin and unavailable/freshness regression results.
- `EVID-03` Secret sentinel non-transit result.
- `EVID-04` Real served `/self` response summary.
- `EVID-05` Full validation command results.
