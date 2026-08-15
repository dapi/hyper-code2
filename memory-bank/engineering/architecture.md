---
title: Engineering Architecture
doc_kind: engineering
doc_function: canonical
purpose: Runtime, module, persistence, concurrency, and extension boundaries for hyper-code2.
derived_from:
  - ../dna/governance.md
  - ../domain/context-map.md
status: active
audience: humans_and_agents
---

# Engineering Architecture

hyper-code2 is one Bun process with a procedural function registry, a Bun HTTP
server, a process-wide agent worker, and a local SQLite database. The detailed
data-plane and signal-plane design is documented in
[Architecture](../../docs/architecture.md); code owns exact implementation.

The core separation is **state from functions**: durable agent/session state is
stored in SQLite, while callable behavior is loaded from ordinary files into
`ctx.fns`. Replacing or adding a function does not require discarding sessions.

## Module Contract

- One procedure per file; folder name becomes the `ctx.fns` namespace.
- Procedures receive `ctx` first and usually one options object.
- Project modules call each other through `ctx.fns`, not cross-imports.
- `$route_*`, `$type_*`, `$setting_*`, `$migrate_*`, and `$script_*` filenames
  have loader-defined meanings.
- `src/ctx_ns.d.ts` is generated and must not be hand-edited.

## Runtime Composition

`src/$main.ts` loads functions, regenerates types, connects and migrates SQLite,
rehydrates sessions, loads routes, starts HTTP, and launches the worker.

- `src/agent/` owns prompt assembly, markers, agent runs, scheduling, and routes.
- `src/session/` owns durable agents, messages, events, forks, and scratchpads.
- `src/db/` owns shared SQLite access and migration execution.
- `src/llm/` owns provider resolution and streaming protocols.
- `src/cli/` owns terminal adapters: interactive TTYs use the imperative OpenTUI
  full-screen adapter; redirected streams retain the line adapter.
- `src/settings/` owns declared and persisted configuration.
- `src/files/`, `src/repl/`, and `src/project/` expose project inspection and extension.
- `src/ui/`, `src/http/`, and root routes own browser delivery.

## Persistence And Concurrency

- SQLite is the source of truth; in-memory agent state is a synchronized view.
- One worker drains all eligible agents and runs different agents concurrently.
- Per-agent claim serialization uses an atomic SQLite update; wakeups carry no data.
- Browser chat updates use htmx long-polling and re-read durable events after wakeup.
- The TUI may observe ordered, agent-scoped, process-local model-call deltas for
  responsiveness. Those callbacks are non-durable and non-HTTP; SQLite events
  replace the live projection and remain the final display/model authority.
- Schema changes are timestamped paired SQL migrations under the owning module.

## Extension Boundary

Shipped behavior belongs in `src/`. `.hyper/` is gitignored runtime state and
experimental/per-user overlays loaded after `src/`; core code and test fixtures
must never depend on it. Tests write fixtures under `.test-tmp/`.

Hot reload is explicit: reload the affected function/module, regenerate types
when type surfaces change, and rescan routes when route or browser-script
surfaces change. Runtime overlays load after `src/` and may override the same
registered name.

## Known Architectural Risks

[TODO](../../TODO.md) is the current evidence for three unresolved risks: atomic message/event
index allocation, broad `session.save()` behavior, and worker crash recovery.
No production deployment or public-network security architecture is documented.

## Implementation Evidence

- [Runtime entrypoint](../../src/$main.ts) — load, migrate, rehydrate, serve, and start worker.
- [Function loader](../../src/loadFns.ts) — procedural registry construction.
- [Project scanner](../../src/project/scan.ts) — source/overlay discovery and exclusions.
- [Worker loop](../../src/agent/workerLoop.ts) — atomic claim and concurrent drain.
- [Full inherited transcript](../../src/session/getFullMessages.ts) — lazy fork assembly.
- [Agent protocol](agent-protocol.md) — marker loop and transcript/event contract.
- [TUI adapter](../../src/cli/runTui.entry.ts) — live/durable reconciliation,
  cancellation, signal handling, and renderer cleanup.
- [Trust boundary](security-boundary.md) — effective filesystem, shell, eval, network, and credential authority.
