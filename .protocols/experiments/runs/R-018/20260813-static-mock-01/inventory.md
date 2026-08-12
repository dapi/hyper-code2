# R-018 static source-to-sink inventory

Snapshot: commit `d119f1c10381e489d9140c43f9fe9a878bf67255`, tree
`c47480d4c2e0abfce860972427bab25bd5228d1d`. The `src/` tree had no diff from
that commit. This is a bounded static sample, not a completeness proof.

## Included sources

| Source | Current resolution | Static access surface | Collection status |
| --- | --- | --- | --- |
| Five declared API-key settings | `settings.get` returns a DB override or `ctx.env[descriptor.env]` as an unprojected value | `ctx.fns.settings.get/getString/list/declared`; `list` and `declared` include current values | One synthetic descriptor with the same `type: secret` and env resolution shape was exercised; real declarations and values were not read |
| Kimi Coding and Codex credential files | Provider resolution/refresh reads credential JSON below a HOME selected from `ctx.env` with fallback to `process.env` | Provider helpers and, independently, agent `eval`/shell process authority | Static inspection only; paths and values were not accessed |
| Claude Code keychain | Refresh helper reads a macOS keychain item and may refresh it over HTTP | Provider helper and inherited process authority | Static inspection only; keychain was not accessed |
| Process/ctx environment | `repl.eval` receives full `ctx`; `executeBash` spawns a shell without an explicit minimal environment | Generated code can refer to `ctx.env`; shell inherits ambient environment | Static inspection only; the collection used neither real eval nor shell |

Relevant code: [`settings/get.ts`](../../../../../src/settings/get.ts),
[`settings/list.ts`](../../../../../src/settings/list.ts),
[`settings/declared.ts`](../../../../../src/settings/declared.ts),
[`llm/resolveEndpoint.ts`](../../../../../src/llm/resolveEndpoint.ts),
[`llm/refreshKimiCode.ts`](../../../../../src/llm/refreshKimiCode.ts),
[`llm/refreshCodex.ts`](../../../../../src/llm/refreshCodex.ts),
[`llm/refreshClaudeCode.ts`](../../../../../src/llm/refreshClaudeCode.ts),
[`repl/eval.ts`](../../../../../src/repl/eval.ts), and
[`agent/executeBash.ts`](../../../../../src/agent/executeBash.ts).

## Included transforms and sinks

| Path | Current transform | Sink / visibility | Outcome coverage |
| --- | --- | --- | --- |
| action output → tool event | `executeMarker` copies output to `result`, highlights it, renders event HTML, and JSON-serializes the event into SQLite | Persistent event row and browser event rendering | Success exercised; error statically copies `e.message` through the same path |
| action output → synthetic result | `formatMarkerResult` prefixes the output; `appendMessage` stores it as `role: user` with `excluded_from_cursor`, not `excluded_from_llm` | Persistent message row | Success exercised; error statically uses the same output with an `:error` marker |
| persistent message → request | `getMessages` filters only `excluded_from_llm`; `buildLlmRequest` appends the transcript | Pre-provider request messages for root agents and inherited fork messages | Success exercised with the mock endpoint; provider adapters statically serialize the returned messages |
| message → OpenAI-compatible body | No secret-specific projection/redaction before `JSON.stringify(body)` | External provider request body | Static inspection only; no fetch/provider call |
| message → Anthropic body | Role conversion/coalescing only | External provider request body | Static inspection only; no fetch/provider call |
| message → Responses input | Role/content conversion only | External provider request body | Static inspection only; no fetch/provider call |

Relevant code: [`agent/executeMarker.ts`](../../../../../src/agent/executeMarker.ts),
[`agent/formatMarkerResult.ts`](../../../../../src/agent/formatMarkerResult.ts),
[`session/appendMessage.ts`](../../../../../src/session/appendMessage.ts),
[`session/appendEvent.ts`](../../../../../src/session/appendEvent.ts),
[`agent/renderEventHtml.ts`](../../../../../src/agent/renderEventHtml.ts),
[`session/getMessages.ts`](../../../../../src/session/getMessages.ts),
[`agent/buildLlmRequest.ts`](../../../../../src/agent/buildLlmRequest.ts),
[`llm/streamOpenAI.ts`](../../../../../src/llm/streamOpenAI.ts),
[`llm/streamAnthropic.ts`](../../../../../src/llm/streamAnthropic.ts), and
[`llm/toCodexInput.ts`](../../../../../src/llm/toCodexInput.ts).

## Transform-map disposition

The included action-result route performs string prefixing, HTML escaping or
highlighting, and JSON serialization. The approved `S0–S8` detector family
covers the literal, JSON-escaped, percent-encoded, Base64/Base64url, hexadecimal,
shell-quoted and NFC forms. No included code applies hashing or encryption to the
action result before the prohibited sinks. The detector controls were therefore
run without adding an encoding cell.

## Paths not executed after the stop

`CELL-01` found a prohibited transit on the success path. Per `STOP-03`, the
error, serialization-failure, retry/cancellation and additional source cells
were not run. Static inspection shows that caught error messages are copied into
the same output channel; it does not establish runtime behavior for those
unexecuted outcomes. No explicit action-result retry transform was found in the
selected route. Dynamic functions, future markers, provider-side retention and
unknown telemetry remain outside this inventory.
