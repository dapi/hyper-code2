---
title: "R-036: Evidence Log"
doc_kind: research
doc_function: canonical
purpose: Traceable mutation-path, surface and recovery observations for the self-change contract.
derived_from:
  - brief.md
  - plan.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-036: Evidence Log

Grounded repository revision: `e301161a70ca685feedfaa5bfba0d3580c73e3f7`.
Collection was static and read-only. No runtime file, database, route, external
state, environment value or credential was changed or accessed.

## Sources

| ID | Source / provenance | Date / freshness | Collection context | Access / quality note |
| --- | --- | --- | --- | --- |
| `SRC-01` | [Marker execution](../../../src/agent/executeMarker.ts), [in-process eval](../../../src/repl/eval.ts), and [shell execution](../../../src/agent/executeBash.ts) | Grounded revision, inspected 2026-08-13 | Local source read | Primary dispatch/authority evidence |
| `SRC-02` | [Function reload](../../../src/repl/load.ts), [route reload](../../../src/http/loadRoutes.ts), and [type generation](../../../src/genTypes.ts) | Grounded revision | Local source read | Primary live-activation evidence |
| `SRC-03` | [Filesystem resolver](../../../src/files/resolveSafe.ts), [write](../../../src/files/write.ts), and [hashline edit](../../../src/files/editHashline.ts) | Grounded revision | Local source read | Primary file-mutation evidence |
| `SRC-04` | [Database migration runner](../../../src/db/migrate.ts) | Grounded revision | Local source read | Primary schema activation evidence |
| `SRC-05` | [Session persistence](../../../src/session/save.ts), [marker event persistence](../../../src/agent/executeMarker.ts), and [session synchronization](../../../src/session/syncAgentState.ts) | Grounded revision | Local source read | Shows current conversation/action trace, not a self-change ledger |
| `SRC-06` | [Git runner](../../../src/git/run.ts) and [git status](../../../src/git/status.ts) | Grounded revision | Local source read | Available recovery/provenance primitive; no integrated activation contract |
| `SRC-07` | [Architecture extension boundary](../../engineering/architecture.md), [autonomy boundaries](../../engineering/autonomy-boundaries.md), and [security boundary](../../engineering/security-boundary.md) | Active canonical docs, inspected 2026-08-13 | Local governed sources | Authority and approval constraints; not enforcement implementation |
| `SRC-08` | [R-035 origin-resolution evidence](../R-035/evidence.md) | Same grounded revision | Sibling research result | Static conflict relevant to overlay activation |

## Observations

| ID | Observation | Supporting `SRC-*` | Applies to | Interpretation boundary |
| --- | --- | --- | --- | --- |
| `OBS-01` | Marker dispatch directly invokes eval, bash, write and edit; failures are captured as action results and events. | `SRC-01`, `SRC-03`, `SRC-05` | `RQ-01`, `HYP-02` | Observable conversation trace is not prior approval or atomic rollback |
| `OBS-02` | Eval executes generated code in the server process; bash runs arbitrary `bash -c`; filesystem resolution permits absolute/out-of-workspace paths. | `SRC-01`, `SRC-03`, `SRC-07` | Enforcement/bypass boundary | A new voluntary API cannot enforce approval against these existing paths |
| `OBS-03` | File write creates parent directories and overwrites the target directly; hashline edit checks stale anchors before writing but does not snapshot or atomically activate runtime behavior. | `SRC-03` | Staging/recovery | Anchor validation protects edit freshness, not behavioral rollback |
| `OBS-04` | Function reload imports a candidate and then replaces the registry entry; no proposal ID, before identity, verification gate, transaction or restore record is part of the loader. | `SRC-02` | `HYP-01` | Import failure leaves prior assignment untouched, but post-assignment behavioral failure has no automatic recovery |
| `OBS-05` | Route reload mutates route buckets while scanning and can rebuild browser assets; it is not an all-or-nothing route-table swap. | `SRC-02` | Route activation | Partial activation/recovery semantics need separate treatment |
| `OBS-06` | Type generation writes `src/ctx_ns.d.ts`; migration execution scans both roots and applies each unapplied migration transactionally to SQLite, recording it in `_migrations`. | `SRC-02`, `SRC-04` | Generated/core/migration surfaces | Per-migration SQL transaction is not a general application rollback; applied migrations are materially different from overlay reload |
| `OBS-07` | Current marker events preserve requested action and result, while session state persists messages/events, but there is no durable self-change proposal/approval/activation/rollback entity. | `SRC-05` | Audit contract | Transcript reconstruction is possible but not a stable state machine or recovery source |
| `OBS-08` | Git helpers can inspect/stage/commit/push repository changes but do not provide runtime activation or restore semantics and external mutations require explicit authority. | `SRC-06`, `SRC-07` | Candidate comparison | Git is useful provenance/recovery input, not sufficient alone |
| `OBS-09` | Canonical boundaries already require explicit authority for destructive, external, production and publication actions and distinguish shipped `src` from experimental `.hyper`. | `SRC-07` | Surface matrix | Product policy exists, but runtime paths are not comprehensively mediated |
| `OBS-10` | Startup and hot-reload resolution differ for duplicate names, so current overlay activation cannot yet make a stable effective-origin guarantee. | `SRC-08` | `HYP-01` | Requires regression/contract resolution before bounded overlay claims |

## Surface Matrix

| Surface | Minimum approval posture | Activation/recovery concern | Current evidence |
| --- | --- | --- | --- |
| Read-only self-description | Ordinary authorized task | No mutation; freshness/provenance only | R-035 |
| New/changed `.hyper` overlay | Accepted local policy plus proposal verification; human gate configurable by policy | Effective-origin correctness, snapshot, live check, restart and restore | Partial primitives; no contract |
| Shipped `src` core | Explicit human approval and Feature Flow | Repository review, tests, process restart/live behavior and revert | Git/test primitives only |
| Base system prompt / persistent behavior policy | Explicit human approval | Prompt identity, injection boundary, regression and revert | Prompt is file-composed; no promotion path |
| Migration / durable schema | Explicit human approval and standard-or-higher delivery validation | Forward compatibility, data recovery and migration history | Per-migration transaction only |
| Security/auth/secret boundary | Explicit human approval, separate owner/ADR when triggered | Cannot be weakened by self-change; sentinel evidence | EP-001 successors own mechanisms |
| Destructive/external/production | Explicit action-specific authority; outside automated self-change | Irreversible/live effects and independent backout | Canonical autonomy boundary only |

## Candidate Comparison

| Candidate | Approval/enforcement | Activation/verification | Recovery | Main limitation |
| --- | --- | --- | --- | --- |
| `CAND-01` Direct write/edit plus current reload | None beyond prompt/task policy | Immediate, component-specific | Manual file restoration | Current state; cannot support bounded/reversible claim |
| `CAND-02` In-process before-value snapshot around current reload | Voluntary API only | Can add pre/post checks | Fails if process/loader/controller is broken; restart identity unclear | Recovery depends on affected process |
| `CAND-03` Versioned overlay generation with stable pointer/swap and candidate-independent restore controller | Can enforce within governed path; raw bypass remains unless separately mediated | Stage, verify, activate by identity, observe | Restore prior generation without executing candidate | Best overlay contract direction; exact carrier/process mechanism undecided |
| `CAND-04` Git/worktree-only proposal and activation | Strong review/provenance for tracked core | Good test/review path; poor same-session overlay activation | Git revert/worktree recovery | Suitable input for core changes, not a universal runtime mechanism |
| `CAND-05` Hybrid by surface | Approval and mechanism match risk class | Read-only, overlay, core, migration and external paths remain distinct | Recovery appropriate per surface | More policy/design complexity, but avoids false universal abstraction |

## Minimum State Contract

`draft -> proposed -> blocked | approved -> staged -> verified -> active -> rolled_back`

`failed` may occur from staging, verification, activation, observation or
rollback and must record the effective-state identity after failure. `rejected`
and `cancelled` are terminal without activation. Exact persistence schema is not
selected by this research.

## Collection Log

| Date | Activity | Result | Deviation / reason |
| --- | --- | --- | --- |
| 2026-08-13 | Inventoried current mutation, activation, audit and recovery primitives | Direct paths and missing contracts recorded | None |
| 2026-08-13 | Classified seven surface groups | Different approval/recovery postures are required | None |
| 2026-08-13 | Compared five candidate contracts | Hybrid surface policy with versioned overlay direction is strongest | No executable prototype by scope |
| 2026-08-13 | Reconciled R-035 override finding | Overlay mutation delivery remains blocked on effective-origin semantics | Added explicit dependency |

## Evidence Quality Check

- [x] Material observations trace to grounded primary sources.
- [x] Static source, policy and analyst interpretation are separated.
- [x] Bypass, partial-activation and recovery limitations are explicit.
- [x] No privileged mutation or secret access occurred.
