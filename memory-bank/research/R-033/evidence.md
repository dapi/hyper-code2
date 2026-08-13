---
title: "R-033: Evidence Log"
doc_kind: research
doc_function: canonical
purpose: "Traceable initial code-grounded inventory for secret non-transit candidate comparison."
derived_from:
  - brief.md
  - plan.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-033: Evidence Log

This log currently contains only the initial static inventory. It is not
candidate comparison evidence and does not support a mechanism recommendation.

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

## Collection Log

| Date | Activity | Result | Deviation / reason |
| --- | --- | --- | --- |
| 2026-08-13 | Routed R-018 `HD-02` into separate technical discovery and created GitHub #33 | Stable decision question and owner established | None |
| 2026-08-13 | Inspected current endpoint resolution, provider adapters, model request and action-result sinks | Initial source/authority/adapter inventory recorded | Candidate prototype collection intentionally not started before independent inventory review |
| 2026-08-13 | Independent review rejected the first inventory as incomplete; statically added refresh Kimi/Claude/Codex sources, credential-store writes, OAuth refresh, callable-registry, list-model bearer transport and new-agent route caller | Inventory and matrix expanded through `CC-13`; lifecycle remains `collecting` | No prototype collection began; updated inventory requires renewed independent review |
| 2026-08-13 | Second review found direct root-context authority missing; statically added copied environment, settings raw/list access, arbitrary DB select and shared-process file/keychain authority roots | Inventory and symmetric matrix expanded through `CC-14`; lifecycle remains `collecting` | No generated code or data-source probe executed |
| 2026-08-13 | Independent non-authoring review rechecked the expanded source/authority map | Inventory completeness and candidate-injection planning gate signed off for the recorded `06ae8df` scope | This is not candidate evidence, containment proof, mechanism selection or authorization for real secret/network access |

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
