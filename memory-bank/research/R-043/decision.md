---
title: "R-043: Research Decision"
doc_kind: research
doc_function: canonical
purpose: "Decision rationale and downstream handoff map for W1A."
derived_from:
  - brief.md
  - synthesis.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-043: Research Decision

## Decision

| Field | Value |
| --- | --- |
| Decision owner | Danil Pismenny |
| Decision date | 2026-08-15 |
| Decision reference | Owner instruction in current task: accept the W1A decision using FPF |

Terminal disposition is recorded only in sibling `brief.md` as `research_status`.
The owner accepted the recommendation; W1A is now `validated`.

## Decision Rationale

- Current code proves source-safe assignment and descriptor reconciliation, but not reversible lifecycle ownership: [FND-01](synthesis.md#findings), [FND-02](synthesis.md#findings), [FND-04](synthesis.md#findings).
- `A-02` is the smallest alternative that addresses EP-003 acceptance without importing a plugin framework or pretending to sandbox in-process references.
- The recommendation preserves existing startup, SelfDescriptor and `ctx.fns` ownership boundaries; it does not authorize implementation or an ADR by itself.

## FPF Decision Frame

### Bounded contexts and strict distinctions

The decision separates four contexts that must not be collapsed:

1. `RegistryLifecycle` owns active function names, generations, staged publication, managed-call leases and disposal state.
2. `ExecutionWork` owns the actual invocation, cancellation, durable execution/action contracts and result semantics; EP-003 does not duplicate those owners.
3. `SelfDescriptor` observes source/provenance truth and reports unavailable or stale facts; it does not revoke or dispose behavior.
4. `CapturedReference` is an external/unmanaged reference once a caller stores a function value directly; it is outside the lifecycle boundary.

This is the FPF strict-distinction guard: registry state is not a running Work,
and a Method reference is not a controllable lifecycle lease.

### Accepted invariants

- `INV-01` One logical function name has at most one active generation in the managed registry.
- `INV-02` A namespace reload stages and validates its replacement set before publishing the set, so a failed reload does not expose a partial generation.
- `INV-03` New managed calls resolve only through the active generation; calls already holding a managed lease may finish according to the execution owner’s cancellation rules.
- `INV-04` Disposal runs only after the retired generation reaches quiescence, is idempotent/best-effort, and exposes failure as lifecycle evidence.
- `INV-05` Removed overlays resolve to an existing base candidate on the next accepted reload; names with no candidate become explicitly unavailable rather than silently retaining a removed overlay.
- `INV-06` Replacing a registry property never claims to revoke direct references captured before replacement; this remains an explicit uncontained limitation, not a security boundary.

### Assurance and selection

The current-state evidence has high reliability for the loader/descriptor gap and
medium reliability for the proposed concurrent/disposal shape because those
fixtures do not yet exist. The selected option is therefore accepted as a
bounded architecture contract with a mandatory confirmation plan, not as proof
that implementation already satisfies the invariants.

## Recommendation

- `REC-01` Accept `A-02` as the W1A contract direction with medium confidence, explicitly accepting `LIM-01..03`; reroute #46 through Feature Flow for the bounded lifecycle slice. The project-wide boundary is recorded in ADR-002 before implementation.

## Alternatives Considered

| Alternative | Why not selected / what would change the decision |
| --- | --- |
| `A-01` Replacement-only | Rejected for EP-003 because it leaves required removal/quiescence/teardown semantics unresolved. |
| `A-03` Worker/process isolation | Rejected as out of scope and incompatible with current procedural runtime; reconsider only under a separately routed security/isolation initiative. |

## Promotion and Handoff Map

| ID | Accepted or retained fact | Canonical downstream owner | Target route / link |
| --- | --- | --- | --- |
| `HD-01` | Current loader has provenance and source-race checks but lacks full lifecycle ownership. | EP-003 W1A evidence | [EP-003 roadmap](../../epics/EP-003/roadmap.md) |
| `HD-02` | Generation/quiescence/disposal contract becomes a delivery input, not an implementation hidden in research. | New `FT-046` feature brief | Feature Flow after `HG-02` and Task Routing |
| `HD-04` | Accepted bounded lifecycle architecture and invariants. | [ADR-002](../../adr/ADR-002-generation-owned-runtime-lifecycle.md) | Feature Flow must confirm compliance; ADR remains owner of the cross-feature choice |
| `HD-03` | Captured direct references remain explicitly uncontained. | EP-003 charter/security boundary | [EP-003 charter](../../epics/EP-003/charter.md#non-scope) |

## Closure Check

- [x] Recommendation answers `RQ-01` and links to synthesized findings.
- [x] Residual uncertainty and owner gate are explicit.
- [x] Sibling `brief.md` records terminal `research_status: validated`.
- [x] No delivery steps or accepted architecture are created by implication.
