# Brownfield intake: hyper-code2

Date: 2026-08-12
Status: temporary discovery evidence for Memory Bank adoption
Repository owner: `dapi` organization (from `origin`); individual product and operations owners are unknown

## Purpose

Capture the observable state of hyper-code2 before installing Memory Bank. This
document is discovery evidence, not a new source of truth. Durable facts are to
be converted into the relevant Memory Bank owners after installation.

## Current product problem

hyper-code2 provides a small, inspectable AI-agent server for software work. It
keeps agent conversations durable, lets an agent execute a plain-text markers
protocol, and supports changing procedural capabilities without restarting the
server.

Evidence:

- `README.md` describes a self-extending Bun agent server, the markers protocol,
  SQLite sessions, and hot-reloadable functions. Confidence: high; current root
  product overview.
- `src/$main.ts` wires function loading, type generation, SQLite migrations,
  route loading, HTTP startup, and a process-wide agent worker. Confidence: high;
  executable entrypoint.
- `src/agent/fullSystemPrompt.ts` composes the runtime prompt from core and wire
  protocol files plus per-agent instructions. Confidence: high; executable code.

## Users and jobs

Observed primary user: a developer operating coding agents through the local web
UI and REPL. The project also supports multiple persisted agent sessions and
fork/delegation workflows.

Jobs supported by current code and docs:

- create, use, fork, archive, stop, and inspect agent sessions in a browser;
- let agents read, edit, and execute against project files through marker calls;
- switch among configured LLM providers and subscription-backed providers;
- preserve messages, events, settings, scratchpads, and run state in SQLite;
- extend functions and routes through the procedural `ctx.fns` registry and
  hot-reload them during development.

Evidence: `README.md`, `CLAUDE.md`, `src/agent/`, `src/session/`, `src/files/`,
`src/repl/`, `src/settings/`, and `src/llm/`. Confidence: high for implemented
capabilities; target audience beyond repository developers is not documented.

## Goals and non-goals

Observed goals:

- keep the runtime simple, procedural, Bun-native, and inspectable;
- use SQLite as the durable source of truth for agent history and scheduling;
- use normal HTTP/htmx for browser data flow and in-process wakeups only as
  signals;
- support provider-independent agent execution through a plain-text markers
  protocol;
- preserve project code in `src/` while reserving `.hyper/` for runtime or
  experimental overlays.

Evidence: `README.md`, `CLAUDE.md`, and `docs/architecture.md`. Confidence: high.

Observed non-goals or exclusions:

- native model tool-call schemas are not the primary agent wire format;
- a separate durable queue table is intentionally avoided;
- Node-first frameworks and packages are avoided when Bun supplies the needed
  primitive;
- `.hyper/` must not contain shipped core functionality.

Evidence: `README.md`, `CLAUDE.md`, and `docs/architecture.md`. Confidence: high.

## Success signals

Confirmed engineering gates:

- `bunx tsc --noEmit` succeeds;
- `bun test --timeout 5000` succeeds locally after `bun install
  --frozen-lockfile` (408 passed, 3 intentionally skipped on 2026-08-12);
- GitHub Actions runs frozen dependency installation, type-checking, and tests
  on pushes to `main` and pull requests.

Evidence: `.github/workflows/test.yml` and the local baseline run. Confidence:
high. Product adoption, latency, reliability, cost, and user-satisfaction
metrics are not defined.

## Architecture and inventory summary

- Runtime: Bun and TypeScript; dependencies are declared in `package.json` and
  locked in `bun.lock`.
- Composition: one function per file, loaded into `ctx.fns`; generated global
  types live in `src/ctx_ns.d.ts`.
- Server/UI: Bun HTTP server with server-rendered HTML, htmx polling, and a small
  browser script layer.
- Agent runtime: multi-agent execution, plain-text markers, per-agent prompts,
  compaction, delegation, and a process-wide worker.
- Persistence: SQLite migrations under `src/session/` and `src/settings/`;
  messages, events, settings, key-value state, forks, and scheduling metadata are
  durable.
- Integrations: LM Studio, OpenAI-compatible APIs, Anthropic Messages, OpenAI
  Responses/Codex, Kimi Coding, Claude Code credentials, Groq, OpenRouter, and a
  mock provider for tests.
- Configuration: declared settings can resolve from explicit input, SQLite,
  environment variables, or defaults. Secret values were not inspected.
- Delivery: one GitHub Actions test workflow. No deployment, release, rollback,
  container, infrastructure, observability, SLO, or alerting definition was
  found in the repository.

Evidence: `src/`, `package.json`, `bun.lock`, `.env.test`, `.github/workflows/test.yml`,
`README.md`, `CLAUDE.md`, and `docs/architecture.md`. Confidence: high for the
repository inventory, low for operations outside this repository.

## Durable constraints

- Use Bun commands and Bun APIs; do not assume a Node runtime.
- Call project functions through `ctx.fns`; do not add cross-imports between
  project modules.
- Keep default-exported procedures anonymous and use the documented
  `(ctx, opts)` convention.
- Put shipped core code in `src/`; keep runtime state and experimental overlays
  in `.hyper/`.
- Treat SQLite as the source of truth and mutate transcript/event state through
  session helpers.
- Use mock LLMs in the default automated test suite.

Evidence: `CLAUDE.md`, supported by loaders and tests in `src/`. Confidence: high.

## Risks and known debt

- `TODO.md` identifies non-atomic message/event index allocation, broad
  `session.save()` semantics, and worker crash recovery/idempotency as the three
  critical improvements. Owner and schedule: unknown.
- The application intentionally exposes powerful file, shell, REPL, and
  credential-backed provider capabilities. Authentication, authorization,
  tenancy, network exposure, and production threat boundaries are not
  documented. Owner: unknown.
- The default runtime database is local under `.hyper/_runtime`; backup,
  retention, migration rollback, and recovery procedures are not documented.
- Provider contracts and subscription credential formats are external and may
  change independently of this repository.

## Conflicts and freshness concerns

- The opening of `CLAUDE.md` describes “one agent” and `evalCode` only, while
  current code and later sections describe multi-agent sessions and multiple
  marker kinds. Treat the current implementation and the detailed current
  README sections as stronger evidence. Documentation owner: unknown.
- `README.md` calls the runtime approximately 1000 LOC, but the current source
  tree is materially larger. Treat the phrase as directional, not a maintained
  metric.
- `docs/architecture.md` says “four markers” in one section, while current
  `README.md`, `CLAUDE.md`, and `src/agent/` include additional read/grep/edit
  behavior. The executable parser/dispatcher is authoritative.
- `docs/reflection.md` is explicitly a design and not implemented; it must not
  be presented as a current capability.

## Assumptions

- This repository is currently developer-operated and local-first because no
  deployment assets or external operating contract were found. Confidence: medium.
- GitHub organization `dapi` owns repository administration because both fetch
  and push remotes point to `dapi/hyper-code2`. The accountable human owner is
  still unknown. Confidence: medium.

## Open questions

- Who owns product direction, architecture approval, operations, and incident
  response?
- Is the server intended to remain local-only, or will it be exposed to a
  trusted network or public environment?
- Which LLM providers and operating systems are supported rather than merely
  implemented?
- What are the compatibility promises for routes, database migrations, and the
  marker protocol?
- What backup, retention, privacy, and secret-handling requirements apply to
  persisted conversations?
- What quantitative product and operational success measures should be tracked?

## Intentionally unadapted at intake

- No production deployment or release process was inferred.
- No SLOs, alerts, backup policy, data-retention policy, or support rotation was
  invented.
- No reflection-loop feature, epic, implementation plan, or historical ADR was
  created from `docs/reflection.md`.
- No individual ownership was inferred from commit authors or credentials.
- No secret values, private credential files, local session database, or
  `.hyper/` runtime content was read.
