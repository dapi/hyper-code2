Parent epic: EP-001 `EP-SI-09`.

## Decision question

Does separating diagnostics from a compact LLM-visible result materially improve
representative tasks without hiding information needed for correctness or recovery?

## Trigger

Run only if the UC-005 experiment shows that diagnostic/result coupling is a
material source of context cost or failure. The first live run showed repeated
discovery/introspection cost, not evidence for the old 50% target.

## Method

Compare current results with separated diagnostics/compact output on fixed
fixtures. Measure model-visible bytes/tokens, exact answer preservation,
debugging loss, errors and extra turns.

## Output

Evidence-backed `adopt / revise / reject / defer` recommendation. Production
implementation, exact `result(value)` API and a numeric target require a separate
delivery/design decision.
