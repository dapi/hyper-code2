# R-034 storage-v2 carrier

Bounded generated-data SQLite evidence only. Two internal result labels are
historical instrument IDs and must be read by their executed shapes:

- `immutable_revision` = **full-prefix version-reference snapshot**. Fork
  writes every effective inherited entry into a new `revision_entries` set; it
  is not a constant-size parent-revision reference.
- `cow_segments` = **full ordered root-entry snapshot**. Fork writes a full
  ordered `root_entries` set; it has no segment sharing or copy-on-write path.

The other executed shapes are materialized immutable-version references and an
append-only event cutoff. Full-copy and current live-parent implementations are
controls. V2 provides no evidence for planned CAND-01 immutable parent revision
or CAND-04 COW segments.

- `results.json` records final aggregate scenario checks, sanitized transcript
  digests, actual tables/indexes/plain row counts, SQLite pages and integrity
  results. It contains no referential-linkage query and no per-transition
  assertion record.
- `provenance.json` records the repository revision, instrument/source hashes,
  Bun/SQLite/platform environment and executed/unexecuted scope.
- `manifest.json` records positive-candidate and control outcomes.
- `SHA256SUMS` covers the three JSON artifacts.

The carrier executes root/full and mid-prefix forks, then all named parent and
child mutations, a nested fork and a real database close/reopen. Assertions are
over initial fork snapshots and aggregate final state, not each transition.
The live-parent `childMutationAndSiblingIsolation` failure is confounded by the
earlier parent mutation; it is not isolated evidence of child-to-sibling bleed.

It does not execute any candidate-valid W1-W5 growth workload, concurrent
writers, atomic competing fork/mutation interleavings, compaction/GC, retention,
corruption/cycle/dangling injection, missing-reference diagnostics, foreign-key
checks, rollback/backup, migration/backfill, or production event/action-pair
integration. Frozen `provenance.json` says only W4/W5; this README and governed
evidence record that omission as a provenance limitation rather than rewriting
the carrier after collection. Its frozen source hash set also omits the
exclusion migrations, `src/db/connect.ts`, `src/db/migrate.ts` and several plan
inputs, so it supports only the exact recorded source subset.
It is not production schema, latency, migration or design-selection evidence.
