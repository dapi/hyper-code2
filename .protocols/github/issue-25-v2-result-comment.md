Instrument v2 and the repeated tag-normalization family are complete.

The revised instrument runs each agent phase in a separate sandboxed OS process,
uses a credential-owning LLM broker, performs restart verification in another
process, preserves sanitized transcripts/checksums, and compares golden output
with both the last tool result and final answer. This establishes the macOS
experiment boundary; it does not claim the production runtime satisfies the
secret non-transit contract.

Live result with configured model `codex:gpt-5.4`:

- baseline: exact golden tool result and final answer;
- retain: exhausted six continuations while inspecting discovery/file surfaces,
  created no capability and returned no control result;
- later reuse: honestly returned an empty result because no capability existed;
- separate restart verifier: no callable found;
- false-success cases: zero;
- sentinel was not injected into the tested pipeline; it did not appear
  accidentally in captured messages/events. This is not a non-transit test.

The remaining two task families are stopped under the predeclared rule after a
concrete failure. The product hypothesis remains unvalidated; the next owner
decision is whether to revise retention/discovery guidance, conclude the current
cycle as inconclusive, or reroute a bounded runtime change. Do not activate #12,
#16 or #19 from this result.
