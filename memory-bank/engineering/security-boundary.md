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

## Current Exposure Gap

The trusted-local boundary is currently an operating assumption, not an
enforced default:

- the HTTP server binds to `0.0.0.0`;
- routes have no authentication or authorization layer;
- `POST /repl` accepts code and evaluates it inside the server process.

Consequently, any network caller that can reach the server can exercise
process-level authority. Until a delivery change closes this gap, operators must
restrict network reachability themselves and must not expose the server through
a tunnel, shared network, or public ingress.

A downstream security decision must close the unauthenticated
network-to-process-authority path before non-local or shared use is supported.
This document does not select the mechanism: binding scope, authentication,
authorization, route separation, and isolation remain design alternatives.
This does not imply an adversarial sandbox; sandboxing is a different concern.

## Target Caller-Authority Contract

[R-032](../research/R-032/decision.md) accepts the following mechanism-neutral
requirements. They are target behavior, not current implementation:

- reachability, caller authority and residual process authority are separate
  contract dimensions;
- unauthorized immediate work is denied before an authority root;
- deferred work carries authority bound to its initiating work unit rather than
  inheriting ambient agent authority;
- authority is revalidated at use time for scope, expiry, revocation, replay and
  generation freshness;
- mixed-principal queued work remains separable;
- verifier, policy and broker failures fail closed;
- authority-bearing values do not enter LLM-visible input or durable
  action-result context.

The target contract does not select bind scope, Unix sockets, authentication,
capabilities, route separation, process separation or a layered realization.
Dynamic-route inheritance, concrete reachability, client lifecycle and process
isolation remain downstream decision obligations for the mechanism proposed.

Secret non-transit is a target contract, not current system behavior. Secret
values must not enter LLM-visible input or action-result context. A bounded
validated sample below demonstrates current non-conformance; completeness and
its realization still belong to downstream security research/design.

## Validated Gap Evidence

- [R-029 decision](../research/R-029/decision.md) validates, for the fixed
  committed-`src` baseline, that all 36 dispatch entries lack a common or
  route-local caller identity/auth control. This does not cover runtime `.hyper`
  overlays, external middleware or actual interface reachability.
- [R-018 decision](../research/R-018/decision.md) validates that the sampled
  declared-secret route sends a deterministic synthetic value into result,
  persistence, rendering and pre-provider model-request sinks. This does not
  generalize to every secret source or select an enforcement mechanism.

These records strengthen the current-gap statements; they do not change the
trusted-local operating boundary or authorize non-local/shared deployment.

## Implementation Evidence

- [In-process eval](../../src/repl/eval.ts) — arbitrary generated code execution.
- [HTTP listener](../../src/http/$start.ts) — current all-interface bind and
  unauthenticated route dispatch.
- [REPL route](../../src/repl/$route__POST.ts) — current network-to-eval path.
- [Shell execution](../../src/agent/executeBash.ts) — `bash -c` boundary.
- [Filesystem resolution](../../src/files/resolveSafe.ts) — intentional access outside cwd.
- [Provider credentials](../../src/llm/resolveEndpoint.ts) — environment and local credential sources.
