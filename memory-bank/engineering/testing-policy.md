---
title: Testing Policy
doc_kind: engineering
doc_function: canonical
purpose: Automated regression, type-check, fixture, and external-provider rules for hyper-code2.
derived_from:
  - ../dna/governance.md
  - ../flows/feature.md
  - validation-profiles.md
status: active
canonical_for:
  - repository_testing_policy
  - automated_test_requirements
  - sufficient_test_coverage_definition
  - manual_only_verification_exceptions
audience: humans_and_agents
---

# Testing Policy

## Canonical Checks

```bash
bun install --frozen-lockfile
bunx tsc --noEmit
bun test --timeout 5000
```

GitHub Actions runs the same dependency, type-check, and test gates on pushes to
`main` and pull requests through
[the test workflow](../../.github/workflows/test.yml).

## Rules

- Use `bun:test`; discover tests through `*.test.ts`.
- Default tests must use `mock:*` LLM behavior and must not call paid or local
  external model providers.
- Live LLM tests may exist only behind an explicit opt-in such as `LIVE_LLM`.
- Write filesystem fixtures under `.test-tmp/`, never under scanner roots
  `src/` or `.hyper/`.
- Add regression coverage for changed behavior and target the narrow suite while
  iterating; finish with the full required checks.
- Persistence, fork, worker, marker-pair, route-fragment, and sanitization changes
  require tests at their affected contract boundaries.

## Manual Verification

Browser-visible changes require served-output verification in addition to tests.
Manual-only gaps must be stated explicitly; they do not waive type-check or the
default automated suite.

Documentation-only changes additionally run `memory-bank-cli lint`,
`memory-bank-cli doctor`, frontmatter/navigation checks, and semantic read-through.
