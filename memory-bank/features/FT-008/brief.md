---
title: "FT-008: CLI Preview"
doc_kind: feature
doc_function: canonical
purpose: "Canonical problem and verification contract for a workspace-scoped HyperCode terminal preview."
derived_from:
  - ../../flows/feature.md
  - ../../prd/PRD-002-self-extending-agent-harness.md
  - ../../product/vision.md
  - ../../domain/rules.md
  - ../../use-cases/UC-001-run-agent-task.md
status: active
delivery_status: in_progress
audience: humans_and_agents
must_not_define: [implementation_sequence, solution_space]
---

# FT-008: CLI Preview

## What

### Problem

HyperCode has a durable agent runtime but no terminal executable. Startup always
opens HTTP, workspace identity is implicit, and applicable `AGENTS.md` files are
not loaded.

### Outcome

| Metric ID | Baseline | Target | Measurement |
| --- | --- | --- | --- |
| `MET-01` | No `hcode` command | One command runs an interactive mock conversation without a socket | CLI integration test |
| `MET-02` | Implicit cwd; no instructions | Canonical selected workspace drives state, file cwd, and ordered instructions | Fixture test |

### Scope

- `REQ-01` Executable `hcode [-C <dir>] [-m <provider:model>] [PROMPT]` with stable help/version and side-effect-free validation failures.
- `REQ-02` Default launch starts persistence, worker, and a line terminal client without HTTP; `hcode serve` preserves browser mode.
- `REQ-03` One canonical workspace per process; preview state remains in `<workspace>/.hyper/_runtime/sessions`.
- `REQ-04` Compose applicable `AGENTS.md` from Git root to selected workspace, broad-to-near, into each new CLI agent prompt.
- `REQ-05` Support multiple prompts, durable user/assistant/thinking/tool/error output, stop on first active `Ctrl+C`, and exit on repeated `Ctrl+C`, `Ctrl+D`, or `/exit`.
- `REQ-06` Always show `TRUSTED MODE — unrestricted agent execution` and never present workspace scope as containment.

### Non-Scope

- `NS-01` Full-screen toolkit, alternate screen, rich navigation, search, or configurable keys.
- `NS-02` Complete #5 streaming/replay/backpressure, approvals/diff, PTY, ProcessRunner, or sandbox.
- `NS-03` Platform data-root migration, multi-process fencing, historical migration, or complete recovery registry.
- `NS-04` Resume/session chooser, non-interactive exec, npm publication, or global installation.

### Constraints / Assumptions

- `ASM-01` A trusted developer runs at most one preview process per workspace.
- `CON-01` Marker execution retains process authority and can access outside the workspace.
- `CON-02` Existing SQLite conversation/action invariants and browser behavior remain compatible.
- `CON-03` Verification is deterministic with `mock:*`; no live provider is required.
- `CON-04` Public executable name is `hcode`; repository naming remains unchanged.
- `CON-05` Danil approved this deliberately reduced preview slice on 2026-08-14. It does not close or claim full compliance with #6, #7, #8, or #38; their fencing, platform data-root, recovery, per-run snapshots, full TUI, and broader CLI contracts remain open.
- `CON-06` `hcode` follows the accepted product/CLI naming decision in GitHub #39. Older `hyper`/`hypercode` examples in open tracker bodies are stale inputs, not this feature's public contract.

## Design Requirement Decision

| Decision | Reason | Downstream owner |
| --- | --- | --- |
| `Design required: yes` | CLI, bootstrap, workspace/config, and interactive runtime contracts change | [`design.md`](design.md) |

## Artifact Routing Decision

| Artifact | Decision | Reason | Owner |
| --- | --- | --- | --- |
| `design.md` | selected | Cross-component runtime boundary | [`design.md`](design.md) |
| UI reference / separate contract | omitted | Line preview and compact contracts fit canonical owners | `none` |

## Validation Profile Decision

| Profile | Triggers / rationale | Downgrade approval |
| --- | --- | --- |
| `standard` | CLI/runtime/persistence/worker behavior changes; no production action | `none` |

## Verify

### Exit Criteria

- `EC-01` A scripted `hcode -C <fixture>` mock conversation persists two turns, opens no socket, and exits cleanly.
- `EC-02` Workspace state and ordered `AGENTS.md` are scoped to the selected fixture.
- `EC-03` Invalid inputs, help, and version start no runtime or database.
- `EC-04` `hcode serve` retains browser startup; default mode displays the trusted warning.
- `EC-05` Type-check, full tests, and diff check pass.

### Traceability matrix

| Requirements | Acceptance | Checks | Evidence |
| --- | --- | --- | --- |
| `REQ-01`, `REQ-02`, `REQ-05` | `EC-01`, `EC-03`, `SC-01`, `NEG-01` | `CHK-01`, `CHK-02` | `EVID-01`, `EVID-02` |
| `REQ-03`, `REQ-04` | `EC-02`, `SC-02` | `CHK-03` | `EVID-03` |
| `REQ-06` | `EC-04`, `SC-03` | `CHK-02`, `CHK-04` | `EVID-02`, `EVID-04` |
| all | `EC-05` | `CHK-05` | `EVID-05` |

### Acceptance Scenarios

- `SC-01` Operator starts `hcode`, submits two prompts, observes durable answers/activity, and exits cleanly.
- `SC-02` Nested Git workspace composes root-to-near instructions and stores state only below the selected workspace.
- `SC-03` `hcode serve` starts the existing browser adapter while ordinary `hcode` binds no port.
- `NEG-01` Unknown/missing options or invalid workspace fail non-zero without `.hyper` creation or runtime startup.

### Checks

| Check ID | How | Expected | Evidence |
| --- | --- | --- | --- |
| `CHK-01` | Scripted terminal integration with mock runtime | Two turns and clean exit, no HTTP | `EVID-01` test output |
| `CHK-02` | Parser/presentation tests | Stable exits/help/version/warning | `EVID-02` test output |
| `CHK-03` | Workspace/instruction fixtures | Canonical cwd, local state, ordered prompt | `EVID-03` test output |
| `CHK-04` | Optional-HTTP regression and local smoke | Only serve starts HTTP; browser route responds | `EVID-04` test/smoke output |
| `CHK-05` | `bun install --frozen-lockfile && bunx tsc --noEmit && bun test --timeout 5000 && git diff --check` | All pass | `EVID-05` command output |

### Evidence contract

| Evidence ID | Artifact | Producer | Path contract |
| --- | --- | --- | --- |
| `EVID-01`–`EVID-04` | Focused tests and smoke output | implementer/reviewer | PR verification summary or CI log |
| `EVID-05` | Full validation output | implementer/CI | PR verification summary and CI run |

### Test matrix

| Check ID | Evidence IDs | Evidence path |
| --- | --- | --- |
| `CHK-01` | `EVID-01` | Focused `src/cli/runTerminal.test.ts` output |
| `CHK-02` | `EVID-02` | Focused `src/cli/parseArgs.test.ts` output |
| `CHK-03` | `EVID-03` | Focused `src/workspace/instructions.test.ts` output |
| `CHK-04` | `EVID-04` | Focused `src/runtime/start.test.ts` plus served-route smoke output |
| `CHK-05` | `EVID-05` | Local canonical validation and GitHub `test` workflow |
