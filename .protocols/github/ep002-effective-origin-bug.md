## Problem

`.hyper` loads after `src` and is the accepted runtime-overlay winner when both
roots define the same registered function. Startup loading follows that rule,
but `ctx.fns.repl.load` searches `src` first and returns on the first match.

## Expected behavior

Reloading one function or a namespace resolves the same effective source as
startup: for duplicate registered names, the later `.hyper` root wins.

Sources:

- `CLAUDE.md` `.hyper/` extension contract
- `memory-bank/use-cases/UC-004-hot-reload-capability.md` `ALT-01`
- `memory-bank/research/R-035/evidence.md` `OBS-04/05`

## Actual behavior and reproduction

At revision `e301161a70ca685feedfaa5bfba0d3580c73e3f7`,
`src/repl/load.ts:36-55` iterates roots in `src`, `.hyper` order and returns the
first existing candidate. A duplicate overlay therefore reloads the core file.
Whole-module reload repeats the same first-match lookup.

## Route

- Flow: Bug Fix
- Validation profile: `standard`
- Rationale: changes effective function-resolution semantics and requires
  regression coverage for single-function, namespace and non-overlay paths.
- Rollout/backout: local code change; revert the commit. No production action.

## Acceptance

- A regression test fails on the grounded implementation and passes after the fix.
- Single-function reload selects `.hyper` for a duplicate registered name.
- Namespace reload selects `.hyper` for a duplicate and loads unique functions from both roots.
- Existing `src`-only and `.hyper`-only reload behavior remains working.
- `bunx tsc --noEmit` and the full test suite pass.
