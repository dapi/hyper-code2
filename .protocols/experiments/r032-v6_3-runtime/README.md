# R-032 V6.3 runtime-validator author package

Runtime-only additive author work at source HEAD `18ea94437390bcf822df0165f79246fab0da436e`.
It is not a freeze, carrier, collection result, sandbox claim, or architecture selection.

`runtime.ts` executes exactly 37 committed registrations through `loadRoutes`,
`match`, captured `$start.fetch`, the real POST handler, allowlisted in-memory
SQLite migrations, and `workerLoop`. It replaces production provider execution
with safe authority adapters for the same 9 × 16 matrix.

`validator.ts` derives expectations from each runtime row. It rejects incomplete,
duplicate, asymmetric, semantically altered, root-altered, cursor-altered, and
sink-altered results. Broker authority uses an injectable transport interface;
the in-memory implementation performs a JSON request/response round trip, owns
its decision and callable root, and binds request, response and root receipts.
Broker candidates never allocate a parent root.

Restart recovery closes and independently reconstructs an in-memory SQLite
authority store, records distinct before/after store identities, and rebinds the
persisted generation before worker use. This is a store-boundary fixture, not a
process-isolation claim. Sink names describe only the adapters actually used;
S7 is a persisted-event payload projection with HTML explicitly omitted, and
transcript rows are not claimed as rendered or model input.

The exact 37-entry source hashes are pinned by a validator digest. Detector
controls cover every governed R-018 form × nine sink adapters. The exported
carrier sanitizer accepts only the opaque, snapshotted token returned by the
validator, drops S0, serializes stable bytes, and rejects any remaining sentinel
form. It builds no carrier itself.

Verifier, policy and broker outages remain deterministic adapter failure
fixtures. They do not establish behavior of a production service failure.

No process is spawned and no OS containment is claimed.

Author-only check: `bun .protocols/experiments/r032-v6_3-runtime/self-test.ts`.
