---
title: "EP-001: Roadmap"
doc_kind: epic
doc_function: roadmap
purpose: "Execution waves, dependencies, gates and stop rules for validating reusable self-extension and governing resulting contract, security and architecture work."
derived_from:
  - charter.md
status: active
audience: humans_and_agents
must_not_define:
  - code_steps
  - final_database_schema
  - production_rollout_dates
---

# EP-001: Roadmap

## Waves

| Wave | Target | Depends on | Exit gate |
| --- | --- | --- | --- |
| `W0` | Experiment contract and instrument: 2–3 tasks, baseline, threshold, method, owner and technically enforced trusted/local boundary | Roadmap Ready | `HG-01`, `HG-02` |
| `W1` | Run and evaluate the current-runtime UC-005 experiment | `HG-01`; further live collection also requires `HG-02` | `HG-03` |
| `W2A` | Split and ground marker/result identity, immutable fork inheritance and historical migration from `#17` | Roadmap Ready; may proceed with `W0/W1` | `HG-04` |
| `W2B` | Ground network authority and secret non-transit; research before mechanism delivery | Roadmap Ready; may proceed with `W0/W1` | `HG-04`, `HG-05` |
| `W3` | Conditional compact-result evaluation and symmetric runtime comparison of capability surfaces | `W1`; relevant `W2` evidence | `HG-05` |
| `W4A` | Transfer the legacy issue map and disposition superseded issue `#10` | Roadmap Ready; does not imply downstream delivery approval | Successor links recorded; legacy issue closed |
| `W4B` | Create approved delivery handoffs | Evidence and owner decisions from preceding waves | `HG-06` |

## Current Wave State

| Wave | State | Evidence / next gate |
| --- | --- | --- |
| `W0` | completed for experiment scope | `HG-01` and the macOS v2 experiment boundary exist; this does not claim production security implementation |
| `W1` | completed: inconclusive | R-001 is terminal `inconclusive`; the current runtime/model did not confirm retention/reuse, and the remaining families must not run until a separately routed cycle changes the discovery/retention contract |
| `W2A` | collecting storage-contract evidence | #26 uses Feature Flow; #27 Bug Fix Flow remains stopped at the persistent-contract gate; R-034 V3 establishes bounded feasibility for constant-size revision references and structural-sharing COW but no accepted representation, while #28 separately owns historical migration |
| `W2B` | collecting and synthesizing successor evidence; one non-terminal owner direction recorded | R-018 and R-029 terminally validated bounded gaps; R-032 remains collecting after bounded committed-route V5 evidence; R-033 remains synthesizing, with redaction-only excluded as the standalone boundary and no choice among `CAND-01/02/03/05` |
| `W3` | collecting | R-031/#31 owns the separately routed symmetric runtime comparison of four versioned discovery/retention contracts |
| `W4A` | completed | Successor map exists and #10 is closed |
| `W4B` | pending | No delivery handoff is approved by the administrative `W4A` closure |

## First Slice Recommendation

Start with `EP-SI-01` through Research & Discovery Flow. It owns the experiment
contract and baseline, not runtime delivery. Continue `EP-SI-02` only after both
`HG-01` and experiment-scope `HG-02`. Instrument v2 satisfied that collection
gate on macOS, but the repeated first family failed retain/reuse. The owner
concluded R-001 as `inconclusive`; do not run the remaining sample under the
unchanged discovery/retention contract. Do not create an `FT-*` merely to run product discovery;
create a feature package only when evidence identifies an approved runtime change.

## Handoff Gates

| Gate | Required evidence |
| --- | --- |
| `HG-01` Measurement contract | 2–3 named tasks; comparison baseline; evidence fields; threshold; method; named measurement owner |
| `HG-02` Experiment safety | Trusted/local environment; no public exposure; no real secrets; technically constrained environment and writes; sentinel plan; inspected model-input/result boundaries; sanitized primary evidence; reuse check in a separate OS process |
| `HG-03` Product evidence | Task traces and outcomes; retained/non-retained rationale; later-use evidence; time/steps/errors/context evidence; supported/unsupported/inconclusive verdict |
| `HG-04` Contract gap readiness | Active invariant, verified implementation gap, bounded outcome and migration/data-risk statement; no mechanism inferred from an old issue |
| `HG-05` Decision readiness | Question, alternatives, evidence, limitations, decision owner and ADR trigger; secret/security work includes sentinel evidence |
| `HG-06` Execution handoff | Accepted `EP-SI-*`; linked GitHub issue; selected route; applicable epic refs; required package and validation decision |

## Stop Rules

- Stop an experiment if `HG-01` or `HG-02` is incomplete.
- Stop if a real secret is proposed; replace it with a controlled sentinel.
- Stop non-local/shared execution while the unauthenticated network-to-process path remains open.
- Stop retention automation until confirmation/review policy is explicitly decided.
- Stop issue `#17` implementation until its fork semantics agree with active invariants.
- Do not select issues `#12`, `#14`, `#16`, `#18` or `#19` because their existing bodies are detailed.
- Do not replace ordinary function composition unless `W1/W3` evidence supports the change.
- Promote a project-wide architecture decision to ADR before delivery.
- Route TUI, sandbox, reflection/consolidation, multi-user and domain-practitioner work separately.
- If evidence is inconclusive, record that verdict instead of manufacturing success.
