Parent tracker: #17. EP-001 `EP-SI-04`.

## Upstream invariant

DR-05 and active UC-003 require an immutable inherited prefix.

## Outcome

After fork creation, no later parent mutation may change the child's inherited
prefix. Appending unrelated parent work must not extend the child snapshot.

## Acceptance boundary

- parent edit, compaction, exclusion change, deletion and reordering cannot alter inherited content;
- child mutations affect only child-owned continuation;
- destructive ancestor operations report affected descendants and fail safely;
- storage realization remains a downstream design/ADR decision.

This issue must not preserve the current live-parent reread as product semantics.
