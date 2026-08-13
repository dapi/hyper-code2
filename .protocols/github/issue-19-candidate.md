Parent epic: EP-001 `EP-SI-08`.

## Status

Parked implementation candidate. Do not start until #18 produces an accepted
secret non-transit contract and, when required, an accepted ADR.

## Candidate outcome

Inventory every applicable LLM-input, persistence and external-delivery boundary,
then split migration into bounded sink-level delivery units using the accepted
mechanism. Each new surface receives the same conformance gate incrementally.

## Candidate boundary inventory

- generated code/marker persistence;
- synthetic results/errors and next-turn LLM input;
- semantic events and diagnostics;
- rendered/cached HTML and browser delivery;
- search/export/copy surfaces;
- future journal, TUI, API or IPC only after those surfaces exist.

## Activation gate

- #18 decision accepted;
- target contract and failure behavior explicit;
- current sinks grounded in code;
- migration split and validation profile approved.

This issue does not assume that a canonical projector, branded type or secret
catalog is the selected design.
