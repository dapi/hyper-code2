# R-033 V5.2 executable staged collector

This additive clean-sheet collector replaces none of the rejected V1-V4.1
traces. Five separate candidate modules execute the symmetric `CC-01…14`
matrix in rotating order. The staged paths include inference, Kimi/Anthropic/
Codex refresh read → OAuth request → response → write with a failure gate at
every stage, claim-parsed synthetic Codex account identity, discovery success
and no-render failure, generated-code authority probes, S0-S8 layer controls,
and fail-before-durable CC-10 success/error/cycle paths.

`precollection-freeze.json` pins the exact HEAD, instrument, fixture, dependency,
complete claimed source/sink/authority set, platform/tool environment and child
environment-key contract. It supersedes rejected freeze `0ddad70a…` and is not
an approval token. `collector-runner.ts` checks a separate independent review
record and every frozen input before it creates disposable state or executes any
candidate cell. Without that review, the STOP gate terminates collection.

Refresh stages are injected functions observed by an external stage spy;
discovery transport and render are independently injected and counted; CC-14
uses seven distinct path-shaped adapters with per-path spies. A future collected
carrier must include `cross-candidate-controls.json` and bind its containment
and execution digests into provenance. These are design contracts only until a
new independent pre-collection review authorizes collection.

The first approved V5.1 collection under freeze `cac11c9e…` is rejected as a
diagnostic trace because CC-14 derived `deniedOrBounded` from detector-hit
occurrences rather than path outcomes, producing an impossible negative count.
V5.2 counts only path probes with zero detector hits, so the value is always
within `0..7`. No V5.2 collection is authorized until a new independent review
approves its exact freeze.

Self-tests execute the matrix only in memory to validate collector semantics.
They do not emit a stable candidate carrier. A signed pre-collection review is
required before running the contained child, and a separate post-collection
review is required before any result can enter evidence or synthesis. No real
credential, operator store, provider call, listener or production state is in
scope.
