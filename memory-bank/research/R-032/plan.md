---
title: "R-032: Research Plan"
doc_kind: research
doc_function: canonical
purpose: "Symmetric static, mock and disposable-prototype comparison of target network authority contracts and candidate mechanisms."
derived_from:
  - brief.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-032: Research Plan

## Method

| Question / hypothesis | Method | Why this method fits | Quality threshold |
| --- | --- | --- | --- |
| `RQ-01`, `HYP-01` | Contract matrix plus shared dispatcher/authority fixtures | Separates target guarantees from implementation convenience and uses R-029's bounded surface | Every candidate is evaluated against identical caller states, immediate/deferred paths and reachability-vs-authority dimensions |
| `RQ-01`, `HYP-02` | Disposable adapters for route and process-boundary behavior with privileged roots stubbed | Tests reduction and bypass properties without delivering production isolation | Boundary placement, denied/allowed calls and residual authority are observable; no claim exceeds prototype fidelity |
| `RQ-01`, `HYP-03` | Synthetic browser and direct CLI/TUI lifecycle harness | Compares trusted-local UX without opening a socket | Same start, reconnect, expiry, revocation and recovery cases produce machine-readable results for every candidate |

## Candidate Set

Each row is a mechanism candidate, not a selected design.

| ID | Candidate | Required modeled properties | Known evidence limit |
| --- | --- | --- | --- |
| `CAN-01` | Loopback-only/default bind scope | interface policy, explicit override behavior, misleading-host output prevention | Source/prototype only; no actual reachability |
| `CAN-02` | Unix-domain socket transport | filesystem ownership/mode assumptions, peer metadata boundary, browser bridge need, stale-socket recovery | No OS socket is opened; kernel and browser behavior remain assumptions |
| `CAN-03` | Caller authentication plus authorization | identity verification, deny-by-default policy, role/scope checks, session lifecycle | Uses synthetic identities only; no external identity provider |
| `CAN-04` | Scoped capability tokens | issuance, audience/scope, attenuation/delegation, expiry, revocation, replay and non-transit | Synthetic capability material only; cryptographic strength is not benchmarked |
| `CAN-05` | Route separation by authority class | public/local/privileged partitions, default classification, dynamic-route inheritance, cross-partition calls | Separation alone does not authenticate a caller |
| `CAN-06` | Process separation | broker/worker authority, IPC message contract, confused-deputy controls, failure/restart boundary | In-process boundary adapter only; OS confinement is not established |

## Representative Combinations

Declare combinations before running fixtures; do not add a combination merely
because an early result favors it.

| ID | Combination | Reason for inclusion |
| --- | --- | --- |
| `COM-01` | Loopback default + authentication/authorization | Tests whether local reachability plus explicit caller authority preserves browser use |
| `COM-02` | Unix-domain socket + scoped capability | Tests direct local-client transport with least-authority possession and no ambient network listener |
| `COM-03` | Loopback default + authentication/authorization + privileged-route separation + process broker | Tests layered coverage and residual-authority reduction at the costliest reasonable boundary |

Other combinations remain excluded unless a pre-collection review records a
distinct contract property that these rows cannot test. All exclusions and any
approved change are evidence metadata, not analyst discretion during scoring.

## Shared Sources And Fixtures

| Source / fixture | Inclusion and exclusion | Access boundary | Limitation |
| --- | --- | --- | --- |
| [R-029 route/control carrier](../../../.protocols/experiments/runs/R-029/2026-08-13-d119f1c-route-control-v2/README.md) | Reuse 36 committed-source entries, authority classes and immediate/deferred labels; do not replay real handlers | Repository-controlled sanitized evidence only | Fixed at R-029 baseline; timing labels are code-path classifications |
| Current `src/http/$start.ts`, `loadRoutes.ts` and `match.ts` | Pin hashes and model shared dispatch/late registration | Read-only committed source | Static source does not prove interface behavior |
| Synthetic caller matrix | Missing, malformed, invalid, valid-insufficient, valid-sufficient, expired, revoked and replayed cases | Deterministic generated identifiers only | Does not test an external identity provider |
| Synthetic local-client lifecycle | Browser-cookie/header adapter and direct CLI/TUI credential-channel adapter; start, reconnect, expiry, revocation, recovery | In-memory requests and responses only | UI ergonomics are modeled, not usability-tested with participants |
| Synthetic dynamic-route/overlay fixtures | Late registration, unclassified privileged route and override attempts | Temporary source strings/objects outside `src` and `.hyper` | Cannot prove behavior of arbitrary user overlays |

### V6 Current-Runtime Wave

The V5 fixed inventory remains valid only at execution HEAD `2ab427a`. Current
HEAD `44225bf` has 37 committed dispatch entries: 35 route modules and two
script registrations. The additive entry is route-local `GET /self`; its
loopback-address check is reachability/peer evidence, not shared caller
authentication or authorization. V6 therefore freezes an explicit 37-entry
allowlist instead of silently extending the R-029/V5 fixture.

V6 must exercise the same real disposable path for all nine labels:

`loadRoutes → match → captured $start.fetch → real POST /agent/:id → disposable
SQLite queue → workerLoop atomic claim and user-message frontier → safe
candidate-specific use-time gate`.

The safe gate replaces production `agent.run` before any provider, model or
marker execution. CAN-06 and COM-03 must traverse a separate disposable stdio
child during collection; otherwise those rows are fidelity-incompatible and
cannot support broker/process-boundary claims. The child is a protocol boundary,
not OS confinement evidence.

V6 freezes the same cases for every label: enqueue-time missing, insufficient
and sufficient authority; use-time expired, revoked, replayed, reduced and
missing authority; mixed-principal messages coalesced into one queue claim;
verifier, policy, broker and stale-state failures; and restart stale, missing
and recovered authority. Authority envelopes bind to message indexes so the
worker can compare every coalesced principal rather than infer one identity from
the agent row.

The S0-S8 detector covers request authority header, sanitized authority
envelope, SQLite envelope, messages, results, IPC, audit, rendered events and
would-be model input. The raw deterministic sentinel may exist only at S0; the
POST body is always sentinel-free, persistent/IPC fields use a digest or safe
labels, and positive raw plus digest-only negative detector controls are
required.

V6 may not call `mkTestCtx`, production `db.migrate`, `project.scan`, real
`self.describe`, script handlers or production `agent.run`. It applies only an
explicit hash-pinned allowlist of committed SQL migrations to a disposable
SQLite database, supplies a synthetic self descriptor, and guarantees worker
shutdown in `finally`. HEAD, clean `src`, source/instrument hashes and an exact
independent pre-collection acceptance must verify before temp creation or child
spawn. No collection is authorized by author self-tests.

The first V6 freeze `0487736d…` was rejected before collection: it did not
independently count the authority root, did not place broker roots exclusively
inside an OS-contained child, derived several use states rather than executing
persisted transitions, used an incomplete detector family/sink vocabulary, and
lacked collection-time assertions and the full carrier/containment contract.
V6.1 is additive and must retain all original scope while correcting every
listed defect. Its pre-review additionally checks per-transform/per-sink R-018
controls, exact 144-row outcomes/root suppression/S1-S8 assertions, minimal
parent/child environments, disposable HOME/TMPDIR, sandbox receipts, child
timeout/termination, and row hashes plus complete checksums/provenance.

V6.1 freeze `56629e9a…` was also rejected before collection. Its root count was
still assigned from a decision result rather than produced solely by an
independently invoked callable, its collection assertions did not reuse the full
author semantic suite, detector positives did not traverse the actual candidate
sink adapters, restart recovery did not cross an independently observable new
boundary, and parent/child containment plus full carrier receipts remained
insufficient. Clean additive V6.2 is bound to HEAD `7828ad9` and remains
explicitly WIP: it freezes callable-root, sink-adapter, cross-generation and
shared assertion contracts, but it cannot receive an exact ready freeze until
the real runtime collector, outer no-spawn preflight, OS containment and full
carrier contracts are implemented together.

Before collection, record the execution HEAD and verify whether relevant current
`src` hashes still match the R-029 baseline. If they differ, create a new
inventory-derived fixture instead of silently reusing the old one.

## Symmetric Evaluation Matrix

Every `CAN-*` and `COM-*` row receives the same cases and raw result fields.

| Axis | Required cases | Evidence field |
| --- | --- | --- |
| Reachability / transport | default locality, explicit non-local request, peer/address metadata, recovery | requested exposure, modeled exposure, caller authority unchanged/changed, fidelity limit |
| Immediate authority | privileged and non-privileged route with every caller state | decision point, decision, reason, handler reached, authority root reached |
| Deferred authority | schedule with initiating identity/capability, later valid/expired/revoked state, missing propagation | bound principal/capability, recheck point, queued work accepted/denied, authority root reached |
| Route lifecycle | committed route, late registration, unclassified route, overlay override | inherited policy, default decision, bypass observed |
| Local UX | browser and direct CLI/TUI start, reconnect, expiry, revocation, recovery | bootstrap steps, user-visible prompts, credential channel, failure/recovery result |
| Failure / operations | stale state, verifier/broker unavailable, policy parse failure, restart | fail-open/closed, recovery action, audit signal, retained authority |
| Secret non-transit | synthetic credential/capability through request, logs, render, persistence, result and model-input fixtures | per-sink sentinel count; required result is zero beyond the designated verifier/broker boundary |

### Hard Gates

A candidate cannot be recommended unless the evidence supports all applicable
gates. `N/A` requires an explicit contract reason and reviewer acceptance.

1. `GATE-01 Default deny`: unauthorized or insufficient callers do not reach an
   immediate privileged handler or authority root.
2. `GATE-02 Deferred authority`: queued work is bound to an initiating authority
   context and cannot gain authority because validation occurred only at enqueue.
3. `GATE-03 Coverage`: committed, late-registered, unclassified and overriding
   routes receive an explicit default policy; no privileged bypass is observed.
4. `GATE-04 Separation`: requested bind/exposure, modeled reachability, caller
   authority and residual process authority are reported independently.
5. `GATE-05 Non-transit`: synthetic identity/capability values remain absent from
   LLM-visible, action-result, render, durable transcript and ordinary log sinks.
6. `GATE-06 Local compatibility`: browser and direct CLI/TUI fixtures have an
   explicit bootstrap, reconnect, expiry/revocation and recovery contract.
7. `GATE-07 Fail closed`: verifier, broker, policy and restart failures do not
   silently grant or retain broader authority.

### Comparative Criteria

After hard gates, compare without hiding trade-offs: coverage strength,
least-authority precision, trusted-local friction, implementation surface,
operational/recovery burden, migration compatibility, observability/auditability,
testability and residual reachability/caller/process risk. Preserve raw evidence;
any ordinal summary must show its rubric and may not turn unsupported prototype
behavior into a numeric fact.

## Collection Protocol

1. Pin source, tool versions and relevant file hashes; copy no user runtime data.
2. Freeze `CAN-*`, `COM-*`, fixtures, expected hard gates and scoring rubric.
3. Build one mechanism-neutral dispatcher/authority harness and validate it
   against the current no-gate control from R-029.
4. Implement each candidate as the smallest disposable adapter around the same
   harness. Do not edit `src`, `.hyper` or runtime configuration.
5. Run the complete caller, authority-timing, route-lifecycle, compatibility,
   failure and non-transit matrices for each candidate and combination.
6. Store machine-readable raw cases, summary, provenance, safety attestations
   and checksums in one immutable run carrier under
   `.protocols/experiments/runs/R-032/<run-id>/`.
7. Run an independent review for fixture symmetry, source provenance, hard-gate
   interpretation, excluded combinations and mechanism-fidelity limitations.
8. Only after review, append collected observations to `evidence.md` and create
   `synthesis.md` when the lifecycle gate is independently satisfied. Danil then records
   a disposition in `decision.md`; any ADR or delivery work is routed separately.

## Controls

| Risk | Control | Owner |
| --- | --- | --- |
| Favoring a preferred mechanism | Shared harness, frozen cases/rubric, equivalent raw fields, predeclared combinations and independent symmetry review | Research owner and reviewer |
| Confusing bind with caller authority | Separate evidence fields and `GATE-04`; never award authorization coverage for locality | Research owner |
| Missing deferred/confused-deputy authority | Enqueue/use-time cases with expiry, revocation, missing propagation and reduced scope | Research owner |
| Prototype overclaim | Record what is static, mocked or prototype behavior per case; `STOP-04` forces an inconclusive result when fidelity is insufficient | Research owner and reviewer |
| Secret/capability disclosure | Deterministic synthetic values, designated verifier/broker boundary, per-sink zero-count checks and no real credential sources | Research owner |
| Network or filesystem side effect | Stub/deny socket APIs and privileged roots; minimal environment; carrier-only writes; fail on any escape | Research owner |
| Source or fixture drift | Exact hashes, execution HEAD, immutable carrier and re-inventory on relevant source change | Research owner |

## Stop Rules

- `STOP-01` and `STOP-02`: complete all symmetric rows and halt before synthesis
  on any fixture/provenance/rubric asymmetry.
- `STOP-03`: terminate immediately on real transport/network access, real secret
  or private-state access, sentinel transit beyond its designated boundary, or
  an out-of-carrier write. Preserve only sanitized failure evidence.
- `STOP-04`: use an `inconclusive` disposition when the no-listener prototype
  boundary cannot distinguish candidates reliably.
- Do not expand into production code, real transport, public/shared exposure,
  rollout, an ADR decision or feature planning inside this research cycle.

## Evidence Carrier Contract

The carrier must include:

- exact source and instrument hashes plus execution environment;
- frozen candidate/combination manifest and exclusion rationale;
- case-level raw results for every evaluation axis;
- hard-gate results and separate reachability/caller/process-risk fields;
- synthetic non-transit sink counts and safety assertions;
- compatibility and failure/recovery traces;
- fidelity limitations, reviewer record and checksums.

Do not store bearer material, credentials, home paths, private data or copied
runtime state. Synthetic values should be represented by stable labels or hashes
outside the designated in-memory verifier fixture.

## Plan Approval

| Field | Value |
| --- | --- |
| Reviewer / decision owner | Danil Pismenny |
| Approval reference | User authorized the separately routed next steps and orchestration on 2026-08-13; [GitHub #32](https://github.com/dapi/hyper-code2/issues/32) records the bounded cycle |

## ADR And Delivery Handoff

- A project-wide client/server, transport, identity/authorization or process
  trust-boundary selection triggers a proposed ADR before delivery.
- Any implementation is a separately routed security-sensitive Feature Flow
  (or Epic if evidence produces multiple independent delivery units), with at
  least the applicable standard validation profile.
- Research disposition never activates non-local/shared use by itself.
