---
title: "R-034: Research Plan"
doc_kind: research
doc_function: canonical
purpose: "Symmetric method and quality controls for comparing immutable fork storage representations."
derived_from:
  - brief.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-034: Research Plan

## Method

| Question / hypothesis | Method | Why this method fits | Quality threshold |
| --- | --- | --- | --- |
| `RQ-01`, `HYP-01…05` | Pinned code/schema review plus a candidate contract matrix | Separates confirmed current behavior from proposed representation properties | Every material current-state claim links to primary code or a durable issue trace |
| `RSC-02` | Deterministic synthetic state-machine scenarios | Makes mutation and nested inheritance outcomes comparable | Each candidate receives the same fork, append, edit, delete, reorder, exclusion and child-local operations or an explicit unsupported result |
| `RSC-03` | Bounded SQLite comparison instrument | Storage-growth claims are otherwise easy to bias by counting unlike entities | Fixed payload/workloads; logical content rows, reference/metadata rows and SQLite page bytes reported separately |
| `RSC-04` | Transaction/interleaving analysis, two-connection synthetic probes and close/reopen verification | Fork correctness depends on atomic boundary capture and durable historical lookup | No mixed pre/post mutation prefix, restart preserves the same child view, and failure mode is explicit |
| `RSC-05` | Migration/operability review without backfill | Keeps storage-contract research separate from historical-data research | Each candidate names schema/API surface, integrity checks, retention/GC, backup/rollback and legacy ambiguity handed to #28 |

## Sources or Sample

| Group / source | Inclusion and exclusion | Access boundary | Limitation |
| --- | --- | --- | --- |
| Durable contracts | [DR-05](../../domain/rules.md), [UC-003](../../use-cases/UC-003-fork-and-delegate.md), [PRD-002](../../prd/PRD-002-self-extending-agent-harness.md) | Repository read only | Defines required behavior, not storage mechanism |
| Trigger and sequencing | [#27](https://github.com/dapi/hyper-code2/issues/27), [#28](https://github.com/dapi/hyper-code2/issues/28), [#34](https://github.com/dapi/hyper-code2/issues/34), reproduction commit [`792a166`](https://github.com/dapi/hyper-code2/commit/792a166) | Published issue/commit records | #28 has no historical inventory yet |
| Current persistence implementation | Baseline migration, fork/save/getFullMessages and append/replace/delete/truncate/load paths at commit `680be81564f6192a7f147da9e3deada79357517e` | Static repository inspection | Runtime overlays and uncommitted production behavior excluded |
| SQLite semantics | Official isolation, transaction, foreign-key and integrity-check documentation | Public primary documentation | General engine guarantees do not prove application-level atomicity |
| Synthetic workloads | Generated messages and identifiers only; small scenario plus fixed growth matrix | Disposable databases under OS temp directory; never runtime DB paths | Not a production latency or workload distribution benchmark |

## Candidate-Neutral Contract Matrix

| Cell | Scenario | Required observation |
| --- | --- | --- |
| `CC-01` | Fork root at full and mid-prefix boundaries | Child inherits exactly the selected ordered prefix and owns only its continuation. |
| `CC-02` | Parent append after fork | Child prefix neither grows nor changes. |
| `CC-03` | Parent edit/delete/reorder/exclusion inside inherited prefix | Existing child remains byte/metadata equivalent to its fork-time view. |
| `CC-04` | Child append/edit/delete | Parent and siblings remain unchanged; only child-owned continuation changes. |
| `CC-05` | Nested fork from inherited plus local context | Grandchild boundary counts the parent's full effective transcript without flattening ownership into copied content. |
| `CC-06` | Parent compaction/materialization/retention | Historical references remain resolvable or the operation is rejected before invalidation. |
| `CC-07` | Concurrent append/mutation/fork interleavings | Fork commits one coherent revision and prefix, never a mixed or dangling state. |
| `CC-08` | Close and reopen database/process view | The same child transcript and ownership boundary are recovered. |
| `CC-09` | Missing/cyclic/dangling ancestry or version reference | Read or integrity check fails deterministically with diagnosable identity; no silent truncation. |
| `CC-10` | Legacy mutable `(agent_id, idx)` rows | Ambiguity is classified and handed to #28; no ancestry/version is invented. |

## Storage-Growth Workloads

Run every candidate with payload sizes `64` and `1024` bytes across:

- `W1`: 100 root messages, 1 fork at offset 100, 10 child-local messages;
- `W2`: 100 root messages, 32 sibling forks at offset 100, 10 local messages each;
- `W3`: depth-16 nested forks, 10 local messages at each level;
- `W4`: W2 plus 20 parent edits, 10 deletes and 10 exclusion/reorder changes;
- `W5`: repeat W2 at 1,000 root messages to expose prefix-linear metadata.

For V3, W3 uses 100 initial root messages as an orchestration normalization to
W1/W2. This is not a product/storage decision; sensitivity to another initial
root count remains unknown.

Report content/version/event rows, reference/segment/snapshot metadata rows,
fork metadata rows, total SQLite pages and `page_count × page_size`. Treat byte
results as carrier-specific evidence, not expected production capacity.

## Disposable Instrument Gate

The plan requires a disposable carrier because storage growth and restart
behavior cannot be reviewed reliably from schema sketches alone. The carrier
may implement simplified candidate-shaped schemas only when:

1. every candidate uses the same generated logical workload and payloads;
2. candidate-specific omissions are explicit rather than counted as success;
3. it never imports production session functions, reads `.hyper/_runtime`, or
   accepts an arbitrary database path;
4. it writes only into a newly created OS temporary directory and deletes it
   after recording sanitized aggregate results;
5. it claims structural/SQLite storage observations only, not latency,
   production fidelity or recommendation.

The initial carrier is intentionally bounded to `CC-01…05`, `CC-08` and
`W1…W3`; concurrency, compaction, corruption diagnostics and W4/W5 remain
static/planned cells until the carrier is independently reviewed.

## Identity And Boundary Questions To Record

- Stable logical message ID versus immutable message-version ID.
- Whether role, content, action-pair identity, exclusion flags and ordering are
  versioned together or by separate projections.
- Whether a prefix boundary names an ordinal, stable entry ID, revision/cutoff,
  immutable snapshot root or an ordered set of version references.
- Whether delete is a tombstone/versioned projection or physical removal, and
  what retention prevents referenced history from being collected.
- How nested ancestry cycles and maximum depth are detected and diagnosed.

## Controls

| Risk | Control | Owner |
| --- | --- | --- |
| Preferred-solution bias | Fixed candidate matrix including rejected/current controls; no recommendation before review | Research owner and independent reviewer |
| Incomparable storage counts | Same logical workload; separate content bytes, references and metadata; disclose schema simplifications | Instrument author and reviewer |
| Snapshot terminology ambiguity | Distinguish SQLite transaction snapshot, conversation revision, prefix materialization and COW snapshot root | Research owner |
| False concurrency confidence | Cite SQLite guarantees separately from application transaction design; record untested interleavings | Reviewer |
| Legacy invention | #28 owns inventory/backfill; R-034 records only required information and ambiguity classes | Decision owner |
| Production-state exposure | Synthetic generated data and temp databases only; no configurable input DB path | Instrument author |

## Operability And Migration Review

For each candidate record:

- normal read/fork/mutation query shape and required indexes;
- transaction boundary for capturing revision plus prefix;
- cycle/dangling-reference diagnostics and `integrity_check` /
  `foreign_key_check` implications;
- backup/rollback and forward-only migration consequences;
- retention, garbage collection, compaction and referenced-history protection;
- worst-case ancestry/read amplification and repair tooling needs;
- exact facts #28 would need from legacy agents/messages before safe migration.

## Stop Rules

- `STOP-01` Stop on any access to non-synthetic database state or any requested
  production schema/API change.
- `STOP-02` Stop synthesis if any candidate lacks a matrix cell, storage metric
  category or explicit `not measured` limitation.
- `STOP-03` Stop at evidence collection and request independent review; only the
  decision owner may authorize synthesis/recommendation and downstream ADR.

## Plan Approval

| Field | Value |
| --- | --- |
| Reviewer / decision owner | Danil Pismenny |
| Approval reference | [GitHub #34](https://github.com/dapi/hyper-code2/issues/34) authorizes technical discovery, a bounded stopping condition and no production implementation; independent method review pending |
