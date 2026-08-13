---
title: "R-018: Research Decision"
doc_kind: research
doc_function: canonical
purpose: "Owner disposition and handoff for the sampled secret non-transit gap."
derived_from: [brief.md, synthesis.md, ../../flows/research.md]
status: active
audience: humans_and_agents
---
# R-018: Research Decision

## Decision

| Field | Value |
| --- | --- |
| Decision owner | Danil Pismenny |
| Decision date | 2026-08-13 |
| Decision reference | Danil Pismenny accepted the recommended sequence and authorized completion of the evidence gates on 2026-08-13; independent `-03` review then signed off the bounded evidence |

## Decision Rationale

- `FND-02` and `FND-04` show that the sampled declared-secret route violates
  the target non-transit outcome before any provider call.
- `FND-05` removes the material experimental-containment objection for the named
  controls and platform, while `LIM-01…08` prevent a system-wide or mechanism
  claim.

## Recommendation

- `REC-01` Validate the bounded finding: the sampled current route is not
  conformant with the secret non-transit contract.
- `REC-02` Keep #19 parked until a separately routed comparison selects a
  mechanism and the selected candidate passes the complete reviewed matrix.
- `REC-03` Do not promote the experimental sandbox harness into production
  architecture.

## Alternatives Considered

| Alternative | Why not selected / what would change the decision |
| --- | --- |
| Treat current behavior as conformant | Three sampled repetitions found transit into four prohibited sink classes. |
| Select opaque handles, projection or redaction now | The experiment distinguishes conformance from non-conformance, not candidate quality. |
| Generalize to every secret path | Inventory and credential-store coverage remain intentionally bounded. |

## Promotion and Handoff Map

| ID | Accepted or retained fact | Canonical downstream owner | Target route / link |
| --- | --- | --- | --- |
| `HD-01` | The sampled route violates `BR-05`; the mechanism remains unselected. | EP-001 decision log and security-boundary validation record | [EP decision log](../../epics/EP-001/decision-log.md), [security boundary](../../engineering/security-boundary.md) |
| `HD-02` | Candidate comparison must preserve secret-consuming transport while denying secret values to agent/model/result sinks. | New Research & Discovery package | Route separately before comparing mechanisms |
| `HD-03` | Sink-level implementation #19 remains conditional on an accepted mechanism and validation contract. | GitHub #19 / future delivery owner | Do not activate from this decision alone |

## Closure Check

- [x] Sibling `brief.md` records terminal `validated`.
- [x] Recommendation traces to findings and limitations.
- [x] No production mechanism, feature scope or ADR is selected.
