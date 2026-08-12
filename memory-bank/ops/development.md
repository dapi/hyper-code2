---
title: Development Environment
doc_kind: ops
doc_function: canonical
purpose: Local setup, Bun startup, tests, browser verification, and database behavior.
derived_from:
  - ../dna/governance.md
status: active
audience: humans_and_agents
---

# Development Environment

## Prerequisites

- Git and Bun.

## Initialization

```bash
./init.sh
```

The initializer installs Bun dependencies from `bun.lock`. It does not copy secret files
or credential stores into the repository.

## Daily Runtime Commands

```bash
bun src/$main.ts
bun script/repl.ts '1 + 1'
bunx tsc --noEmit
bun test --timeout 5000
```

[CLAUDE.md](../../CLAUDE.md) documents the tmux and hot-reload REPL workflow.

## Browser Verification

The server writes its actual port to `.hyper/_runtime/port`; the default is 3000
and `PORT` can override it. Read the file after startup, then verify the served
route or asset. Source inspection alone is insufficient when a runtime overlay
or loaded route may supersede it.

## Database And Services

The default SQLite path is `.hyper/_runtime/sessions`; `DB_PATH` can override it.
Migrations apply on startup. No external database or queue is required. LLM
providers are optional runtime integrations; default tests use the mock provider.

Deleting or replacing the runtime database destroys local agent history and is
not an ordinary setup step.
