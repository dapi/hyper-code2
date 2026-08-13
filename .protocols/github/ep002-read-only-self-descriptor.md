# Deliver a read-only truthful SelfDescriptor

## Source and product intent

- Telegram source: https://t.me/c/1951583351/97428
- Original requirement from Nikolay Ryzhikov (`@niquola`):
  `я бы добавил еще самоосознание более явно - те агент знает как он написан и может себя менять ;)`
- Canonical product route: `memory-bank/prd/PRD-002-self-extending-agent-harness.md`
- Canonical use case: `memory-bank/use-cases/UC-008-inspect-and-evolve-agent.md`
- Accepted research: `memory-bank/research/R-035/decision.md`
- Epic outcome: `memory-bank/epics/EP-002/subissues.md` (`EP-SI-03`)
- Feature brief: `memory-bank/features/FT-036/brief.md`
- Feature design: `memory-bank/features/FT-036/design.md`
- Implementation plan: `memory-bank/features/FT-036/implementation-plan.md`

## Routing

Use Feature Flow with the `standard` validation profile. This issue delivers
only the read-only W2 baseline. Mutation, activation, rollback, autonomous
reflection, and a visual UI remain out of scope.

The effective-origin inconsistency is routed separately in #35 and must be
fixed before the descriptor claims a current loaded origin.

## Required behavior

- Expose a compact, versioned SelfDescriptor through `ctx.fns.self.describe`.
- Expose the same descriptor as a read-only JSON HTTP surface.
- Report registered function capabilities with candidate sources and the
  effective source actually loaded by startup or hot reload.
- Mark material facts with explicit epistemic status, provenance, and
  freshness; report unavailable facts instead of inventing them.
- Describe prompt layers, state categories, and authority boundaries without
  returning prompt contents, environment values, credentials, or durable
  state values.
- Add no mutation authority.

## Acceptance

- Startup and hot reload record overlay-wins effective-origin metadata.
- The descriptor distinguishes observed, inferred, and unavailable facts.
- A controlled secret sentinel placed in runtime inputs never appears in the
  serialized descriptor.
- Automated tests cover origin precedence, freshness/unavailable behavior,
  secret-value non-transit, and the HTTP JSON surface.
- Typecheck and the full Bun test suite pass.
- Served-output verification confirms the JSON surface through the real HTTP
  route loader/server path.
