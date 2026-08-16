---
title: "EP-003: Risks"
doc_kind: epic
doc_function: risk_register
purpose: "Cross-feature reload, action, reconstruction, security, compatibility, and scope risks for EP-003."
derived_from:
  - charter.md
  - roadmap.md
status: active
audience: humans_and_agents
---

# EP-003: Risks

| Risk ID | Risk | Impact | Control | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| `ERISK-01` | Reload leaves stale callable registrations or side effects | Divergence from effective source/SelfDescriptor | Generation ownership, removal/fallback fixtures, teardown, reconciliation | SI-01/04 | open |
| `ERISK-02` | Old generation is disposed while an in-flight call uses it | Inconsistent results or loss | Explicit quiescence and concurrent fixtures | SI-01/04 | open |
| `ERISK-03` | Captured direct `ctx.fns` references outlive a managed generation | False lifecycle guarantee | Inventory and state an explicit scope/limitation before delivery | SI-01/04 | open |
| `ERISK-04` | Hooks change pairing, special-marker behavior, or commit twice | Broken UC-002/scheduler effects | All-kind conformance including `§html`; one commit owner; consume #11/#13 | SI-02/05 | open |
| `ERISK-05` | Hook order, cancellation, nesting or authority is underspecified | Bypass, deadlock, invented order | Contract-first model and adversarial fixtures | SI-02/05 | open |
| `ERISK-06` | Internal seam is mistaken for containment | Security claims exceed enforcement | Explicit uncontained label; preserve security ownership | Epic/security | open |
| `ERISK-07` | Receipt duplicates secret or sensitive content | Durable leakage surface | #19 and EP-001 sink/non-transit gates; no auth/raw chunks | SI-03/06, #19 | open |
| `ERISK-08` | Reconstruction rereads mutable inputs and invents history | False auditability | Versioned snapshots/hashes; unavailable/withheld states; immutable links | SI-03/06 | open |
| `ERISK-09` | Receipt is confused with provider-internal model input | Misleading diagnostics/audit claim | Name submitted-payload boundary in UC-009, fixtures and UI/API | SI-03/06 | open |
| `ERISK-10` | Provider rendering drifts from common evidence | Reconstructed payload differs from submitted payload | Per-provider rendering fixtures, version and retry coverage | SI-03/06 | open |
| `ERISK-11` | EP-003 duplicates existing contract ownership | Conflicting invariants/migration burden | Dependency gates and stop rules | Epic owner | open |
| `ERISK-12` | Prior art drives wholesale framework adoption | Architecture drift | Adopt properties only; ADR gate | Epic owner | open |
| `ERISK-13` | All slices activate together | Weak causal evidence | Independent dispositions and routed features | Epic owner | open |
