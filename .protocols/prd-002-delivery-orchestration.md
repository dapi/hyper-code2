# PRD-002 Delivery Orchestration Protocol

## Protocol Metadata

- Protocol owner and decision owner: Danil Pismenny
- Orchestrator: Codex
- Started: 2026-08-13
- Source: `memory-bank/prd/PRD-002-self-extending-agent-harness.md`
- Scope: execute adapted plan items 1-3 after PRD acceptance
- Execution batch status: `in_progress`; Danil Pismenny decided `revise and
  continue` after the first failed run. Instrument hardening, the remaining
  task families and a symmetric runtime comparison are not complete.
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

The bounded setup and first exploratory live run below are complete. Full R-001
validation is not complete: only one of three task families ran live, its strict
gate failed, the runner did not provide technical isolation, and the apparent
reload/reuse check stayed inside one Bun process. Danil Pismenny decided to
revise the instrument and continue collection; this is not a terminal research
disposition.

| ID | Substep | Status | Completion evidence |
| --- | --- | --- | --- |
| `1.1` | Create governed `EP-001` package linked to PRD-002 and UC-005 | `completed` | Active [EP-001](../memory-bank/epics/EP-001/README.md) package |
| `1.2` | Bring `EP-001` to `roadmap_ready` without inventing implementation design | `completed` | Active roadmap, risks, subissues and decision log; verification recorded below |
| `1.3` | Create the corresponding GitHub epic | `completed` | [GitHub #24](https://github.com/dapi/hyper-code2/issues/24) recorded in EP-001 |
| `1.4` | Define 2-3 representative tasks, baseline, evidence method, thresholds and measurement owner | `completed` | [R-001 plan](../memory-bank/research/R-001/plan.md), GitHub #25 |
| `1.5` | Execute the first exploratory UC-005 live run in trusted local mode without real secrets | `completed` | [Runner](experiments/uc005-live-runner.ts), [observation](experiments/uc005-first-live-observation.md), [R-001](../memory-bank/research/R-001/README.md); strict correctness failed, same-process reload only, and `HG-02` was not proven |
| `1.6` | Revise the instrument to enforce the experiment boundary, preserve sanitized primary evidence and verify reuse in a new OS process | `completed` | [Instrument v2](experiments/README.md) uses sandboxed agent children, a credential-owning broker, a separate restart process, gold/result/final checks and checksummed artifacts; this does not claim production `HG-02` |
| `1.7a` | Repeat tag normalization on the revised instrument | `completed` | [Live v2 report](experiments/runs/2026-08-13-tags-v2/report.json): baseline passed; retain exhausted its call budget; reuse and restart correctly failed because no capability existed; no false success; sentinel was not injected and did not appear accidentally |
| `1.7b` | Run the remaining repository-report and saved-JSON task families | `pending` | Stopped under `STOP-03` after the repeated first family exposed a concrete retain/discovery failure; owner review is required before expanding the sample |

### 2. Triage active-contract and security gaps

| ID | Substep | Status | Completion evidence |
| --- | --- | --- | --- |
| `2.1` | Reframe issue #17 and remove its conflict with immutable fork inheritance | `completed` | #17 corrected and split into #26 identity, #27 immutable fork, #28 migration |
| `2.2` | Create a mechanism-neutral issue for unauthenticated network-to-process authority | `completed` | [#29](https://github.com/dapi/hyper-code2/issues/29), [R-029](../memory-bank/research/R-029/README.md) |
| `2.3` | Reframe #18 as security research/decision work with a sentinel experiment | `completed` | #18 reframed; [R-018](../memory-bank/research/R-018/README.md) owns the sentinel plan and the subsequently collected bounded static/mock evidence |
| `2.4` | Reframe #19 as incremental boundary inventory and sink-level delivery after the security decision | `completed` | #19 is a parked candidate dependent on #18 |
| `2.5` | Record non-current sandbox scope for #3 without losing its historical design input | `completed` | #3 comment records PRD NG-02 deferral; issue remains open as inventory |

### 3. Make the first evidence-backed architecture disposition

| ID | Substep | Status | Completion evidence |
| --- | --- | --- | --- |
| `3.1` | Evaluate whether LLM-visible diagnostic volume is a material blocker in the first experiment | `completed` | R-001 found discovery/signature/false-success friction; diagnostic volume was not isolated as material |
| `3.2` | If supported, reframe #12 as a narrow compact-result spike; otherwise defer it with evidence | `completed` | #12 reframed as conditional research and deferred; old 50% target removed |
| `3.3a` | Make an initial disposition from current-runtime evidence and the #14/#16 paper proposals | `completed` | [R-014](../memory-bank/research/R-014/README.md) terminates the desk pass as `inconclusive`; no architecture selected and #16 remains parked |
| `3.3b` | Run a symmetric fixture-equivalent runtime comparison of viable capability surfaces | `pending` | Requires a separately framed follow-up research cycle and disposable comparable projections; paper descriptions are not runtime evidence |
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

### 4. Correct evidence integrity and execute safe independent research

| ID | Substep | Status | Completion evidence |
| --- | --- | --- | --- |
| `4.1` | Correct lifecycle, restart, safety and W4 overclaims found by independent review | `completed` | R-001 moved to `synthesizing` after its v2 stop; R-014 desk pass is `inconclusive`; W4 split into administrative W4A and pending delivery W4B |
| `4.2` | Build and verify instrument v2 with isolated agent processes, credential broker and stable primary evidence | `completed` | [Instrument v2](experiments/README.md), [canonical offline report](experiments/runs/canonical-offline/report.json), valid checksums and real separate-process restart verification |
| `4.3` | Ground #27 through Bug Fix Flow and preserve a failing regression without selecting storage design | `completed` | #27 route/profile/reproduction updated; commit [`792a166`](https://github.com/dapi/hyper-code2/commit/792a166) on `agent/issue-27-reproduction` preserves the expected failing test without selecting a fix |
| `4.4` | Execute approved R-018 static/mock/synthetic collection | `in_progress` | [Partial R-018 evidence](../memory-bank/research/R-018/evidence.md) found sampled transit, but the collector lacked the plan's OS containment; corrected collection or explicit reapproval is required |
| `4.5` | Execute approved R-029 static inventory and mocked authority checks | `in_progress` | [Partial R-029 evidence](../memory-bank/research/R-029/evidence.md) inventories 36 entries and runs 11 representative mocks; full route/control reconciliation and independent review remain pending |
| `4.6` | Obtain owner dispositions for stopped R-001 and complete R-018/R-029 collection | `pending` | Danil Pismenny chooses each next state only after the applicable evidence gate; no terminal research state or delivery handoff is inferred |

## Activity Log

| Date | Event | Result / evidence |
| --- | --- | --- |
| 2026-08-13 | PRD acceptance committed | `b0b61e5` |
| 2026-08-13 | GitHub backlog audit completed | `#1…#21`; no comments |
| 2026-08-13 | Orchestration started | Items 1-3 authorized by Danil Pismenny |
| 2026-08-13 | EP-001 reached Roadmap Ready | Canonical package plus GitHub #24 |
| 2026-08-13 | First UC-005 experiment stopped and synthesized | Same-process mechanism feasible; strict live correctness gate failed; safety isolation and process restart were not proven |
| 2026-08-13 | Contract/security triage executed | #17/#18/#19 reframed; #26…29 created; #3 deferred |
| 2026-08-13 | Architecture disposition recorded | #12 deferred, R-014 inconclusive, #16 parked, #10 superseded; no ADR |
| 2026-08-13 | Independent audit correction | Full R-001 validation remains in progress; PRD candidate initiatives separated from EP-001 scope; unpublished GitHub links removed |
| 2026-08-13 | Owner continuation decision | Danil Pismenny chose `revise and continue`; R-001 returned to `collecting` |
| 2026-08-13 | Lifecycle correction | R-014 desk pass closed `inconclusive`; runtime comparison split into pending `3.3b`; no ADR |
| 2026-08-13 | Instrument v2 offline gate | Broker plus sandboxed phase processes and separate restart verifier passed the canonical mock fixture; checksums verified |
| 2026-08-13 | Tag-normalization live v2 | Baseline exact; retain hit call limit without creating capability; later reuse returned an honest empty result; restart found no callable; remaining task families stopped |
| 2026-08-13 | R-018 partial collection reviewed | Synthetic declared-secret value reached sampled sinks, but missing OS containment was recorded as a plan deviation; lifecycle returned to collection |
| 2026-08-13 | R-029 partial static/mock collection reviewed | 36 committed-source entries inventoried and 11 representative mocks run; reconciliation/reviewer gate remains open |

## Final Verification

- [x] Every completed row has concrete evidence; incomplete security collections are marked `in_progress` with their plan deviations.
- [x] GitHub state matches `EP-001/subissues.md` and issue links.
- [x] Research findings do not become architecture decisions implicitly.
- [x] `memory-bank-cli lint` passes.
- [x] `memory-bank-cli doctor` has no errors (known missing CI gate and deep-navigation warnings remain).
- [x] `git diff --check` passes.
