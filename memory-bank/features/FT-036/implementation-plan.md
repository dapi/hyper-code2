---
title: "FT-036: Implementation Plan"
doc_kind: feature
doc_function: derived
purpose: "Grounded execution plan for the read-only SelfDescriptor."
derived_from:
  - brief.md
  - design.md
status: archived
audience: humans_and_agents
must_not_define:
  - ft_036_scope
  - ft_036_selected_design
  - ft_036_acceptance_criteria
  - ft_036_validation_profile
---

# План имплементации

## Цель текущего плана

Deliver `REQ-01…04` without adding mutation authority or durable schema.

## Grounding Evidence

- Grounded repository revision: `b4534839a4ae1d3ec1b223a7aa77cc7cc44f8710`
- Grounded at: `2026-08-13`

| Grounding ID | Inspected path / command | Observed current-state fact | Plan impact |
| --- | --- | --- | --- |
| `GRND-01` | `src/loadFns.ts`, `src/repl/load.ts` | Both assign loaded functions; reload now uses overlay-wins order but neither records origin. | Both loaders must write the same receipt shape. |
| `GRND-02` | `src/project/scan.ts`, `src/project/roots.ts`, `src/project/classify.ts` | Scanner already returns ordered candidate root, relative and absolute paths. | Reuse scanner candidates; emit only root-relative labels. |
| `GRND-03` | `src/http/loadRoutes.ts`, `src/http/$start.ts`, `src/http/loadRoutes.test.ts` | File-named routes auto-register and object return values serialize as JSON. | Add a thin GET route and route-loader test. |
| `GRND-04` | `src/loadFns.test.ts`, `src/repl/load.test.ts`, `memory-bank/engineering/testing-policy.md` | Bun tests cover loader behavior; full validation commands are canonical. | Add regression at each affected boundary and run full gates. |
| `GRND-05` | `src/agent/fullSystemPrompt.ts`, `src/agent/$type_Agent.ts` | Prompt has two base files plus per-agent content held in runtime state. | Report file identities/hashes and per-agent presence/hash only, never content. |

## Corrective Review Cycle: 2026-08-13

- Bug Fix Flow input: implementation review reported stale receipt provenance
  after direct registry mutation, false base prompt-layer provenance under an
  active overlay composer, and rejection of valid IPv4 loopback peers outside
  `127.0.0.1`.
- Corrective baseline: `2990d66e5749db76ce0a03fe4e21f4fb4fb2bf92`.
- Validation profile: the existing `standard` decision remains applicable;
  the correction changes no accepted API shape, authority or deployment path.
- Required regressions: exact loaded-function identity preservation and
  invalidation, fail-closed active-composer composition, complete validated
  IPv4 `127.0.0.0/8` classification, malformed-address rejection and
  descriptor non-evaluation on denial.

## Implementation Priming

| Order | Exact path / stable source | Section / symbol | Grounding refs | Purpose | Required before |
| --- | --- | --- | --- | --- | --- |
| `1` | `memory-bank/features/FT-036/brief.md` | `Scope`, `Verify` | `GRND-01…05` | Confirm accepted boundary | `STEP-01` |
| `2` | `memory-bank/features/FT-036/design.md` | `Selected Solution`, `Invariants` | `GRND-01…05` | Confirm solution contracts | `STEP-01` |
| `3` | `src/loadFns.ts` | default export | `GRND-01` | Confirm startup assignment path | `STEP-01` |
| `4` | `src/repl/load.ts` | `loadFile` | `GRND-01` | Confirm hot-reload assignment path | `STEP-01` |
| `5` | `src/project/scan.ts` | default export | `GRND-02` | Confirm candidate metadata | `STEP-02` |
| `6` | `src/http/loadRoutes.ts` | default export | `GRND-03` | Confirm route registration | `STEP-03` |

## Test Strategy

| Test surface | Canonical refs | Existing coverage | Planned automated coverage | Required local suites / commands | Required CI suites / jobs | Manual-only gap / justification | Manual-only approval ref |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Loader receipts | `REQ-02`, `SOL-01`, `INV-01` | Loader and reload behavior | Receipt precedence/hash/generation | targeted loader tests; full test | default test job | none | none |
| Descriptor | `REQ-01…04`, `SOL-02`, `INV-02` | none | schema, freshness, unavailable, sentinel | targeted descriptor tests; typecheck; full test | default test job | none | none |
| HTTP route | `REQ-01`, `SOL-03`, `CTR-01` | route loader | registration, handler parity, served GET | targeted route tests; real server GET | default test job | served check is manual command evidence | user execution authorization |

## Open Questions / Ambiguities

none

## Environment Contract

| Area | Contract | Used by | Failure symptom |
| --- | --- | --- | --- |
| setup | `bun install --frozen-lockfile` | all | missing Bun/types/packages |
| test | Bun latest as used by CI; local verification used installed Bun 1.3.14 through mise; local filesystem fixtures only | `CHK-01…05` | Bun 1.2.21 lacks the project-required `Bun.markdown` API and cannot be treated as a valid full-suite environment |
| access / secrets | controlled sentinel only; no provider calls | `STEP-02`, `CHK-03` | any real secret requested or emitted |

## Preconditions

| Precondition ID | Canonical ref | Required state | Used by steps | Blocks start |
| --- | --- | --- | --- | --- |
| `PRE-01` | issue #35; `CON-01` | Overlay-wins reload regression passes | `STEP-01`, `STEP-02` | yes |
| `PRE-02` | `SD-01`, `INV-03` | Receipt is transient and read-only | all | yes |

## Design Realization Mapping

| Canonical solution refs | Owner | Realization target | Steps | Checks | Evidence |
| --- | --- | --- | --- | --- | --- |
| `SOL-01`, `SD-01`, `INV-01`, `FM-01` | `design.md` | startup/reload receipt state | `STEP-01` | `CHK-02` | `EVID-02` |
| `SOL-02`, `SD-02`, `INV-02…03`, `FM-01…03` | `design.md` | self descriptor builder/types | `STEP-02` | `CHK-01…03` | `EVID-01…03` |
| `SOL-03`, `CTR-01` | `design.md` | GET route | `STEP-03` | `CHK-01`, `CHK-04` | `EVID-01`, `EVID-04` |
| `RB-01` | `design.md` | revertable code-only delivery | `STEP-04` | `CHK-05` | `EVID-05` |

## Workstreams

| Workstream | Implements | Result | Owner | Dependencies |
| --- | --- | --- | --- | --- |
| `WS-1` | `REQ-02` | truthful loader receipts | agent | `PRE-01` |
| `WS-2` | `REQ-01…04` | descriptor and route | agent | `WS-1` |
| `WS-3` | all | validation/evidence and docs closure | agent | `WS-2` |

## Approval Gates

No external, production, destructive or mutation action exists. User authorized
execution and PR creation in the current conversation.

## Порядок работ

| Step ID | Actor | Implements | Goal | Touchpoints | Artifact | Verifies | Evidence IDs | Check command / procedure | Blocked by | Needs approval | Escalate if |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `STEP-01` | agent | `SOL-01` | Record loaded origin receipts | `src/loadFns.ts`, `src/repl/load.ts`, tests | transient receipt registry | `CHK-02` | `EVID-02` | targeted loader tests | `PRE-01` | none | registry and receipt precedence diverge |
| `STEP-02` | agent | `SOL-02` | Build bounded descriptor | `src/self/*` | schema v1 function | `CHK-01…03` | `EVID-01…03` | targeted self tests | `STEP-01` | none | any value leakage is required |
| `STEP-03` | agent | `SOL-03`, `CTR-01` | Add JSON GET surface | `src/self/$route_GET.ts`, route tests | `/self` | `CHK-01`, `CHK-04` | `EVID-01`, `EVID-04` | route tests and served GET | `STEP-02` | none | route needs new auth or topology |
| `STEP-04` | agent | `RB-01` | Validate and close docs | feature/protocol docs | evidence summary | `CHK-05` | `EVID-05` | canonical checks | `STEP-03` | none | standard profile cannot be met |

## Parallelizable Work

None: receipt schema is the descriptor input and establishes the sequencing dependency.

## Checkpoints

| Checkpoint ID | Refs | Condition | Evidence IDs |
| --- | --- | --- | --- |
| `CP-01` | `STEP-01`, `INV-01` | Startup and reload receipts agree with loaded registry | `EVID-02` |
| `CP-02` | `STEP-02…03`, `INV-02…03` | Descriptor and route are read-only and secret-free | `EVID-01`, `EVID-03`, `EVID-04` |
| `CP-03` | `STEP-04`, `RB-01` | Full repository gates pass | `EVID-05` |

## Execution Risks

| Risk ID | Risk | Impact | Mitigation | Trigger |
| --- | --- | --- | --- | --- |
| `ER-01` | Candidate scan is mistaken for loaded state | False self-description | Only receipts can establish effective origin | missing receipt |
| `ER-02` | Descriptor serializes arbitrary runtime objects | Secret/value leak | Explicit allow-list projection plus sentinel test | sentinel appears |

## Stop Conditions / Fallback

| Stop ID | Related refs | Trigger | Immediate action | Safe fallback state |
| --- | --- | --- | --- | --- |
| `STOP-01` | `INV-02` | Secret/value transit | Stop, remove field, rerun negative suite | No descriptor release |
| `STOP-02` | `INV-03` | Mutation authority appears | Stop and route separate feature | Read-only baseline only |
| `STOP-03` | `INV-01` | Effective origin cannot be observed | Report unavailable; never infer | Honest partial descriptor |

## Execution Evidence

| Evidence ID | Result | Carrier |
| --- | --- | --- |
| `EVID-01` | pass: targeted descriptor and route tests | `bun test` output, 12 targeted tests pass |
| `EVID-02` | pass: startup/reload receipts, overlay precedence, fresh/stale and unavailable paths | `src/loadFns.test.ts`, `src/repl/load.test.ts`, `src/self/describe.test.ts` |
| `EVID-03` | pass: runtime sentinel absent; non-loopback denied before evaluation | `src/self/describe.test.ts`, `src/self/$route_GET.test.ts` |
| `EVID-04` | pass: real `GET /self` returned HTTP 200 `application/json`, schema v1, 156 capabilities and `self.describe` fresh | localhost served check on port-selector allocation |
| `EVID-05` | pass locally with Bun 1.3.14: typecheck and 413 pass / 3 opt-in provider skips / 0 fail; Memory Bank lint and doctor errors 0, warnings 39 | `/tmp/ft036-full-test-bun-1.3.log`, local command output |

## Corrective Execution Evidence: 2026-08-13

| Evidence ID | Result | Carrier |
| --- | --- | --- |
| `EVID-06` | pass: loader receipts preserve exact non-enumerable function identity; direct replacement/deletion invalidates old provenance; import cache collisions and concurrent source rewrites fail closed | `src/loadFns.test.ts`, `src/repl/load.test.ts`, `src/self/describe.test.ts`; 19 targeted tests pass |
| `EVID-07` | pass: only the exact reviewed shipped composer hash exposes known internal layers; overlay, replaced, unproven and arbitrary same-path composers keep composition unavailable | `src/self/describe.test.ts` |
| `EVID-08` | pass: native IPv4 `127.0.0.0/8`, dotted IPv4-mapped loopback and `::1` are accepted; malformed and non-loopback peers are rejected before descriptor evaluation | `src/self/$route_GET.test.ts` |
| `EVID-09` | pass locally with Bun 1.3.14: typecheck; 422 pass / 3 opt-in provider skips / 0 fail; Memory Bank lint and doctor errors 0; diff-check; independent corrective review clean | local command output; `.protocols/reviews/ft-036-implementation-review.md` |
