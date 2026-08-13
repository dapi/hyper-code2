---
title: "R-033: Evidence Log"
doc_kind: research
doc_function: canonical
purpose: "Traceable code-grounded inventory and contained synthetic evidence for secret non-transit candidate comparison."
derived_from:
  - brief.md
  - plan.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-033: Evidence Log

This log contains the reviewed static inventory and rejected or downgraded
instrument/carrier attempts through V4.1. None supports candidate conformance,
ranking or a mechanism decision. R-033 remains `collecting`; an executable
staged collector satisfying the updated gate below is required.

## Sources

| ID | Source / provenance | Date / freshness | Collection context | Access / quality note |
| --- | --- | --- | --- | --- |
| `SRC-01` | [R-018 terminal decision](../R-018/decision.md) and [synthesis](../R-018/synthesis.md) | 2026-08-13 | Read terminal governed package | Accepted bounded current-route finding; mechanism-neutral |
| `SRC-02` | [`resolveEndpoint.ts`](../../../src/llm/resolveEndpoint.ts) at published commit `06ae8df` | 2026-08-13 | Read-only static inspection; this file matches the published baseline | Primary code; dynamic overlays excluded |
| `SRC-03` | [`streamOpenAI.ts`](../../../src/llm/streamOpenAI.ts), [`streamAnthropic.ts`](../../../src/llm/streamAnthropic.ts), [`streamCodex.ts`](../../../src/llm/streamCodex.ts), [`llmCall.ts`](../../../src/agent/llmCall.ts) at published commit `06ae8df` | 2026-08-13 | Read-only provider-adapter inspection; these files match the published baseline | Primary code; no provider call or credential resolution executed |
| `SRC-04` | [`buildLlmRequest.ts`](../../../src/agent/buildLlmRequest.ts) and [`executeMarker.ts`](../../../src/agent/executeMarker.ts) at published commit `06ae8df` | 2026-08-13 | Read-only model/result data-flow inspection; these files match the published baseline | Primary code for sampled paths only |
| `SRC-05` | [Trust and security boundary](../../engineering/security-boundary.md) | 2026-08-13 | Canonical contract review | Durable authority contract; code owns exact implementation |
| `SRC-06` | [`refreshKimiCode.ts`](../../../src/llm/refreshKimiCode.ts), [`refreshClaudeCode.ts`](../../../src/llm/refreshClaudeCode.ts), [`refreshCodex.ts`](../../../src/llm/refreshCodex.ts) at published commit `06ae8df` | 2026-08-13 | Read-only static inspection only; files match the published baseline | Primary code; no function, filesystem/keychain command or OAuth request executed |
| `SRC-07` | [`listModels.ts`](../../../src/llm/listModels.ts) and [`$route_new_GET.ts`](../../../src/agent/$route_new_GET.ts) at published commit `06ae8df` | 2026-08-13 | Read-only discovery/caller inspection; files match the published baseline | Primary code; no local or external model request executed |
| `SRC-08` | [`streamAnthropic.ts`](../../../src/llm/streamAnthropic.ts), [`streamCodex.ts`](../../../src/llm/streamCodex.ts), [`llmCall.ts`](../../../src/agent/llmCall.ts) and generated [`ctx_ns.d.ts`](../../../src/ctx_ns.d.ts) at published commit `06ae8df` | 2026-08-13 | Read-only direct-caller and callable-registry inspection | Generated registry establishes callable exposure, not caller intent or runtime invocation |
| `SRC-09` | [`$main.ts`](../../../src/$main.ts), [`$type_Context.ts`](../../../src/$type_Context.ts), [`loadFns.ts`](../../../src/loadFns.ts), [`genTypes.ts`](../../../src/genTypes.ts), [`repl/eval.ts`](../../../src/repl/eval.ts) and [`executeMarker.ts`](../../../src/agent/executeMarker.ts) at published commit `06ae8df` | 2026-08-13 | Read-only context-construction and generated-eval authority inspection; files match baseline | Primary code; generated code was not executed |
| `SRC-10` | [`settings/get.ts`](../../../src/settings/get.ts), [`settings/getString.ts`](../../../src/settings/getString.ts), [`settings/list.ts`](../../../src/settings/list.ts), [`db/select.ts`](../../../src/db/select.ts) and generated [`ctx_ns.d.ts`](../../../src/ctx_ns.d.ts) at published commit `06ae8df` | 2026-08-13 | Read-only settings/database authority inspection; files match baseline | No environment value, database row or setting value was read |
| `SRC-11` | [Rejected first instrument](../../../.protocols/experiments/r033-contained-comparison.ts) and [containment/case-plan child](../../../.protocols/experiments/r033-contained-child.ts) | 2026-08-13 | Deterministic dry run after inventory sign-off | Valid only for bounded containment and case-plan accounting; parent-generated candidate outcomes were rejected |
| `SRC-12` | [Downgraded dry-run carrier](../../../.protocols/experiments/runs/R-033/2026-08-13-contained-symmetry-v1/README.md), [containment](../../../.protocols/experiments/runs/R-033/2026-08-13-contained-symmetry-v1/containment.json) and [summary](../../../.protocols/experiments/runs/R-033/2026-08-13-contained-symmetry-v1/summary.json); integrity manifest: `SHA256SUMS` in the same carrier | 2026-08-13 | Containment plus five-by-fourteen schema/accounting dry run | Its candidate pass/fail and compatibility outputs are explicitly not evidence |
| `SRC-13` | [Executable adapter library](../../../.protocols/experiments/r033-executable-adapters.ts), [contained child](../../../.protocols/experiments/r033-executable-child.ts) and [sanitizing parent](../../../.protocols/experiments/r033-executable-comparison.ts) | 2026-08-13 | Minimal disposable adapter execution over the finite matrix and injected-leak controls | Primary executable instrument; independent adapter-fidelity review pending |
| `SRC-14` | [Additive executable carrier](../../../.protocols/experiments/runs/R-033/2026-08-13-executable-adapters-v2/README.md), [results](../../../.protocols/experiments/runs/R-033/2026-08-13-executable-adapters-v2/results.json), [controls](../../../.protocols/experiments/runs/R-033/2026-08-13-executable-adapters-v2/controls.json), [summary](../../../.protocols/experiments/runs/R-033/2026-08-13-executable-adapters-v2/summary.json) and [provenance](../../../.protocols/experiments/runs/R-033/2026-08-13-executable-adapters-v2/provenance.json); integrity manifest: `SHA256SUMS` in the same carrier | 2026-08-13 | Adapter methods executed in a separate sandboxed child; parent sanitizes executed state | Mechanism-shaped disposable evidence only; no production fidelity claim |
| `SRC-15` | [V3 semantic adapters](../../../.protocols/experiments/r033-v3-semantics.ts), [contained matrix child](../../../.protocols/experiments/r033-v3-child.ts), [restart child](../../../.protocols/experiments/r033-v3-restart-child.ts) and [carrier parent](../../../.protocols/experiments/r033-v3-comparison.ts) | 2026-08-13 | Candidate-distinct CC semantics plus separate restart execution | Primary executable instrument; independent fidelity review pending |
| `SRC-16` | [Rejected V3 carrier](../../../.protocols/experiments/runs/R-033/2026-08-13-semantic-adapters-v3/README.md), [summary](../../../.protocols/experiments/runs/R-033/2026-08-13-semantic-adapters-v3/summary.json) and [provenance](../../../.protocols/experiments/runs/R-033/2026-08-13-semantic-adapters-v3/provenance.json) | 2026-08-13 | Attempted semantic matrix | Rejected: shared mechanism core, incomplete mediated refresh/discovery/layer/serialization semantics, and provenance no longer matches current instrument |
| `SRC-17` | [Rejected V4.1 pre-collection instrument](../../../.protocols/experiments/r033-v4/README.md) and [freeze manifest](../../../.protocols/experiments/r033-v4/precollection-freeze.json), freeze SHA-256 `01ecc10bea2a8657679c9d4fc8eb560ef9466194e875fc68cf4f06ffdd39e7c2` | 2026-08-13 | Instrument design and safety-control preflight only | Rejected before collection: no executable staged CC-01…14 collector or candidate-result carrier exists; no inference, refresh or discovery candidate matrix was collected |

## Observations

| ID | Observation | Supporting `SRC-*` | Applies to | Interpretation boundary |
| --- | --- | --- | --- | --- |
| `OBS-01` | `resolveEndpoint` returns `apiKey` in the same object as URL, provider, API kind and model ID. Declared settings, environment-backed settings and two operator-home credential files are among its current resolution paths. | [SRC-02](../../../src/llm/resolveEndpoint.ts) | `RQ-01`, caller compatibility | Static reachability does not prove a candidate cannot change the contract. No actual value or home file was read. |
| `OBS-02` | Current adapters apply credentials at request construction using OpenAI bearer, Anthropic `x-api-key` or bearer, and Responses bearer forms; lazy subscription refresh and account-ID derivation add distinct compatibility behavior. | [SRC-03](../../../src/llm/streamOpenAI.ts) | `RSC-01`, `CC-03…06` | Static inspection does not prove remote provider acceptance or exhaust future adapter behavior. |
| `OBS-03` | `buildLlmRequest` calls `resolveEndpoint` to branch on provider identity, while `executeMarker` copies action output into an event, rendered result HTML and a synthetic user message. | [SRC-04](../../../src/agent/buildLlmRequest.ts), [SRC-01](../R-018/evidence.md) | Agent authority and prohibited sinks | This identifies comparison seams and sampled sinks; it does not establish an enforcing mechanism. |
| `OBS-04` | The canonical boundary states that generated eval and shell share server-process authority and provider credentials may be available to that process. | [SRC-05](../../engineering/security-boundary.md) | `RQ-01`, common candidate contract | A disposable prototype can test separation semantics but cannot retroactively make the current server an adversarial sandbox. |
| `OBS-05` | Kimi refresh reads and may rewrite a home credential JSON file and device identifier; Claude refresh reads and may rewrite a macOS keychain item; Codex refresh reads and may rewrite a home auth JSON file. Each returns a raw access-token string to its caller. | [SRC-06](../../../src/llm/refreshKimiCode.ts) | `RSC-05`, `CC-05…06` | Static code paths only. No file, keychain or environment secret value was accessed. |
| `OBS-06` | All three refresh procedures may send a refresh token to an external OAuth endpoint. Their failure/success diagnostics can include a credential path or bounded remote response content, and refreshed credential payloads may be written back to operator-owned stores. | [SRC-06](../../../src/llm/refreshClaudeCode.ts) | Fail-closed and sink inventory | This identifies potential source/sink classes; it does not claim any diagnostic currently contains a real token. No request or command ran. |
| `OBS-07` | The generated function registry exposes all three refresh procedures and `listModels` through shared `ctx.fns.llm`; direct callers include Anthropic/Codex streamers, `llmCall` and `listModels`. Under the current shared-process authority, generated eval can address registered procedures. | [SRC-08](../../../src/ctx_ns.d.ts), [SRC-05](../../engineering/security-boundary.md) | Agent-executable authority map | Static callability does not establish that a model has invoked these functions; it establishes a candidate conformance seam that must be removed or mediated. |
| `OBS-08` | `listModels` calls `refreshCodex`, then sends the returned bearer token to an external Codex models endpoint; it also calls `refreshClaudeCode` to decide whether to expose a curated model. The new-agent GET route directly calls `listModels` and renders returned non-secret model identifiers. | [SRC-07](../../../src/llm/listModels.ts), [SRC-08](../../../src/llm/refreshCodex.ts) | `CC-13`, compatibility map | No model-discovery request was executed. This path is distinct from inference transport and must not become a credential-boundary bypass. |
| `OBS-09` | `streamCodex` retries the same bearer-bearing request on selected status/network failures, while refresh functions can perform their own OAuth request and credential-store write before inference transport. | [SRC-03](../../../src/llm/streamCodex.ts), [SRC-06](../../../src/llm/refreshCodex.ts) | `CC-08`, `CC-11`, composition behavior | Static retry semantics do not establish provider behavior; candidate prototypes must represent refresh and inference/discovery failure phases separately. |
| `OBS-10` | Runtime startup copies the complete process environment into `ctx.env`; the `Context` passed to generated eval exposes `env`, shared `state`, routes and the generated function registry. `executeMarker` invokes that eval with the same root context. | [SRC-09](../../../src/$main.ts) | `RSC-06`, `CC-14` | Static construction proves reachability in the current design, not that a model has read a particular value. No environment values were inspected. |
| `OBS-11` | `settings.get` returns parsed raw DB values or declared environment/default values; `getString` returns the string unchanged; `settings.list` returns parsed values even when `isSecret` is true. All are generated `ctx.fns.settings` procedures. | [SRC-10](../../../src/settings/get.ts) | `RSC-06`, `CC-14` | This is direct value authority, independent of provider transport and downstream redaction. No setting was queried. |
| `OBS-12` | Generated `ctx.fns.db.select` accepts caller-provided SQL and returns result rows from the shared database. Because eval receives `ctx`, a sink-clean candidate still fails non-transit if this or shared `ctx.state` exposes synthetic secret storage. | [SRC-10](../../../src/db/select.ts), [SRC-09](../../../src/repl/eval.ts) | `RSC-06`, `CC-14` | Static function authority only; no SQL was executed and no database content was inspected. |
| `OBS-13` | The same generated-eval authority runs in the server process whose file helpers, shell and credential access are intentionally not an adversarial sandbox. Excluding refresh procedures alone therefore cannot establish source exclusion for file/keychain credentials. | [SRC-05](../../engineering/security-boundary.md), [SRC-09](../../../src/repl/eval.ts) | `CAND-02`, `CAND-05`, `CC-14` | This is a current authority constraint, not evidence that every candidate must use a particular process topology. |
| `OBS-14` | Before synthetic injection, a separate child with an exact six-key environment and no auth-like keys passed the recorded deny-default probes for an operator-home file path, login-keychain path, outside-root write, listener creation, two named securityd services and a nonexistent keychain lookup. The child received only candidate/cell identifiers and opaque references. | [SRC-12](../../../.protocols/experiments/runs/R-033/2026-08-13-contained-symmetry-v1/containment.json) | `STOP-01`, collection safety | macOS sandbox evidence for only these probes in this child; it does not establish general private-service denial or a production isolation topology. The parent used HOME only to construct deny rules. |
| `OBS-15` | The first carrier accounts for 70 rotating candidate/cell entries, but its child only emitted the case plan; parent constants assigned outcomes and auth digests self-compared. | [SRC-11](../../../.protocols/experiments/r033-contained-comparison.ts), [SRC-12](../../../.protocols/experiments/runs/R-033/2026-08-13-contained-symmetry-v1/summary.json) | Review gate | It is valid only for schema/accounting and bounded containment; none of its candidate outputs is evidence. |
| `OBS-16` | V2 executed partial adapter methods and integrity controls, but independent review found that its CC semantics, transformed per-layer controls, full frozen request comparisons and actual restart process were incomplete. | [SRC-14](../../../.protocols/experiments/runs/R-033/2026-08-13-executable-adapters-v2/summary.json) | Review gate | V2 is bounded integrity/containment/schema and partial execution evidence only; its totals cannot support CC conformance. |
| `OBS-17` | Independent review rejected V3 because candidate behavior still shared one resolver, refresh and discovery paths did not traverse the required distinct mechanisms, layer controls were parent-only, and serialization evidence did not establish fail-closed durability. | [SRC-15](../../../.protocols/experiments/r033-v3-semantics.ts), [SRC-16](../../../.protocols/experiments/runs/R-033/2026-08-13-semantic-adapters-v3/README.md) | Review gate | V3 candidate totals, coverage flags and failures are not evidence and cannot enter synthesis. |
| `OBS-18` | V4.1 separates mechanism modules and executes detector/layer preflight controls, but independent pre-collection review found that its CC plan remains descriptive: CC-10 success/throw do not exercise `DurableSpy`; refresh, account derivation and discovery lack executable staged failure/order assertions; and its child/runner emits only a containment/provenance plan rather than rotating per-cell candidate results. | [SRC-17](../../../.protocols/experiments/r033-v4/precollection-freeze.json) | Review gate | V4.1 is rejected preflight/symmetry/containment-design evidence only. It authorizes no collection, conformance claim, synthesis or mechanism selection. |

## Collection Log

| Date | Activity | Result | Deviation / reason |
| --- | --- | --- | --- |
| 2026-08-13 | Routed R-018 `HD-02` into separate technical discovery and created GitHub #33 | Stable decision question and owner established | None |
| 2026-08-13 | Inspected current endpoint resolution, provider adapters, model request and action-result sinks | Initial source/authority/adapter inventory recorded | Candidate prototype collection intentionally not started before independent inventory review |
| 2026-08-13 | Independent review rejected the first inventory as incomplete; statically added refresh Kimi/Claude/Codex sources, credential-store writes, OAuth refresh, callable-registry, list-model bearer transport and new-agent route caller | Inventory and matrix expanded through `CC-13`; lifecycle remains `collecting` | No prototype collection began; updated inventory requires renewed independent review |
| 2026-08-13 | Second review found direct root-context authority missing; statically added copied environment, settings raw/list access, arbitrary DB select and shared-process file/keychain authority roots | Inventory and symmetric matrix expanded through `CC-14`; lifecycle remains `collecting` | No generated code or data-source probe executed |
| 2026-08-13 | Independent non-authoring review rechecked the expanded source/authority map | Inventory completeness and candidate-injection planning gate signed off for the recorded `06ae8df` scope | This is not candidate evidence, containment proof, mechanism selection or authorization for real secret/network access |
| 2026-08-13 | Ran the first contained outcome-model dry run after confirming no inventoried source drift | Containment and 70-cell accounting completed | Independent review rejected all candidate evidence because the child only emitted a plan, outcomes were parent constants and auth checks self-compared |
| 2026-08-13 | Downgraded the first carrier and ran an additive contained executable-adapter matrix | 70 adapter cells and 70 injected-leak controls executed; auth placement checked against frozen expected digests; 10 standalone-redaction failures retained from observed state | Lifecycle remains `collecting`; independent carrier, symmetry and adapter-fidelity review required before synthesis |
| 2026-08-13 | Independent review accepted v2 bounded integrity but rejected full fidelity; downgraded v2 and ran additive v3 semantics | 70 semantic cells, 72 layer controls and five restart processes recorded with checksums | Lifecycle remains `collecting`; v3 independent review required before synthesis |
| 2026-08-13 | Independent review rejected V3 fidelity | V3 retained only as rejected trace; no new carrier generated from subsequently changed code | Clean-sheet V4 required; lifecycle remains `collecting` and synthesis is blocked |
| 2026-08-13 | Built V4, received a rejected pre-collection review, froze V4.1, and received a second rejection | V4.1 improved module separation, control symmetry and containment/provenance planning but remained a preflight rather than an executable staged collector | Freeze retained as rejected trace; collection remains unauthorized and the next gate requires a new executable collector design and renewed independent review |

## Evidence Quality Check

- [x] Every current material observation traces to linked primary code or a
  canonical governed source.
- [x] Observations are separated from hypotheses and recommendations.
- [x] Commit freshness and static/dynamic limitations are recorded.
- [x] No real secret, credential store, provider, network or shared state was
  accessed.
- [x] Independent review signed off inventory completeness for the recorded
  source scope before candidate prototype collection; carrier/symmetry review
  remains required before synthesis.
- [x] The stable carrier contains no raw sentinel or authentication header and
  its `SHA256SUMS` verify.
- [x] Rejected first-carrier candidate claims are explicitly downgraded; its
  pass/fail and compatibility fields cannot enter synthesis.
- [x] V2 is explicitly limited to partial execution evidence; it cannot support
  complete CC conformance.
- [x] V3 candidate claims are explicitly rejected and its provenance mismatch
  after subsequent edits is disclosed.
- [ ] Independent non-authoring review has verified the carrier, per-cell
  checksums, symmetry, adapter fidelity and source/sink completeness; synthesis
  remains blocked until this item is complete.
- [ ] Independent non-authoring pre-collection review has approved a replacement
  executable staged collector satisfying the next gate; V4.1 was rejected and
  cannot authorize candidate collection.

## Required Next Collector Scope

The next attempt must be an executable staged collector frozen before collection:

1. five separate mechanism implementations with no shared secret resolver:
   broker/reference binding; source-excluded privileged transport; schema-owned
   projection; provenance-aware redaction; and an explicit composition;
2. separate inference, refresh and model-discovery contracts, with CC-05/06
   synthetic read → OAuth → write operations traversing each mechanism and
   CC-13 using its own discovery request, failure and render flow;
3. S0-S8 values executed through every candidate at every prohibited layer,
   including transformed positive leaks and clean negative controls;
4. CC-10 secret-bearing success, throw and cyclic serialization paths that
   prove failure before any durable write;
5. `CC-10` secret-bearing success, throw and cyclic values must enter the actual
   candidate serialization-to-durability path with a `DurableSpy`; every secret,
   error or serialization rejection must prove `durable.calls === 0`;
6. the full `CC-01…14 × CAND-01…05` matrix must be executable candidate behavior,
   not a frozen list, declared receipt or parent-generated outcome;
7. refresh must execute distinguishable read → OAuth request → OAuth response →
   write stages for Kimi, Anthropic and Codex, with failure injected at every
   stage and proof that later dispatch/write stages remain at zero;
8. Codex account identity must be derived by a synthetic claim parser from the
   privileged token fixture, not by hashing an arbitrary token string;
9. discovery success must execute transport → non-secret model IDs → render;
   discovery failure must prove no IDs and zero render calls;
10. an actually contained rotating child collector must execute every candidate
    cell and emit sanitized per-cell results/checksums plus exact HEAD, platform,
    source, dependency, instrument, fixture, containment and execution provenance;
11. frozen code and independent pre-collection review must precede collection;
    a separate post-collection review must precede evidence promotion or synthesis.

V4.1 freeze SHA-256
`01ecc10bea2a8657679c9d4fc8eb560ef9466194e875fc68cf4f06ffdd39e7c2`
is rejected input to this gate, not an approval token. Its manifest fields
`collectionAuthorized: false` and `candidateResultsCollected: false` remain
authoritative for that attempt.
