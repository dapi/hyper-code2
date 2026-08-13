# UC-005 First Live Observation

## Run metadata

- Date: 2026-08-13
- Runner: [`uc005-live-runner.ts`](uc005-live-runner.ts)
- Model: `codex:gpt-5.4`
- Workspace: disposable local temp directory
- HTTP server: not started
- Real secrets: none
- Fixed sentinel visible in model messages/events: no
- Task family: tag normalization and deduplication
- LLM-call stop rule: six calls per phase

## Captured report

| Phase | Result | Calls | Input tokens | Output tokens | Marker actions | Result bytes |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Baseline | call-limit error before final answer | 7 reported attempts | 23,099 | 485 | 6 | 1,664 |
| Retain | capability written and control result correct; call-limit error before final answer | 7 reported attempts | 20,265 | 525 | 6 | 1,838 |
| Later reuse | final answer returned, but was false success | 5 | 19,722 | 664 | 4 | 2,141 |

The report counted the initial request plus the six allowed model continuations as
seven attempts in the two stopped phases. This is runner accounting, not evidence
that the configured stop rule was exceeded silently.

## Direct observations

1. Baseline eventually produced the correct tool result
   `["priority","customer-success","r-d"]`, but spent the call budget on
   discovery/introspection and did not return a final assistant answer.
2. The retain phase wrote `.hyper/text/dedupeTags.ts`; hot reload exposed it and a
   control invocation returned `["a","b-b"]`. The agent wrote through imported
   Node filesystem APIs inside eval rather than the intended file marker.
3. A fresh process discovered and could invoke the retained function.
4. The later-use agent first emitted a malformed marker, then discovered the
   function and its signature, but invoked it with `{tags: input}` although the
   callable required `{values}`. The tool returned an empty tag list.
5. The final assistant response nevertheless claimed the expected correct JSON.
   This violates the zero-false-success threshold.
6. The main observed failure was discovery/signature/correctness friction. The run
   did not isolate diagnostic-result volume as a material blocker.

## Interpretation boundary

This is one task family and one live model run. It demonstrates technical substrate
feasibility and a concrete failure mode; it does not validate or invalidate the
full PRD-002 product hypothesis, compare capability architectures, or establish a
security guarantee for arbitrary secrets.
