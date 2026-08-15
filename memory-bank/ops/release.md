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

## Scope

Releases are GitHub tags and GitHub Releases only. `package.json` remains
private: this process does not publish npm packages, create deployable
artifacts, or deploy to an environment.

## Current Merge Gate

```bash
bun install --frozen-lockfile
bunx tsc --noEmit
bun test --timeout 5000
```

## GitHub Tag / Release Process

1. Select the SemVer version and confirm that the release is authorized.
2. Update `package.json` to the selected version. Move the relevant
   `CHANGELOG.md` entries from `Unreleased` into a dated version heading.
3. On the intended `main` commit, run the current merge gate and confirm the
   working tree is clean.
4. Create an annotated `v<version>` Git tag on that commit, push it, then
   create a GitHub Release pointing at the tag. Its notes summarize the matching
   changelog section and identify the target commit.
5. Verify that the remote tag resolves to the intended `main` commit and that
   the GitHub Release references the same tag.

Creating or changing a remote tag or GitHub Release is an external action and
requires explicit user authorization for that release.

## Correction Policy

Published tags and releases are immutable release records. A correction uses a
new version and a new GitHub Release; do not retag or silently replace a
published release. Removing a release or remote tag requires separate explicit
authorization.
