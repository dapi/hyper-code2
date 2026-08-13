---
title: Agent Marker Protocol
doc_kind: engineering
doc_function: canonical
purpose: Canonical engineering contract for model actions, results, transcript structure, and the agent turn loop.
derived_from:
  - ../dna/governance.md
  - architecture.md
  - ../domain/rules.md
status: active
audience: humans_and_agents
canonical_for:
  - agent_marker_protocol
  - marker_result_pairing
  - agent_turn_loop
  - message_event_separation
---

# Agent Marker Protocol

The LLM receives no native function-tool schema. It emits action markers in plain
assistant text. The runtime parses them, persists the assistant action, executes
it, persists an activity event, appends a synthetic result to the conversation,
and asks the model to continue. The loop ends when the model returns marker-free
prose or a terminal HTML response.

## Marker Kinds

| Kind | Purpose | Result behavior |
| --- | --- | --- |
| `eval` | Execute TypeScript/JavaScript inside the process with `ctx` and current agent | Captured output or error returns as synthetic result |
| `write` | Write complete file content | Write summary returns as synthetic result |
| `bash` | Execute `bash -c` | stdout/stderr and exit status return as synthetic result |
| `read` | Read plain or hashline-addressed file content | Content returns as synthetic result |
| `grep` | Search plain or hashline-addressed project content | Matches return as synthetic result |
| `edit` | Apply hashline-addressed edits | Edit summary returns as synthetic result |
| `html` | Produce sanitized terminal UI HTML | Creates the final rendered event without another result turn |

Exact lexical grammar, escaping, and accepted bodies are owned by the
[parser](../../src/agent/parseMarkers.ts) and its tests. The protocol intent and
conversation invariants are owned here.

## Transcript And Activity

- Messages are the durable LLM conversation.
- Activity events are the durable operator-facing trace.
- In-memory arrays are synchronized views, not authoritative stores.
- Synthetic action results use the user role for LLM compatibility but are not
  real operator input and must not advance the scheduling frontier.
- Action messages and results remain structurally paired during compaction,
  deletion, and truncation.

## Error And Completion Semantics

- Parser errors are returned as synthetic correction context so the model can retry.
- Action failures are observable results, not silent drops.
- Marker-free prose closes the run normally.
- Empty completions do not create phantom messages or events.
- HTML is sanitized before becoming browser output.

## Implementation Evidence

- [Run loop](../../src/agent/run.ts) — parse/execute/repeat orchestration.
- [Marker execution](../../src/agent/executeMarker.ts) — action dispatch, result,
  message, and event persistence.
- [Result formatting](../../src/agent/formatMarkerResult.ts) — synthetic feedback contract.
- [Transcript mutations](../../src/session/truncateMessagesFrom.ts) — structural pairing preservation.
