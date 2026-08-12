---
title: "EP-001: Decision Log"
doc_kind: epic
doc_function: decision_log
purpose: "Epic-local decisions governing scope, sequencing, evidence and issue disposition for EP-001."
derived_from:
  - charter.md
status: active
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - global_architecture_policy_without_adr
---

# EP-001: Decision Log

## FPF Reading Rule

Facts, assumptions, reasoning, decisions and consequences remain distinct. These
epic-local decisions do not select global architecture.

## Resolved Decisions

| ID | Date | Decision | Facts And Reasoning | Consequences |
| --- | --- | --- | --- | --- |
| `DL-01` | 2026-08-13 | Direct Bootstrap; no Epic Intake brief | Active PRD and explicit owner approval provide sufficient intent and scope | Package begins at governed epic owners |
| `DL-02` | 2026-08-13 | Product evidence precedes architecture selection | Existing issue detail is pre-PRD proposal, not validation | `W0/W1` precede conditional `W3` |
| `DL-03` | 2026-08-13 | Use current browser/runtime for the first experiment | UI is a supporting mechanism and current browser exists | TUI remains outside this epic |
| `DL-04` | 2026-08-13 | No mandatory promotion lifecycle | PRD explicitly rejects an invented universal ordered loop | Tasks may reuse existing code, remain one-off or retain capability |
| `DL-05` | 2026-08-13 | Govern fork, network authority and secret gaps independently | They have distinct contracts, risks and evidence | Separate `W2A/W2B` outcomes |
| `DL-06` | 2026-08-13 | Split issue `#17` | Identity, immutable fork semantics and historical migration are independently reviewable | Parent updates cannot weaken active immutable-prefix behavior |
| `DL-07` | 2026-08-13 | Research before selecting secret mechanism | PRD defines outcome but leaves mechanism downstream | `#18` becomes research; `#19` remains conditional |
| `DL-08` | 2026-08-13 | Compare current `ctx.fns` with mediated alternatives | Mediation may improve authority yet harm ordinary composition | No mediated runtime is accepted by default |
| `DL-09` | 2026-08-13 | Compact-result work is evidence-triggered | No accepted baseline proves diagnostic volume is material | `EP-SI-09` remains candidate until `W1` |
| `DL-10` | 2026-08-13 | Supersede the executable DAG in issue `#10` after outcome transfer | It preselects architecture before the accepted product experiment | Preserve design inventory and explicit successor links |
| `DL-11` | 2026-08-13 | Assign validation profiles per delivery owner | Epic Flow does not own one validation profile for all slices | Research/feature owners record their own contracts |
| `DL-12` | 2026-08-13 | Revise the instrument and continue R-001 collection; do not treat the first live run as product validation | Same-process reload worked, but no OS-process restart or technical safety isolation was proven; later reuse called the wrong signature and falsely claimed success | R-001 is `collecting`; further live runs wait for revised-instrument `HG-02` evidence |
| `DL-13` | 2026-08-13 | Defer compact-result delivery | The first trace showed discovery/signature friction, not isolated diagnostic-volume pressure | #12 is research-gated and has no accepted numeric target |
| `DL-14` | 2026-08-13 | Terminate the R-014 desk pass as inconclusive; do not select a capability architecture from asymmetric evidence | Current `ctx.fns` has runtime evidence; mediated/generated candidates have descriptions only | A symmetric runtime comparison requires a separate research cycle; #16 remains parked; no ADR is triggered |
| `DL-15` | 2026-08-13 | Close legacy epic #10 after successor-map transfer, independently of future delivery handoffs | Reframing and successor links were complete at Roadmap Ready; delivery decisions remain evidence-gated | `W4A` is complete and #10 is closed `not planned`; `W4B` remains pending without rejecting future evidence-led variants |
| `DL-16` | 2026-08-13 | Stop R-001 expansion after the v2 repetition and return to owner review | Instrument v2 made evidence auditable; baseline passed, but retain exhausted the call budget, no capability existed for reuse/restart, and no false success occurred | Do not run the other two families or change the prompt mid-sample; R-001 moves to synthesis until the owner chooses revise, conclude or reroute |
| `DL-17` | 2026-08-13 | Preserve the sampled R-018 transit as provisional evidence and correct the collection deviation before decision readiness | The declared-secret fixture reached sampled sinks, but the collector lacked the approved OS containment preconditions | R-018 remains collecting; #19 stays parked and no ADR is triggered |
| `DL-18` | 2026-08-13 | Preserve R-029 static inventory and representative mocks as partial evidence | The run inventoried 36 entries and exercised 11 representative cases, but did not complete route/control reconciliation or independent matrix review | R-029 remains collecting; real reachability and all implementation mechanisms remain separately gated |
