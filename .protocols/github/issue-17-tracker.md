## Upstream contracts

- PRD-002
- active UC-002 and UC-003
- domain rules DR-02 and DR-05
- EP-001 `W2A`

## Required outcome

Restore stable transcript/action-result identity and a fork prefix that cannot
change after fork creation.

## Corrected invariant

No later parent update, compaction, deletion, reordering or projection change may
change content already inherited by an existing child. The storage mechanism
remains a downstream design decision; this tracker does not choose referenced
ancestry versus materialization.

## Workstreams

- stable transcript and marker/result identity: #26
- immutable fork inheritance and descendant-safe mutation: #27
- historical migration and integrity rollout: #28

## Completion

All workstreams satisfy active UC-002/003. Migration preserves ambiguous history
or fails safely instead of fabricating identity or fork membership.

## Non-goals

- execution journal;
- compact eval results;
- automatic descendant cascade;
- weakening immutable child inheritance to preserve the current live-parent implementation.
