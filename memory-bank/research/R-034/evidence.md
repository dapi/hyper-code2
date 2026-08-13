---
title: "R-034: Evidence Log"
doc_kind: research
doc_function: canonical
purpose: "Traceable current-state and bounded synthetic evidence for immutable fork storage candidates."
derived_from:
  - brief.md
  - plan.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-034: Evidence Log

R-034 remains `collecting`. These observations establish the current gap and
candidate trade-off surface; they do not select a representation or authorize a
production schema, migration or ADR.

## Sources

| ID | Source / provenance | Date / freshness | Collection context | Access / quality note |
| --- | --- | --- | --- | --- |
| `SRC-01` | [DR-05 and known implementation gap](../../domain/rules.md), [UC-003](../../use-cases/UC-003-fork-and-delegate.md) | 2026-08-13 | Canonical contract review | Primary durable intent; storage-neutral |
| `SRC-02` | [GitHub #27](https://github.com/dapi/hyper-code2/issues/27), failing carrier commit [`792a166`](https://github.com/dapi/hyper-code2/commit/792a166), [contract-change stop](https://github.com/dapi/hyper-code2/issues/27#issuecomment-5276024063) | 2026-08-13 | Issue and committed regression review | Primary reproduction trace; no fix/design selected |
| `SRC-03` | [GitHub #34](https://github.com/dapi/hyper-code2/issues/34) and [#28](https://github.com/dapi/hyper-code2/issues/28) | 2026-08-13 | Routing and ownership review | Primary scope/sequencing records; #28 inventory not yet collected |
| `SRC-04` | [`$migrate_20260418000000_init.up.sql`](../../../src/session/$migrate_20260418000000_init.up.sql), [`$migrate_20260428150000_add_forks.up.sql`](../../../src/session/$migrate_20260428150000_add_forks.up.sql) and later message migrations at commit `680be81564f6192a7f147da9e3deada79357517e` | 2026-08-13 | Static schema/migration inspection | Primary code; no runtime database opened |
| `SRC-05` | [`fork.ts`](../../../src/session/fork.ts), [`getFullMessages.ts`](../../../src/session/getFullMessages.ts), [`save.ts`](../../../src/session/save.ts) at commit `680be81564f6192a7f147da9e3deada79357517e` | 2026-08-13 | Static fork/read/write inspection | Primary code; exact implementation only at pinned revision |
| `SRC-06` | [`appendMessage.ts`](../../../src/session/appendMessage.ts), [`replaceMessages.ts`](../../../src/session/replaceMessages.ts), [`deleteMessageAt.ts`](../../../src/session/deleteMessageAt.ts), [`truncateMessagesFrom.ts`](../../../src/session/truncateMessagesFrom.ts) at commit `680be81564f6192a7f147da9e3deada79357517e` | 2026-08-13 | Static mutation-path inspection | Primary code; interleavings not dynamically exercised |
| `SRC-07` | [`load.ts`](../../../src/session/load.ts), [`loadAll.ts`](../../../src/session/loadAll.ts), [`syncAgentState.ts`](../../../src/session/syncAgentState.ts) and [`connect.ts`](../../../src/db/connect.ts) at commit `680be81564f6192a7f147da9e3deada79357517e` | 2026-08-13 | Static restart/rehydration inspection | Primary code; no ordinary restart E2E claim |
| `SRC-08` | [SQLite isolation](https://www.sqlite.org/isolation.html) and [transaction](https://www.sqlite.org/lang_transaction.html) documentation | 2026-08-13 | Official documentation review | Primary engine guarantees; not application atomicity proof |
| `SRC-09` | [SQLite foreign keys](https://www.sqlite.org/foreignkeys.html) and [integrity pragmas](https://www.sqlite.org/pragma.html) | 2026-08-13 | Official documentation review | Primary engine documentation; connection configuration matters |
| `SRC-10` | [Downgraded v1 formula/containment instrument](../../../.protocols/experiments/r034-storage-comparison.ts) and [aggregate output](../../../.protocols/experiments/runs/R-034/2026-08-13-storage-v1/results.json) | 2026-08-13 | Generated data only in disposable temp SQLite files | Valid only for deterministic formulas, generic SQLite size accounting and temp-directory/close-reopen smoke; candidate behavior, schema and restart claims rejected |
| `SRC-11` | [V2 executable instrument](../../../.protocols/experiments/r034-storage-v2.ts), [carrier README and label/limitation correction](../../../.protocols/experiments/runs/R-034/2026-08-13-storage-v2/README.md), [results](../../../.protocols/experiments/runs/R-034/2026-08-13-storage-v2/results.json), [manifest](../../../.protocols/experiments/runs/R-034/2026-08-13-storage-v2/manifest.json) and [provenance](../../../.protocols/experiments/runs/R-034/2026-08-13-storage-v2/provenance.json); integrity manifest covers only the frozen JSON artifacts | 2026-08-13 | Six distinct generated-data SQLite implementations in private OS-temp directories | Pending independent review; internal IDs `immutable_revision` and `cow_segments` overstate their executed shapes; provenance source/not-executed sets are incomplete as detailed below |

## Observations

| ID | Observation | Supporting `SRC-*` | Applies to | Interpretation boundary |
| --- | --- | --- | --- | --- |
| `OBS-01` | Current `messages` identity is the mutable composite `(agent_id, idx)`; content, role and exclusion flags are stored on that row, with no stable logical message ID, immutable version ID or conversation revision. | [SRC-04](../../../src/session/$migrate_20260418000000_init.up.sql) | `HYP-05`, identity | A future design could add identity without preserving this table shape. |
| `OBS-02` | Current fork metadata contains only `parent_id` and integer `fork_offset`. `fork()` computes the offset from the current fully assembled message count, while `getFullMessages()` recursively rereads the current parent and slices by array position. | [SRC-05](../../../src/session/getFullMessages.ts) | `CC-01…03`, nested forks | Static inspection plus #27 proves the known edit/delete case; it does not measure every mutation form. |
| `OBS-03` | `save()` and `replaceMessages()` delete and recreate an agent's local message rows; delete/truncate physically remove rows; surviving `idx` values may be gapped. Therefore ordinal position and row identity do not name immutable fork-time content. | [SRC-05](../../../src/session/save.ts), [SRC-06](../../../src/session/deleteMessageAt.ts) | edits/deletes/reorder, identity | This does not require one particular replacement mechanism. |
| `OBS-04` | Exclusion state is mutable message metadata used by reads, and `includeExcluded` changes the assembled array observed by `getFullMessages()`. A fork boundary expressed only as filtered array length is ambiguous unless the snapshot defines whether role/content/order/exclusion are versioned together. | [SRC-04](../../../src/session/$migrate_20270410120000_add_messages_excluded.up.sql), [SRC-05](../../../src/session/getFullMessages.ts) | exclusion and prefix boundary | The current UI/API semantics of changing exclusion were not modified or selected here. |
| `OBS-05` | Rehydration reconstructs a child by executing the same recursive live-parent read, so a process restart persists metadata but does not restore the child’s original inherited content after parent mutation. | [SRC-07](../../../src/session/syncAgentState.ts), [SRC-02](https://github.com/dapi/hyper-code2/issues/27) | `CC-08` | A dedicated restart regression has not been added to production tests. |
| `OBS-06` | Current append index allocation performs `MAX(idx)+1` and insert as separate statements, while current fork offset capture and child save are also separate operations. SQLite serializes writers, but application-level atomicity still requires an explicit transaction that captures a coherent revision/boundary and child reference. | [SRC-06](../../../src/session/appendMessage.ts), [SRC-05](../../../src/session/fork.ts), [SRC-08](https://www.sqlite.org/lang_transaction.html) | `CC-07` | This is a race surface from code structure, not a reproduced corruption result. |
| `OBS-07` | WAL readers see a stable database snapshot for a transaction and SQLite permits one writer at a time. `BEGIN IMMEDIATE` can reserve the write transaction, but an engine snapshot is transient and is not itself a durable conversation revision addressable after commit/restart. | [SRC-08](https://www.sqlite.org/isolation.html) | concurrency and restart | SQLite's optional snapshot API is not evidence of availability through Bun or a retained application contract. |
| `OBS-08` | Foreign-key enforcement must be enabled per connection, and `integrity_check` does not replace `foreign_key_check`. The current connection enables WAL but not foreign keys, so a candidate relying on reference integrity must include connection and diagnostic contracts, not only DDL. | [SRC-07](../../../src/db/connect.ts), [SRC-09](https://www.sqlite.org/foreignkeys.html) | operability, migration | This does not require foreign keys as the only integrity mechanism. |
| `OBS-09` | V1 deterministically expands declared row-count formulas into generic `content_rows`, `reference_rows` and `metadata_rows`, uses generated data in private OS-temp databases, closes/reopens them and removes the temp root. | [SRC-10](../../../.protocols/experiments/runs/R-034/2026-08-13-storage-v1/results.json) | containment and accounting smoke only | Candidate behavior, distinct schema/read/write semantics, identity linkage and restart correctness were not executed; all such v1 claims are rejected. |
| `OBS-10` | V1's generic SQLite page totals vary with its formulas and payload sizes, but its tables are not candidate schemas and its reference/metadata counts are authored expectations rather than observed candidate operations. | [SRC-10](../../../.protocols/experiments/runs/R-034/2026-08-13-storage-v1/results.json) | method limitation | V1 cannot support candidate feasibility, relative storage ranking, migration or operability conclusions. |
| `OBS-11` | #28 requires historical shape inventory and safe ambiguity handling, but no such inventory exists in the reviewed issue. R-034 therefore cannot claim that old `(agent_id, idx, parent_id, fork_offset)` rows uniquely identify fork-time message versions or filtered order. | [SRC-03](https://github.com/dapi/hyper-code2/issues/28), [SRC-04](../../../src/session/$migrate_20260428150000_add_forks.up.sql) | `CC-10`, migration | Absence of evidence is not proof that every legacy row is ambiguous; classification belongs to #28. |
| `OBS-12` | V2 executes four distinct positive shapes: full-prefix version-reference snapshot (internal ID `immutable_revision`), materialized inherited/local version refs, append-only event cutoff, and full ordered root-entry snapshot (internal ID `cow_segments`). Their aggregate final-state checks and the full-copy control pass the recorded root/mid snapshots, post-mutation inherited views, nested final view and close/reopen equality. | [SRC-11](../../../.protocols/experiments/runs/R-034/2026-08-13-storage-v2/results.json) | bounded `CC-01…05`, `CC-08` subclaims | It does not execute CAND-01's constant-size parent revision or CAND-04's COW segments/sharing. Assertions are initial/final aggregates, not per-transition evidence; no HYP-01 or COW feasibility follows. |
| `OBS-13` | The live-parent control passes its initial fork snapshots and fails final inherited-view and nested expected-view checks after parent mutations. Its `childMutationAndSiblingIsolation: false` flag is confounded by those earlier parent mutations and cannot isolate child-to-sibling bleed. | [SRC-11](../../../.protocols/experiments/runs/R-034/2026-08-13-storage-v2/manifest.json) | negative control for parent-mutation sensitivity | The synthetic control is not the committed #27 regression, and `closeReopen: true` only means the same already-mutated view reloads. |
| `OBS-14` | V2 records actual executed-shape tables, indexes, plain table row counts, SQLite bytes, `integrity_check`, a frozen source/instrument hash subset and environment; checksums verify for its three frozen JSON artifacts. | [SRC-11](../../../.protocols/experiments/runs/R-034/2026-08-13-storage-v2/provenance.json) | provenance and containment | There is no linkage-validation query and no candidate-valid W1-W5 growth evidence. Frozen provenance omits the exclusion migrations, `connect.ts`, `migrate.ts`, several plan sources and incorrectly lists only W4/W5 as unexecuted; all W1-W5 and every remaining plan cell are unexecuted/unclaimed. |

## Candidate Comparison Record

| Candidate | Behavior and nested forks | Storage-growth shape | Edit/delete and compaction | Concurrency/restart | Operability and migration implications |
| --- | --- | --- | --- | --- | --- |
| `CAND-01` immutable revision | Hypothesis: historical lookup can preserve exact parent state and nested cutoffs with constant-size fork metadata. | Expected to retain immutable versions/change metadata. | Edits/deletes require new versions/tombstones. | Must atomically bind revision and boundary. | Still unexecuted: V2's similarly named internal ID materializes a full prefix of version refs. |
| `CAND-02` materialized version refs | Hypothesis: ordered inherited refs can make reads direct without copied content. | Expected prefix-linear reference rows. | GC must retain referenced versions. | Fork must insert a coherent ref set. | UC-003 interpretation and executable evidence remain open. |
| `CAND-03` event cutoff | Hypothesis: replay to an immutable cutoff can preserve historical state. | Expected event/checkpoint growth. | Compaction requires a separately reviewed contract. | Stream sequence and cutoff must be atomic. | Replay/checkpoint operability remains unproven. |
| `CAND-04` COW snapshot graph | Hypothesis: immutable roots can preserve fork-time sequences with structural sharing. | Expected changed-path/segment metadata. | GC needs reachability from roots. | New root publication must be atomic. | Still unexecuted: V2's similarly named internal ID materializes a full ordered root-entry snapshot without segments or sharing. |
| `CAND-05` full copy control | Behavior is direct and restart-simple. | O(sum inherited content bytes), not just references. | Independent after copy. | Potentially large atomic fork write. | Violates active no-full-transcript-copy postcondition; not eligible for selection in R-034. |
| `CAND-06` current live parent | Nested recursion works only while ancestors remain unchanged. | O(messages + forks) with minimal metadata. | Parent edits/deletes/exclusion/reorder alter descendants; compaction can invalidate meaning. | No durable revision boundary; restart rereads changed rows. | Already disproven against DR-05/UC-003; control only. |

The table records structural consequences and open trade-offs. It is not a
ranking or recommendation.

## Collection Log

| Date | Activity | Result | Deviation / reason |
| --- | --- | --- | --- |
| 2026-08-13 | Routed #34 through Research & Discovery Flow and pinned repository revision | Decision question, owner, scope and stop conditions recorded | None |
| 2026-08-13 | Reviewed DR-05, UC-003, PRD-002, issues #27/#28/#34, schema/migrations and fork/read/mutation/restart paths | Current identity, boundary, mutation, concurrency and legacy gaps recorded | No production code or database executed |
| 2026-08-13 | Reviewed official SQLite isolation, transaction, foreign-key and integrity-check behavior | Engine guarantees separated from application-level revision durability | No optional SQLite snapshot API or Bun binding assumed |
| 2026-08-13 | Ran bounded v1 formula/containment carrier on generated SQLite data | Deterministic formula expansion, generic page accounting and temp DB close/reopen smoke recorded | Independent review rejected all candidate behavior/schema/restart and storage-comparison claims because candidates shared one behavior model and generic tables |
| 2026-08-13 | Built and ran V2 with four distinct positive shapes and two controls | Aggregate initial/final and close/reopen subclaims recorded; live-parent parent-mutation sensitivity detected | Review narrowed two overstated labels, row-count/provenance claims and control interpretation; no CAND-01/CAND-04 or W1-W5 evidence |

## Evidence Quality Check

- [x] Current-state observations trace to canonical docs, published issues,
  pinned primary code or official SQLite documentation.
- [x] Observations, hypotheses and candidate implications are separated.
- [x] V1 candidate claims are explicitly rejected and downgraded to formula,
  generic SQLite accounting and containment smoke.
- [x] No operator/runtime database, real conversation or production schema was
  read or changed.
- [x] Historical migration ambiguity remains owned by #28.
- [x] V2's frozen provenance/checksum scope and its missing sources/unexecuted
  cells are explicit; the carrier was not regenerated after review.
- [ ] Independent non-authoring review has checked source completeness, matrix
  symmetry, carrier fidelity, aggregate results and UC-003 no-full-copy
  interpretation; synthesis remains blocked until this is complete.
