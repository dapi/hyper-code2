Independent review rejected the first R-033 static inventory as incomplete.
Candidate prototype collection did not start.

The governed inventory and common matrix now additionally cover:

- `refreshKimiCode`, `refreshClaudeCode` and `refreshCodex` credential-source,
  refresh-token network, credential-store write and diagnostic/error paths;
- direct shared-registry callability and the Anthropic/Codex/`llmCall` callers;
- `listModels` Codex bearer transport and Claude refresh check;
- the `GET /agent/new` caller that renders returned non-secret model IDs;
- Codex retry reuse of a bearer-bearing request;
- a new symmetric `CC-13` discovery-path cell for every candidate.

All inspected files are pinned to and match published baseline `06ae8df`.
This was read-only static inspection: no refresh procedure, filesystem/keychain
command, provider/OAuth/model-discovery request, real credential or shared state
was accessed. R-033 remains `collecting` and waits for renewed independent
inventory review before any synthetic candidate prototype executes.
