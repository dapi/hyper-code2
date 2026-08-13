# R-034 storage-v3 carrier

Frozen generated-data SQLite evidence for two previously unexecuted shapes:

- `constant_revision_ref`: immutable operation revisions reference an
  already-addressable parent revision and prefix. Fork adds one agent row with
  two reference/boundary values and no inherited prefix rows.
- `cow_structural_graph`: immutable persistent binary sequence graph. Full
  forks reuse the root; mid-prefix forks path-copy the split spine; local
  mutations publish a new root and retain shared unchanged subgraphs.

`results.json` contains two behavior/restart scenarios and 20 growth cases:
both shapes across W1-W5 at 64- and 1024-byte payloads. W3 uses 100 initial root
messages as an orchestration normalization to W1/W2, not a product/storage
decision; sensitivity to another initial count is unknown.

Results record plain table counts, two fork metadata cells per non-root agent,
SQLite pages/bytes, and `integrity_check`/`foreign_key_check`. They are
carrier-specific structural observations, not latency, production capacity, a
ranking, migration design or recommendation.

`provenance.json` freezes revision, selected source hashes, instrument hash,
environment, assumption and scope. `SHA256SUMS` covers the JSON artifacts. The
instrument accepts no database path, imports no production session code and
deletes its private OS-temp databases.

Unexecuted: concurrent/two-connection writer interleavings, compaction/GC and
retention, backup/rollback, corruption/cycle/dangling/missing-reference fault
injection and diagnostics, legacy inventory/migration/backfill, production
event/action-pair/UI integration, and latency/capacity measurement.
