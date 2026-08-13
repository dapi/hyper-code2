---
title: "R-033: Research Plan"
doc_kind: research
doc_function: canonical
purpose: "Symmetric method, safety controls and decision criteria for secret non-transit candidate comparison."
derived_from:
  - brief.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-033: Research Plan

## Method

| Question / hypothesis | Method | Why this method fits | Quality threshold |
| --- | --- | --- | --- |
| `RQ-01`, `HYP-01…03` | Code-grounded authority/data-flow inventory plus disposable mock prototypes | Separates mechanism behavior from provider and credential-store effects | Every candidate is evaluated against the same source, adapter, outcome and sink cells at one recorded commit |
| `HYP-04` | Deterministic synthetic-sentinel conformance matrix | Makes prohibited transit and required transport placement observable without a real secret | Negative and positive controls pass; every cell has an attributable pass/fail/incompatible result and sanitized checksum |
| `RQ-01` | Compatibility and composition scoring followed by independent review | Avoids selecting solely on leakage checks | Provider semantics, caller impact, fail-closed behavior and residual authority are explicit for every candidate |

## Sources or Sample

| Group / source | Inclusion and exclusion | Access boundary | Limitation |
| --- | --- | --- | --- |
| R-018 accepted boundary | [Decision](../R-018/decision.md), [evidence](../R-018/evidence.md) and the four prohibited sink classes | Repository read only | Establishes current-route non-conformance, not candidate quality |
| Credential and endpoint resolution | [`resolveEndpoint.ts`](../../../src/llm/resolveEndpoint.ts), declared provider settings and refresh functions | Static inspection only; never call a real resolver against operator state | Dynamic overlays and future providers remain outside the sample |
| Provider transport | [`streamOpenAI.ts`](../../../src/llm/streamOpenAI.ts), [`streamAnthropic.ts`](../../../src/llm/streamAnthropic.ts), [`streamCodex.ts`](../../../src/llm/streamCodex.ts), [`llmCall.ts`](../../../src/agent/llmCall.ts) | Fixed local capture function; `fetch` throws if reached | Mock semantics cannot prove remote acceptance |
| Subscription refresh sources and sinks | [`refreshKimiCode.ts`](../../../src/llm/refreshKimiCode.ts), [`refreshClaudeCode.ts`](../../../src/llm/refreshClaudeCode.ts), [`refreshCodex.ts`](../../../src/llm/refreshCodex.ts), and their direct stream/LLM callers | Static inspection plus synthetic in-memory adapters only; no filesystem/keychain command or OAuth request may execute | Platform keychain behavior and remote refresh acceptance remain untested |
| Model discovery transport | [`listModels.ts`](../../../src/llm/listModels.ts) and [`$route_new_GET.ts`](../../../src/agent/$route_new_GET.ts) | Static inspection plus fixed capture of a synthetic bearer request; all actual fetches throw | Covers the committed model-discovery route, not future discovery surfaces |
| Generated context and direct data authority | [`$main.ts`](../../../src/$main.ts), [`$type_Context.ts`](../../../src/$type_Context.ts), [`loadFns.ts`](../../../src/loadFns.ts), [`genTypes.ts`](../../../src/genTypes.ts), [`ctx_ns.d.ts`](../../../src/ctx_ns.d.ts), [`repl/eval.ts`](../../../src/repl/eval.ts), [`settings/get.ts`](../../../src/settings/get.ts), [`settings/getString.ts`](../../../src/settings/getString.ts), [`settings/list.ts`](../../../src/settings/list.ts), [`db/select.ts`](../../../src/db/select.ts) | Read-only inspection plus synthetic adapters only; do not read process env values, DB rows, files or keychains | Static callability and fixtures cannot prove OS isolation on every platform |
| Agent/result sinks | [`buildLlmRequest.ts`](../../../src/agent/buildLlmRequest.ts), [`executeMarker.ts`](../../../src/agent/executeMarker.ts), session append functions and [`renderEventHtml.ts`](../../../src/agent/renderEventHtml.ts) | In-memory/disposable persistence and sanitized captured projections | Unknown telemetry and provider-side sinks excluded |

## Common Candidate Contract

A candidate passes only when all applicable common cells pass. An
`incompatible` result is evidence, not a skipped cell.

1. The sentinel is available at the privileged provider-transport injector.
2. The emitted mock request preserves URL, method, body and non-secret headers
   for the adapter fixture; the authentication header has the expected scheme
   and sentinel digest at the privileged boundary.
3. Raw and declared sentinel forms are absent from agent-visible context,
   callable results, model system/messages/body, action success/error output,
   persisted messages/events/scratchpad, rendered HTML, diagnostics and the
   sanitized carrier.
4. An unknown, revoked, expired or unavailable credential reference fails before
   provider dispatch and emits only a stable non-secret error code.
5. Retry, cancellation and restart do not duplicate, persist, log or return the
   credential value and do not silently fall back to an ambient source.
6. Agent-generated code cannot obtain the value through the root context,
   registry procedures, raw settings/SQL access, filesystem helpers, shell or
   keychain commands; candidate mediation exposes only the least-authority
   reference or projection required by the approved operation.

## Finite Symmetric Matrix

Run `CC-01…CC-14` for each `CAND-01…05`. Use the same fixture identifiers,
sentinel forms and sink assertions; do not add a candidate-specific success cell
without adding its meaningful equivalent or explicit `incompatible` result to
every candidate.

| Cell | Fixture / event | Required observation |
| --- | --- | --- |
| `CC-01` | No-sentinel negative control | Zero detector hits in every layer. |
| `CC-02` | Detector and transport positive controls | Each declared sentinel form is detected; privileged transport capture proves correct auth placement without retaining the raw value. |
| `CC-03` | OpenAI-compatible bearer adapter success | Common contract passes; request body semantics match control. |
| `CC-04` | Anthropic `x-api-key` adapter success | Common contract passes; request body semantics match control. |
| `CC-05` | Anthropic/OAuth bearer lazy-refresh shapes | Kimi file and Claude keychain read/refresh/write contracts are represented by synthetic adapters; common contract passes and raw tokens, refresh responses and write payloads reach only the privileged boundary. |
| `CC-06` | Responses/Codex bearer, file-backed refresh and account-identity derivation | Codex read/refresh/write contract is represented by a synthetic adapter; common contract passes using a fixture token with no real identity and derived non-secret identity is handled explicitly. |
| `CC-07` | Unknown/revoked/expired reference | Fail closed before dispatch with non-secret stable error. |
| `CC-08` | Broker/resolver unavailable or timeout | Fail closed; no ambient fallback, retry leak or partial request. |
| `CC-09` | Projection/classification loss or schema mismatch | Fail closed before persistence, render or dispatch. |
| `CC-10` | Action success, thrown error and serialization failure | No prohibited sink hit in any supported outcome; unsupported outcomes are recorded as `not applicable` with code evidence. |
| `CC-11` | Retry/cancellation | Reuse is bounded; no raw credential enters retry state, errors or diagnostics. |
| `CC-12` | Disposable process restart | Revocation/lifetime rules persist or fail closed; no raw credential is recovered from agent-owned state. |
| `CC-13` | Model discovery and `GET /agent/new` caller | Synthetic Codex bearer may reach only the privileged discovery transport; returned model identifiers and rendered form are non-secret, and refresh/discovery failures do not expose or persist token material. |
| `CC-14` | Direct agent-authority probes | Generated code receives no raw synthetic secret from copied environment, `settings.get`, `settings.getString`, `settings.list`, arbitrary `db.select`, file read or keychain-command adapter. Each path is absent or returns only an authorized opaque reference/bounded projection; denial diagnostics remain non-secret. |

## Candidate-Specific Prototype Boundary

| Candidate | Minimal disposable prototype | Disqualifying observation |
| --- | --- | --- |
| `CAND-01` | Broker accepts opaque provider/credential reference and mock request; returns sanitized response metadata | Agent child can resolve/read the value, broker accepts an unbound reference, or failure falls back to ambient auth |
| `CAND-02` | Agent context omits secret descriptors/values and privileged transport resolver is injected separately | Any agent-callable path returns the value, or exclusion prevents required transport with no bounded adaptation |
| `CAND-03` | Explicit schemas project provider config and each prohibited sink payload | Unknown field/classification is passed through, or schema failure occurs after an unprojected write/send |
| `CAND-04` | Provenance-tagged fixture crosses each sink redactor | Value remains available to agent authority, a transform evades declared detectors, or redactor failure writes/sends original data |
| `CAND-05` | Broker + exclusion + projection; redaction applied only as an additional sink control | Components lose identity/provenance at composition boundaries or failure of one control silently bypasses another |

## Compatibility And Composition Criteria

Rate every candidate `pass`, `bounded adaptation`, or `incompatible`, with code
and carrier references for each criterion:

- all sampled authentication schemes and body formats;
- current `resolveEndpoint` and stream caller contract impact;
- lazy refresh, expiry, revocation and account-identity derivation;
- opaque reference identity, scope, lifetime and non-reuse across providers;
- concurrency, cancellation, retry and process restart;
- deterministic non-secret diagnostics and operator observability;
- persistence/schema and runtime-topology change;
- ability to compose without exposing raw values between controls.

`bounded adaptation` must name the changed contract and validation surface. It
cannot hide a failed non-transit assertion.

## Fail-Closed Rules

- Unknown reference, broker unavailable/timeout, revoked/expired credential,
  classification loss, projection mismatch, redaction exception, serialization
  failure and restart ambiguity all fail before provider dispatch or durable
  write.
- No candidate may fall back to `ctx.env`, process environment, settings rows,
  operator-home credential files or keychains after its controlled resolver fails.
- Errors expose only stable codes and non-sensitive provider/reference identity.
- Partial transport construction is discarded; retry requires a fresh bounded
  resolution and cannot persist the raw credential.
- Refresh-response bodies, credential paths, keychain command arguments and
  credential write payloads are secret-bearing sinks. Candidate diagnostics may
  expose only stable codes; model discovery cannot bypass the same boundary.
- Denying a transport/result sink is insufficient if generated code can obtain
  the value directly from `ctx.env`, settings, SQL, filesystem or keychain
  authority. Unknown direct reads fail closed without ambient fallback.

## Collection Protocol

1. Pin commit, instrument digest, platform and complete source/authority/sink map.
2. Obtain independent inventory review before candidate injection.
3. Start a disposable agent child with minimal environment, no credential/home
   access, denied network/listener and an enforced disposable write root.
4. Run `CC-01` and `CC-02`; abort on control failure.
5. Run `CC-03…14` for each candidate in rotating order to reduce harness-order
   bias. A candidate failure is retained and remaining candidates continue only
   if containment and provenance remain intact.
6. Capture only request semantics, auth scheme, sentinel digest/presence booleans,
   sink hit metadata and stable error codes. Never persist a raw auth header.
7. Generate per-cell checksums and a cross-candidate comparison manifest.
8. Independent reviewer verifies carrier, symmetry and source/sink completeness
   before synthesis begins.

### Rejected V4.1 And Next Pre-Collection Gate

The V4.1 preflight is frozen in
[`r033-v4/precollection-freeze.json`](../../../.protocols/experiments/r033-v4/precollection-freeze.json).
Independent review rejected it because the candidate matrix and staged operation
paths were not executable end to end. It remains preflight evidence only and
cannot be reviewed into approval without replacing the missing collector.

Before any collection, the replacement must execute all `CC-01…14` rows for all
five candidates in rotating order. `CC-10` success, throw and cyclic values must
use the actual candidate serialization path and a `DurableSpy`, proving zero
writes on every secret/error path. Kimi, Anthropic and Codex refresh must expose
separately injectable read, OAuth-request, OAuth-response and write stages;
failure at one stage must prove that later stages did not run. Codex account
identity requires a synthetic claim parser. Discovery failure must produce no
render call, while success must carry only non-secret IDs into render.

The collector itself must run in the reviewed disposable containment, rotate
candidate order, and emit sanitized per-cell results and checksums bound to exact
HEAD/platform/source/dependency/instrument/fixture hashes and containment
receipts. Independent pre-collection review signs that executable design; a
separate post-collection review signs the produced carrier. Until then,
collection is unauthorized and R-033 remains `collecting` with no synthesis.

## Controls

| Risk | Control | Owner |
| --- | --- | --- |
| Preferred-solution bias | Identical matrix, rotating execution order and explicit incompatible results | Research owner; independent reviewer |
| False clean result | R-018 S0-S8 detector controls plus per-layer positive controls | Experiment operator |
| Harness accidentally becomes broker proof | Mock-only transport and bounded claims; production topology remains undecided | Decision owner |
| Real credential or network access | Synthetic fixtures, throwing `fetch`, empty credential environment, denied network and home probes before injection | Experiment operator and reviewer |
| Redaction overclaim | Agent-authority probe is mandatory; sink-only success cannot satisfy common contract | Independent reviewer |
| Inventory drift | Pin commit and stop/review if an inventoried file changes | Research owner |

## ADR Trigger

After symmetric evidence and Danil's decision, create a **proposed** ADR before
delivery if the recommended candidate changes any of:

- global credential ownership or provider-transport trust boundary;
- runtime process/service topology or IPC contract;
- cross-module endpoint/provider configuration types;
- persisted secret/reference schema, lifecycle or migration;
- global error/fail-closed policy shared by multiple provider adapters.

The ADR is not created merely because a prototype exists. #19 stays parked until
the research disposition and any required ADR are accepted.

## Stop Rules

- `STOP-01` Stop on any safety, containment, provenance or control failure.
- `STOP-02` Stop synthesis if a candidate lacks an equivalent `CC-*` result or
  the inventory has not received independent review.
- `STOP-03` Stop the planned cycle when `CC-01…14 × CAND-01…05` is attributable,
  or record `inconclusive` if the fixed matrix cannot support comparison.

## Plan Approval

| Field | Value |
| --- | --- |
| Reviewer / decision owner | Danil Pismenny |
| Approval reference | 2026-08-13: approved the proposed next sequence and instructed the orchestrator to act; static/mock/prototype work only, no real secrets/network or mechanism selection without symmetric evidence |
