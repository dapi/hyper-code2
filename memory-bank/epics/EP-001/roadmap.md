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
| `W0` | Experiment contract: 2–3 tasks, baseline, threshold, method, owner and trusted/local sentinel-only boundary | Roadmap Ready | `HG-01`, `HG-02` |
| `W1` | Run and evaluate the current-runtime UC-005 experiment | `W0` | `HG-03` |
| `W2A` | Split and ground marker/result identity, immutable fork inheritance and historical migration from `#17` | Roadmap Ready; may proceed with `W0/W1` | `HG-04` |
| `W2B` | Ground network authority and secret non-transit; research before mechanism delivery | Roadmap Ready; may proceed with `W0/W1` | `HG-04`, `HG-05` |
| `W3` | Conditional compact-result evaluation and comparative `ctx.fns` versus mediated-runtime disposition | `W1`; relevant `W2` evidence | `HG-05` |
| `W4` | Create approved delivery handoffs and disposition legacy issue `#10` | Evidence and decisions from preceding waves | `HG-06` |

## First Slice Recommendation

Start with `EP-SI-01` through Research & Discovery Flow. It owns the experiment
contract and baseline, not runtime delivery. After `HG-01` and `HG-02`, route
`EP-SI-02` independently. Do not create an `FT-*` merely to run product discovery;
create a feature package only when evidence identifies an approved runtime change.

## Handoff Gates

| Gate | Required evidence |
| --- | --- |
| `HG-01` Measurement contract | 2–3 named tasks; comparison baseline; evidence fields; threshold; method; named measurement owner |
| `HG-02` Experiment safety | Trusted/local environment; no public exposure; no real secrets; sentinel plan; inspected model-input/result boundaries |
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
