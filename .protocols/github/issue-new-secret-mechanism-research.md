Parent epic: EP-001. Follow-up to terminal research #18; implementation
candidate #19 remains parked.

## Route

Research & Discovery (`technical_discovery`). This issue compares candidate
enforcement mechanisms; it does not implement or select production architecture.

## Decision question

Which mechanism or combination preserves authenticated provider transport while
preventing secret values from entering agent-executable inputs, model system or
message content, action results/errors, persistence, rendering, diagnostics and
other external sinks?

Decision owner: Danil Pismenny.

## Candidates compared symmetrically

1. Opaque references plus a credential-owning provider broker.
2. Source exclusion from agent-readable settings, context and capability results.
3. Bounded projection with explicit schemas for model/result/persistence sinks.
4. Sink redaction with declared-secret provenance.
5. Combinations of the above, including broker + source exclusion + bounded
   projection, with redaction treated as defense in depth rather than assumed
   sufficient by itself.

## Required evidence

- code-grounded source -> authority -> provider-transport -> sink inventory;
- one finite, identical conformance matrix per candidate and combination;
- deterministic non-secret sentinel only, with positive and negative controls;
- success, error, serialization failure, retry/cancellation and restart cells
  where the reviewed code path supports them;
- preservation of provider request semantics without a real provider call;
- compatibility with current OpenAI, Anthropic, Responses and subscription-token
  adapter shapes, classified as pass / bounded adaptation / incompatible;
- composition criteria covering identity, provenance, revocation, lifetime,
  concurrency, observability and failure propagation;
- fail-closed behavior for unknown reference, unavailable broker, classification
  loss, projection mismatch, redaction failure and retry/restart;
- independent review of inventory and carrier before synthesis.

## Safety boundary

Static inspection and disposable mock/prototype experiments only. No real
credentials, credential-store reads, provider/network calls, public listener,
shared state or production code changes. Agent-executable children receive no
provider authentication material. Stop immediately on containment failure,
unexpected network/filesystem access, sentinel transit to a prohibited sink or
loss of provenance.

## Decision rule and ADR trigger

No candidate can be recommended without symmetric evidence against the same
matrix. A clean result is bounded to the reviewed inventory and recorded commit.
If the preferred mechanism changes the global provider boundary, credential
ownership, cross-module data contract, persistence schema or runtime process
topology, create a proposed ADR after Danil accepts the research disposition and
before activating #19.

## Stopping condition

Stop when every candidate has an attributable result for the finite matrix and
Danil can accept one mechanism/combination, reject all candidates, or request a
named additional evidence cell. Stop earlier if the matrix or containment cannot
support a symmetric comparison.

## Outputs

- governed `memory-bank/research/R-<issue>/` package;
- sanitized checksummed evidence carrier;
- recommendation with confidence, compatibility and residual gaps;
- proposed ADR trigger/handoff when applicable;
- bounded activation recommendation for #19, never implicit implementation.
