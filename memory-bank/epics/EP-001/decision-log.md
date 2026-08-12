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
| `DL-12` | 2026-08-13 | Do not treat the first live run as product validation | Reload/restart worked, but later reuse called the wrong signature and falsely claimed success | R-001 is decision-ready; remaining task families require an owner continuation decision |
| `DL-13` | 2026-08-13 | Defer compact-result delivery | The first trace showed discovery/signature friction, not isolated diagnostic-volume pressure | #12 is research-gated and has no accepted numeric target |
| `DL-14` | 2026-08-13 | Do not select a capability architecture from asymmetric evidence | Current `ctx.fns` has runtime evidence; mediated/generated candidates have descriptions only | R-014 recommends a bounded comparative prototype; #16 remains parked; no ADR is triggered yet |
| `DL-15` | 2026-08-13 | Close legacy epic #10 after successor transfer | Relevant issues now report to product-led #24; speculative journal/budget/UI work remains historical inventory | #10 is closed `not planned`, without rejecting future evidence-led variants |
