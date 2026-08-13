# R-029 route/control reconciliation 2026-08-13-d119f1c-route-control-v2

This additive carrier reconciles all 36 committed-source dispatch entries at source baseline `d119f1c10381e489d9140c43f9fe9a878bf67255`. It does not replace the prior run `2026-08-13-d119f1c-static-mock`. The instrument opened no socket, read no real secret/home state, executed no handler side effect, and intercepted listener/runtime writes. Only this evidence carrier was written.

- `route-control-reconciliation.json`: per-entry caller-control evidence, immediate/deferred authority paths, and mock/test/static coverage.
- `dispatch-mock-results.json`: 108 synthetic dispatcher calls (36 entries times three identity variants).
- `shared-control-analysis.json`: exact-source analysis of listener, matcher and loader.
- `authority-coverage.json`: reconciliation of all nine authority classes and their timing.
- `provenance.json` and `SHA256SUMS`: snapshot, safety boundary and integrity metadata.
