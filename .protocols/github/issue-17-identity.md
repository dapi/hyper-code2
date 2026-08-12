Parent tracker: #17. EP-001 `EP-SI-03`.

## Outcome

Give persisted messages and result-producing action/result pairs stable identity
that does not depend on filtered array offsets, mutable adjacency or bulk row
renumbering.

## Acceptance boundary

- identity survives filtering, targeted update, archive and reload;
- action/result pairing remains explicit and cardinality is checked;
- existing routes retain a documented compatibility mapping;
- this issue does not choose fork storage or historical migration strategy.

Route through Feature Flow with a standard validation profile before implementation.
