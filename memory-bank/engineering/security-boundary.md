---
title: Trust And Security Boundary
doc_kind: engineering
doc_function: canonical
purpose: Canonical trust assumptions and execution authority of hyper-code2.
derived_from:
  - ../dna/governance.md
  - ../product/context.md
  - architecture.md
status: active
audience: humans_and_agents
canonical_for:
  - trusted_execution_boundary
  - filesystem_authority
  - shell_eval_authority
  - credential_boundary
  - unsupported_exposure
---

# Trust And Security Boundary

hyper-code2 is a trusted developer tool. An agent runs with the operating-system
permissions, environment, network access, and local credentials available to the
server process. It is not an adversarial sandbox.

## Effective Authority

- `eval` executes generated TypeScript/JavaScript inside the server process.
- `bash` executes arbitrary shell snippets.
- File helpers accept absolute paths and paths outside the current repository.
- Provider integrations may read credentials maintained by Codex, Claude Code,
  Kimi, environment variables, or persisted settings.

## Required Trust Assumptions

- Run only models, prompts, issues, repositories, and users trusted to exercise
  the process authority granted to the agent.
- Do not expose the HTTP server as a public or multi-tenant service without a new
  authentication, authorization, isolation, and secret-handling design.
- Do not treat workspace-write sandbox wording as confinement of hyper-code2 file
  helpers; those helpers are intentionally de-sandboxed.
- Conversation data and action results may contain source code or sensitive data;
  no retention, analytics, or external-publication policy is currently approved.

## Implementation Evidence

- [In-process eval](../../src/repl/eval.ts) — arbitrary generated code execution.
- [Shell execution](../../src/agent/executeBash.ts) — `bash -c` boundary.
- [Filesystem resolution](../../src/files/resolveSafe.ts) — intentional access outside cwd.
- [Provider credentials](../../src/llm/resolveEndpoint.ts) — environment and local credential sources.
