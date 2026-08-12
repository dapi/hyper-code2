Parent tracker: #17. EP-001 `EP-SI-05`.

## Decision question and outcome

Define and deliver a safe historical migration only after the stable identity and
immutable fork contracts are fixed. Ambiguous legacy rows or boundaries must be
preserved with diagnostics or fail migration safely; they must not be silently
paired, dropped or turned into executable pending work.

## Required evidence before delivery

- inventory of historical message/result/fork shapes;
- backup and rollback contract;
- ambiguity classification;
- production-equivalent SQLite integrity behavior;
- chosen migration design and standard validation profile.

Route through Research first if the inventory cannot determine a safe migration.
