# EP-002 Inspectable And Bounded Self-Evolution Protocol

## Protocol Metadata

- Protocol and decision owner: Danil Pismenny
- Orchestrator: Codex
- Started: 2026-08-13
- Authorization: Danil Pismenny, `ok, создай отдельную ветку через git worktree, сохрани там это проектокол и приступай к выполнению`
- Branch: `feature/inspectable-self-evolution`
- Worktree: `~/.worktrees/hyper-code2-self-evolution`
- Base revision: `e301161a70ca685feedfaa5bfba0d3580c73e3f7`
- Protocol status: `in_progress`

## Primary Source

- Author: Николай Рыжиков (`@niquola`)
- Telegram: https://t.me/c/1951583351/97428
- Original requirement: `я бы добавил еще самоосознание более явно - те агент знает как он написан и может себя менять ;)`
- Source capture: [`memory-bank/product/sources/2026-08-13-niquola-self-awareness-comment.txt`](../memory-bank/product/sources/2026-08-13-niquola-self-awareness-comment.txt)

## Accepted Interpretation

The requirement is implemented as inspectable and bounded self-evolution, not
as a claim of consciousness. The agent must be able to obtain a current,
source-grounded model of its implementation and authority, propose changes to
allowed surfaces, verify them, activate them only under the applicable policy,
and preserve an observable rollback path.

## Execution Plan

| ID | Workstream | Status | Gate |
| --- | --- | --- | --- |
| `SE-01` | Amend PRD-002 with explicit self-model and bounded self-change requirements | `completed` | Product owner acceptance and downstream sync |
| `SE-02` | Activate UC-008 as the canonical inspect-and-evolve scenario | `completed` | Use Case Activation Gate |
| `SE-03` | Bootstrap EP-002 and make its roadmap ready | `completed` | Epic Roadmap Ready gate |
| `SE-04` | Resolve the SelfDescriptor contract | `completed` | R-035 validated by owner; ADR trigger retained |
| `SE-05` | Resolve activation, verification, and rollback contracts | `completed` | R-036 validated by owner; mutation delivery remains separately gated |
| `SE-06` | Deliver the read-only self-model slice | `in_progress` | Routed feature, validation profile, verified runtime behavior; #35 is a separate prerequisite |
| `SE-07` | Deliver bounded `.hyper/` self-change | `pending` | Activation/rollback contract accepted and security gates satisfied |
| `SE-08` | Deliver reflection-to-candidate flow | `pending` | Manual promotion, budget, provenance, regression, and kill-switch policy accepted |

## Guardrails

- Preserve the exact source wording and URL separately from product interpretation.
- Runtime and current source are authoritative for implementation facts; an
  LLM's remembered self-description is not evidence.
- Do not give the agent additional process authority as part of self-awareness.
- Reflection may propose candidates but may not silently activate code, prompt,
  policy, or durable behavioral changes.
- Core, base-prompt, migration, security-boundary, destructive, external, and
  production changes require explicit human authority.
- `.hyper/` remains an experimental/runtime overlay and may not become hidden core.
- Every activated self-change must be observable, verified, attributable, and reversible.
- Do not start mutation delivery until the activation and rollback contracts are accepted.
- Keep EP-001 unchanged except for any later explicit cross-reference; reflection
  remains outside its scope.

## Completion Conditions

- [x] Source wording and Telegram provenance are indexed.
- [x] PRD-002, UC-008, product roadmap, and EP-002 agree.
- [x] EP-002 reaches Roadmap Ready with risks, decisions, gates, and subissues.
- [x] First research and delivery handoffs have explicit routes and owners.
- [x] `memory-bank-cli lint` passes.
- [x] `memory-bank-cli doctor` has no errors.
- [x] `git diff --check` passes.
- [ ] Runtime delivery, when started, passes its selected validation profile.
