Parent tracker: #17. EP-001 `EP-SI-04`.

Route: Bug Fix Flow.

Validation profile: `standard` — persisted fork semantics and potential
data-compatibility/migration impact require the standard evidence contract.
There is no active operational incident and this work does not mutate live data.

## Upstream invariant

DR-05 and active UC-003 require an immutable inherited prefix.

## Outcome

After fork creation, no later parent mutation may change the child's inherited
prefix. Appending unrelated parent work must not extend the child snapshot.

## Acceptance boundary

- parent edit, compaction, exclusion change, deletion and reordering cannot alter inherited content;
- child mutations affect only child-owned continuation;
- storage realization remains a downstream design/ADR decision.

## Reproduction record

- Expected: DR-05 and active UC-003 `BR-01`/`EX-02` require the inherited
  prefix of an existing child to remain unchanged.
- Actual: `getFullMessages()` recursively rereads the mutable parent prefix;
  editing or deleting a message inside that prefix changes the child's effective
  transcript.
- Environment: commit `d119f1c`, in-memory SQLite.
- Minimal steps: create parent, fork child at an offset, capture the child
  transcript, mutate/delete a message inside the inherited prefix, then observe
  that the child's transcript changed.
- Affected implementation: `src/session/fork.ts`,
  `src/session/getFullMessages.ts`.
- Regression carrier: `src/session/getFullMessages.test.ts`.
- Unknown: whether restoring the invariant requires a material storage/design
  decision or historical migration. If it does, stop the fix and reroute that
  downstream work; do not select a storage mechanism here.

This issue must not preserve the current live-parent reread as product semantics.
