---
title: "R-034: Immutable Fork Storage Contract"
doc_kind: research
doc_function: canonical
purpose: "Canonical decision question, boundaries and lifecycle state for immutable fork storage research."
derived_from:
  - ../../flows/research.md
  - ../../prd/PRD-002-self-extending-agent-harness.md
  - ../../use-cases/UC-003-fork-and-delegate.md
  - ../../domain/rules.md
status: active
research_status: collecting
audience: humans_and_agents
---

# R-034: Immutable Fork Storage Contract

## Intake

| Field | Value |
| --- | --- |
| Source / trigger | [GitHub #34](https://github.com/dapi/hyper-code2/issues/34), after the contract-change stop in [#27](https://github.com/dapi/hyper-code2/issues/27); historical migration remains [#28](https://github.com/dapi/hyper-code2/issues/28) |
| Research owner | Codex orchestration under Danil's repository-only, synthetic-data boundary |
| Decision owner | Danil Pismenny |
| Research mode | `technical_discovery` |
| Decision deadline / timebox | One fixed comparison matrix at commit `680be81564f6192a7f147da9e3deada79357517e`; stop for independent review before synthesis or design selection |

## Decision Question

- `RQ-01` Which persistent representation can preserve an immutable,
  prefix-bounded inherited transcript for nested forks while keeping each
  agent's continuation independently mutable and avoiding a full transcript
  copy?

## Working Hypotheses

- `HYP-01` An immutable parent revision plus a stable prefix boundary can
  satisfy UC-003 with constant-size fork metadata if historical message state
  remains addressable.
- `HYP-02` Materializing only references to immutable message versions can
  satisfy the behavior with simpler reads than revision reconstruction, at the
  cost of storage proportional to inherited prefix length per fork.
- `HYP-03` Append-only change events plus an immutable cutoff can preserve past
  state, but replay, compaction and retention contracts may dominate
  operability.
- `HYP-04` Copy-on-write immutable snapshots or segments can bound duplicated
  content while making edits and reads predictable, but add structural and
  garbage-collection complexity.
- `HYP-05` Stable logical message identity must be separate from immutable
  version identity; mutable `(agent_id, idx)` alone cannot name content at a
  historical fork boundary.

## Candidate Set

| ID | Candidate | Comparison boundary |
| --- | --- | --- |
| `CAND-01` | Immutable parent revision reference | Fork stores parent conversation revision plus a prefix boundary; append/edit/delete/exclusion/reorder create new immutable state. |
| `CAND-02` | Materialized immutable-version references | Fork stores ordered references to inherited immutable message versions, not copied message content. |
| `CAND-03` | Append-only conversation events plus cutoff | Fork stores parent stream/cutoff; historical state is replayed from immutable events and optional immutable checkpoints. |
| `CAND-04` | Copy-on-write immutable snapshot/segment graph | Fork reuses an immutable snapshot root; later mutations create only changed metadata/segments and preserve prior roots. |
| `CAND-05` | Full inherited-row copy control | Copies inherited message content into the child; retained only as a behavior/storage control and not contract-compatible with UC-003. |
| `CAND-06` | Current live-parent offset control | Stores mutable `parent_id` plus numeric `fork_offset`; retained only to reproduce the known failure. |

## Scope

- `RSC-01` Message identity, immutable version identity, order, prefix boundary,
  exclusion state and agent-local ownership semantics.
- `RSC-02` Root and nested forks, mid-conversation boundaries, child-local
  append/edit/delete, parent edit/delete/reorder/exclusion/compaction and
  descendant stability.
- `RSC-03` Storage growth under synthetic message, fork, mutation and nesting
  workloads; report logical rows/references and SQLite page bytes separately.
- `RSC-04` Atomic fork creation, concurrent append/mutation/fork races, process
  restart, integrity checks, diagnostics, backup/rollback and retention or
  garbage-collection implications.
- `RSC-05` Required schema/API contract changes and implications for a future
  migration, without classifying or rewriting historical rows.

## Non-Scope

- `RNS-01` Production `src/`, schema or migration changes; shared EP, protocol,
  PRD, use-case or ADR contract edits. Bounded navigation/trace links may be
  synchronized by their current owner without changing those contracts.
- `RNS-02` Selecting or accepting a design, opening delivery scope, or treating
  a synthetic carrier as production performance evidence.
- `RNS-03` Reading or mutating an operator/runtime database, real conversations,
  credentials or external state.
- `RNS-04` Historical inventory, ancestry inference, backfill or repair; those
  remain owned by [#28](https://github.com/dapi/hyper-code2/issues/28) after a
  storage contract is accepted.
- `RNS-05` Weakening DR-05 or UC-003's no-full-copy ownership boundary.

## Assumptions and Known Evidence

| ID | Statement | Type | Source / confidence |
| --- | --- | --- | --- |
| `EVD-01` | DR-05 requires a fixed inherited boundary; the current implementation gap is explicitly recorded. | Evidence | [Domain rules](../../domain/rules.md) |
| `EVD-02` | UC-003 requires immutable, prefix-bounded inheritance, independently owned continuation and assembly without a full transcript copy. | Evidence | [UC-003](../../use-cases/UC-003-fork-and-delegate.md) |
| `EVD-03` | The current bug is reproducible and stopped at a persistent-contract gate. | Evidence | [#27 contract-change trace](https://github.com/dapi/hyper-code2/issues/27#issuecomment-5276024063) |
| `ASM-01` | Message content is substantially larger than a reference in representative use, so content bytes and reference rows should be reported separately. | Assumption | Synthetic workloads test sensitivity; no production distribution is claimed |
| `ASM-02` | A design may use recursion for nested forks if depth, cycle detection and failure diagnostics remain explicit and bounded. | Assumption | Must be evaluated across all candidates |

## Material Unknowns

| Question | Blocks | Owner | Resolution evidence |
| --- | --- | --- | --- |
| Which identity/version boundary is sufficient for edits, deletes, reorder and exclusion without mutable historical lookup? | Recommendation | Research owner and independent reviewer | Complete behavior matrix and schema/API implication record |
| Can constant-size fork metadata remain operable under deep ancestry and compaction? | Candidate rating | Research owner | Nested-fork, restart and compaction observations |
| Is per-prefix reference materialization an acceptable interpretation of no full transcript copy? | Decision | Danil Pismenny | Explicit trade-off and UC-003 ownership review; research cannot decide this implicitly |
| What legacy rows have enough evidence for safe ancestry/version backfill? | Historical migration | #28 owner | Separate inventory after contract acceptance |

## Stopping Condition

- `STOP-01` Stop collection when every `CAND-*` has an attributable result for
  behavior, logical/physical storage growth, nested forks, edits/deletes,
  concurrency/restart, legacy ambiguity, operability and migration
  implications at the pinned revision.
- `STOP-02` Stop before synthesis until an independent non-authoring reviewer
  checks source completeness, matrix symmetry, carrier limitations and the
  UC-003 no-full-copy boundary.
- `STOP-03` Stop immediately if any command would access a non-synthetic
  database or if evidence requires changing production code/schema/migrations.

## Boundary Check

- [x] Questions and hypotheses are separate from findings.
- [x] Known facts have clickable sources; candidate claims remain hypotheses.
- [x] No production mechanism, ADR decision, delivery scope or implementation
  sequence is selected.
- [x] Access is limited to repository sources, official documentation and
  disposable synthetic SQLite databases.
