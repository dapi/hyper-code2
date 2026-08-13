# PRD-002 Next-Wave Orchestration Protocol

## Protocol Metadata

- Protocol and decision owner: Danil Pismenny
- Orchestrator: Codex
- Started: 2026-08-13
- Authorization: Danil Pismenny, `ok, действуй как оркестратор`
- Source: accepted PRD-002, EP-001 handoffs, and terminal R-001/R-018/R-029 dispositions
- Batch status: `in_progress`
- Status vocabulary: `pending`, `in_progress`, `completed`, `blocked`, `superseded`
- Completion rule: routing and evidence are separate. A research row is complete
  only after its stated evidence and owner disposition exist; a delivery row is
  complete only after its flow-specific validation and review gates pass.

## Execution Plan

| ID | Workstream | Status | Current evidence / next gate |
| --- | --- | --- | --- |
| `NW-01` | Compare versioned discovery and retention contracts without reopening R-001 | `in_progress` | [#31](https://github.com/dapi/hyper-code2/issues/31), [R-031](../memory-bank/research/R-031/README.md); offline symmetry and mock boundary-envelope are reviewed; live/model execution remains blocked by named process/read/Mach, full-agent and credential-boundary gaps |
| `NW-02` | Compare target network authority contracts and candidate mechanisms | `in_progress` | [#32](https://github.com/dapi/hyper-code2/issues/32), [R-032](../memory-bank/research/R-032/README.md); v3 is accepted bounded executable evidence for partial gates, while complete route/reachability/UX/restart matrix work remains before synthesis |
| `NW-03` | Compare secret non-transit enforcement mechanisms | `in_progress` | [#33](https://github.com/dapi/hyper-code2/issues/33), [R-033](../memory-bank/research/R-033/README.md); inventory is reviewed, but V1/V2 are downgraded and V3 rejected; clean-sheet V4 is required before candidate synthesis |
| `NW-04` | Restore immutable fork inheritance through Bug Fix Flow | `blocked` | Regression is preserved, but root-cause review found that every correct fix selects a new persistent-data contract; [#34](https://github.com/dapi/hyper-code2/issues/34) now owns that prerequisite research and [#27](https://github.com/dapi/hyper-code2/issues/27) remains open |
| `NW-05` | Independently review evidence, record owner dispositions, and route only accepted handoffs | `pending` | Starts after each research package reaches its review gate; no ADR or feature is inferred from an experiment winner |

## Guardrails

- Do not reopen terminal research packages or extend their conclusions beyond
  their recorded samples and source revisions.
- Use identical fixtures, authority and context when comparing alternatives.
- Do not use real credentials, provider calls, listeners, user-local state or
  production data in comparative prototypes.
- Preserve ordinary callable composition as an explicit criterion; do not turn
  discovery research into a mandatory promotion lifecycle.
- Keep reachability, caller authority, process authority and secret non-transit
  as distinct claims.
- Do not implement #27 until #34 yields an accepted immutable-storage contract;
  historical migration remains separately owned by #28.
- Promote a cross-module storage, provider, transport, identity or process-boundary
  choice to a proposed ADR only after research disposition and owner acceptance.

## Activity Log

| Date | Event | Result |
| --- | --- | --- |
| 2026-08-13 | Next-wave orchestration authorized | Four independent workstreams routed under existing governance |
| 2026-08-13 | Discovery/retention successor routed | #31 and R-031 created; R-001 remains terminal |
| 2026-08-13 | Security successors routed | #32/R-032 and #33/R-033 created; no production mechanism selected |
| 2026-08-13 | #27 Bug Fix Flow STOP gate | Verified persistent-contract dependency; #34 created and #27 left open |
| 2026-08-13 | R-031 offline control review | V0–V2 symmetry controls passed; reviewer rejected V3's first adapter claim, so the carrier is being corrected before `STOP-01` can close |
| 2026-08-13 | R-031 corrected offline control | Explicit V3 descriptor adapter, tamper rejection and hard ordinary-composition gate passed independent review; this does not authorize a live run |
| 2026-08-13 | R-033 inventory correction | Provider refresh, keychain/file/env source, list-models discovery, retry and write/error sinks added; renewed independent inventory review remains the injection gate |
| 2026-08-13 | R-033 direct-authority correction | Root context, settings, arbitrary DB query and shared-process authority were added as symmetric `CC-14`; independent review signed off inventory completeness for the recorded source scope |
| 2026-08-13 | R-031 mock boundary-envelope review | Context/projection symmetry and five named denied probes were independently signed off; live execution remains blocked by process/read/Mach, full-agent and credential-boundary gaps |
| 2026-08-13 | Security candidate dry-run review | R-032 and R-033 accounting matrices were rejected as mechanism evidence because their first outcomes were formula-driven; both remain collecting while executable disposable adapters are added |
| 2026-08-13 | R-032 executable evidence review | Corrected v3 accepted for bounded G1/G2/G5/G7 observations only; incomplete route/reachability/UX/restart coverage blocks synthesis |
| 2026-08-13 | R-033 executable evidence review | V2 retained only as partial execution and V3 rejected for provenance and mechanism-fidelity gaps; exact clean-sheet V4 scope recorded |

## Final Verification

- [ ] Every completed row has attributable primary evidence and an independent review where required.
- [ ] Research lifecycle states, EP-001, GitHub and this protocol agree.
- [ ] No research result silently becomes production architecture or delivery scope.
- [ ] `memory-bank-cli lint` passes.
- [ ] `memory-bank-cli doctor` has no errors.
- [ ] `git diff --check` passes.
- [ ] The draft PR body states current scope, limitations and pending owner decisions accurately.
