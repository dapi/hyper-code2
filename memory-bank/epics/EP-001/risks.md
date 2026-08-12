---
title: "EP-001: Risks"
doc_kind: epic
doc_function: risk_register
purpose: "Cross-feature product, contract, security, evidence and scope risks for EP-001."
derived_from:
  - charter.md
  - roadmap.md
status: active
audience: humans_and_agents
---

# EP-001: Risks

| Risk ID | Risk | Impact | Control | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| `ERISK-01` | Representative tasks favor the proposed approach | False positive | Predeclare tasks, baseline and threshold; retain observations and limitations | `EP-SI-01` owner | open |
| `ERISK-02` | One immediate task is mistaken for reuse evidence | Core hypothesis remains untested | Require later relevant use or an inconclusive verdict | `EP-SI-02` owner | open |
| `ERISK-03` | Capability library duplicates or becomes harder to maintain | No cumulative benefit | Observe discovery, duplication, callable contract and maintenance cost | Experiment owner | open |
| `ERISK-04` | A secret enters LLM-visible input/result | Credential exposure and `BR-05` violation | No real secrets; sentinel-only tests; research before delivery | `EP-SI-07` owner | open |
| `ERISK-05` | Unauthenticated HTTP/REPL path is reachable | Network caller gains process authority | Trusted-local restriction and independent `EP-SI-06` | `EP-SI-06` owner | open |
| `ERISK-06` | Issue `#17` weakens immutable fork semantics | Child context changes after fork | Split issue; resolve contract before design; migration evidence | `EP-SI-04/05` owners | open |
| `ERISK-07` | Detailed issue `#10` is treated as approved architecture | Speculative program runs before evidence | Treat as inventory; compare alternatives; transfer accepted outcomes only | Epic owner | open |
| `ERISK-08` | Missing metrics owner or threshold produces narrative success | No auditable verdict | `HG-01` blocks experiment | Epic owner | open |
| `ERISK-09` | TUI/reflection/sandbox/multi-user expand scope | Delayed or incoherent delivery | Explicit non-scope and rerouting | Epic owner | open |
| `ERISK-10` | Draft UC-005 is presented as implemented/active | Documentation overclaims behavior | Keep draft until its Activation Gate | Epic owner | open |
| `ERISK-11` | Security mediation removes useful code composition | Product thesis is weakened | Preserve free composition as a criterion; require evidence and ADR trigger | `EP-SI-10` owner | open |
