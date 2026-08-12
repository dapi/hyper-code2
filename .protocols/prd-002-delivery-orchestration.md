# PRD-002 Delivery Orchestration Protocol

## Protocol Metadata

- Protocol owner and decision owner: Danil Pismenny
- Orchestrator: Codex
- Started: 2026-08-13
- Source: `memory-bank/prd/PRD-002-self-extending-agent-harness.md`
- Scope: execute adapted plan items 1-3 after PRD acceptance
- Execution batch status: `completed`; the broader three-family product
  validation remains `in_progress` and awaits the decision owner after its first failed run.
- Status vocabulary: `pending`, `in_progress`, `completed`, `blocked`, `superseded`
- Completion rule: a step is `completed` only when its stated evidence exists;
  creating a document or issue does not substitute for experiment or decision evidence.

## Baseline

| ID | Item | Status | Evidence |
| --- | --- | --- | --- |
| `BASE-01` | Accept and commit PRD-002 and synchronized product/domain/use-case owners | `completed` | Local commit `b0b61e5` (`docs: accept self-extending agent harness PRD`) |
| `BASE-02` | Review every GitHub issue, including comments | `completed` | Issues `#1…#21` read on 2026-08-13; all open; zero comments |

## Execution Plan

### 1. Establish the product-led epic and first validation slice

The bounded setup and first controlled run below are complete. Full R-001
validation is not complete: only one of three task families ran live, its strict
gate failed, and Danil Pismenny's terminal research disposition is pending.

| ID | Substep | Status | Completion evidence |
| --- | --- | --- | --- |
| `1.1` | Create governed `EP-001` package linked to PRD-002 and UC-005 | `completed` | Active [EP-001](../memory-bank/epics/EP-001/README.md) package |
| `1.2` | Bring `EP-001` to `roadmap_ready` without inventing implementation design | `completed` | Active roadmap, risks, subissues and decision log; verification recorded below |
| `1.3` | Create the corresponding GitHub epic | `completed` | [GitHub #24](https://github.com/dapi/hyper-code2/issues/24) recorded in EP-001 |
| `1.4` | Define 2-3 representative tasks, baseline, evidence method, thresholds and measurement owner | `completed` | [R-001 plan](../memory-bank/research/R-001/plan.md), GitHub #25 |
| `1.5` | Execute the first controlled UC-005 experiment in trusted local mode without real secrets | `completed` | [Runner](experiments/uc005-live-runner.ts), [observation](experiments/uc005-first-live-observation.md), [R-001](../memory-bank/research/R-001/README.md); strict gate failed, not represented as validation |

### 2. Triage active-contract and security gaps

| ID | Substep | Status | Completion evidence |
| --- | --- | --- | --- |
| `2.1` | Reframe issue #17 and remove its conflict with immutable fork inheritance | `completed` | #17 corrected and split into #26 identity, #27 immutable fork, #28 migration |
| `2.2` | Create a mechanism-neutral issue for unauthenticated network-to-process authority | `completed` | [#29](https://github.com/dapi/hyper-code2/issues/29), [R-029](../memory-bank/research/R-029/README.md) |
| `2.3` | Reframe #18 as security research/decision work with a sentinel experiment | `completed` | #18 reframed; [R-018](../memory-bank/research/R-018/README.md) owns the sentinel plan; collection remains future research |
| `2.4` | Reframe #19 as incremental boundary inventory and sink-level delivery after the security decision | `completed` | #19 is a parked candidate dependent on #18 |
| `2.5` | Record non-current sandbox scope for #3 without losing its historical design input | `completed` | #3 comment records PRD NG-02 deferral; issue remains open as inventory |

### 3. Make the first evidence-backed architecture disposition

| ID | Substep | Status | Completion evidence |
| --- | --- | --- | --- |
| `3.1` | Evaluate whether LLM-visible diagnostic volume is a material blocker in the first experiment | `completed` | R-001 found discovery/signature/false-success friction; diagnostic volume was not isolated as material |
| `3.2` | If supported, reframe #12 as a narrow compact-result spike; otherwise defer it with evidence | `completed` | #12 reframed as conditional research and deferred; old 50% target removed |
| `3.3` | Compare current `ctx.fns` with the #14/#16 scoped façade idea only if the experiment exposes discovery, authority or prompt-surface pain | `completed` | [R-014](../memory-bank/research/R-014/README.md) records an asymmetric comparison and insufficient evidence; #16 parked |
| `3.4` | Reframe #10 from executable engineering roadmap into superseded design inventory | `completed` | #10 successor map recorded and issue closed `not planned`; relevant branches moved to #24 |
| `3.5` | Record the decision in the correct owner: epic decision log for local disposition, ADR only for a selected global architecture | `completed` | EP-001 `DL-12…15`; no global architecture selected, therefore no ADR created |

## Guardrails

- TUI remains a supporting mechanism and is not promoted into the first product slice.
- `discover -> compose -> save -> verify -> reuse` is not treated as a mandatory lifecycle.
- Multi-user/team workflow and adversarial sandbox remain outside PRD-002.
- No real secret value is used in experiments; use deterministic sentinels only.
- Existing issue bodies are historical design inputs, not authoritative architecture.
- GitHub closures must preserve a replacement or future-review link.
- No feature implementation starts before the applicable Epic/Research/Feature gate.

## Activity Log

| Date | Event | Result / evidence |
| --- | --- | --- |
| 2026-08-13 | PRD acceptance committed | `b0b61e5` |
| 2026-08-13 | GitHub backlog audit completed | `#1…#21`; no comments |
| 2026-08-13 | Orchestration started | Items 1-3 authorized by Danil Pismenny |
| 2026-08-13 | EP-001 reached Roadmap Ready | Canonical package plus GitHub #24 |
| 2026-08-13 | First UC-005 experiment stopped and synthesized | Mechanism feasible; strict live correctness gate failed; R-001 decision-ready |
| 2026-08-13 | Contract/security triage executed | #17/#18/#19 reframed; #26…29 created; #3 deferred |
| 2026-08-13 | Architecture disposition recorded | #12 deferred, R-014 inconclusive, #16 parked, #10 superseded; no ADR |
| 2026-08-13 | Independent audit correction | Full R-001 validation remains in progress; PRD candidate initiatives separated from EP-001 scope; unpublished GitHub links removed |

## Final Verification

- [x] Every completed row has concrete evidence.
- [x] GitHub state matches `EP-001/subissues.md` and issue links.
- [x] Research findings do not become architecture decisions implicitly.
- [x] `memory-bank-cli lint` passes.
- [x] `memory-bank-cli doctor` has no errors (known missing CI gate and deep-navigation warnings remain).
- [x] `git diff --check` passes.
