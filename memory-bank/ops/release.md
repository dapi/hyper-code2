---
title: Release And Deployment
doc_kind: ops
doc_function: canonical
purpose: Current release evidence, required checks, and explicit deployment gaps.
derived_from:
  - ../dna/governance.md
status: active
audience: humans_and_agents
---

# Release And Deployment

No versioning, artifact publication, deployment, production approval, smoke-test,
or rollback process is documented. `package.json` is private and has no release
scripts. GitHub Actions validates code but does not deploy it.

## Current Merge Gate

```bash
bun install --frozen-lockfile
bunx tsc --noEmit
bun test --timeout 5000
```

This is a repository quality gate, not a release flow. Do not publish packages,
create releases, deploy, or describe a rollback path without an explicit owner
and new operational contract.
