---
title: "EP-003: Self-update From GitHub Releases"
doc_kind: epic
doc_function: canonical
purpose: "Govern the delivery of a verified, atomic hcode self-update path from GitHub Releases."
derived_from:
  - ../../flows/epic.md
  - ../../ops/release.md
  - ../../../README.md
  - https://github.com/dapi/hyper-code2/issues/53
status: active
audience: humans_and_agents
must_not_define:
  - code_steps
  - final_artifact_implementation
---

# EP-003: Self-update From GitHub Releases

## Origin And Epic Route

| Field | Value |
| --- | --- |
| Source / trigger | Owner request and GitHub epic #53 |
| Epic owner / decision owner | Danil Pismenny |
| Why Epic | Release packaging, CLI behavior, installation safety and failure verification are separate delivery units with shared compatibility and recovery contracts |
| Intake proposal | Not used; direct Bootstrap Epic |
| GitHub epic | [#53](https://github.com/dapi/hyper-code2/issues/53) |

## Problem

`hcode` currently has no supported self-update command. Releases are GitHub tags
and Releases, but the project does not yet publish a verified installation
artifact or define how an existing installation is replaced safely.

## Outcome

An operator can inspect and install a stable `hcode` version from the pinned
GitHub repository. Release metadata is verified before activation, activation is
atomic and recoverable, and workspace files plus durable session state remain
untouched.

## Scope

- `hcode update`, `hcode update --check`, and explicit stable version selection.
- A documented release artifact and integrity/compatibility contract.
- Pre-runtime update execution without starting the agent or workspace runtime.
- Safe temporary download/extraction, validation, activation and rollback.
- Automated release, CLI, failure and recovery verification.

## Non-Scope

- npm publication.
- Updating arbitrary git checkouts with uncommitted changes.
- Automatic prerelease channels.
- Multi-platform standalone binaries unless the artifact decision selects them.
- Changes to agent conversation/session semantics.

## Acceptance

- A stable release can be checked and installed through the supported installation mode.
- Integrity, SemVer and Bun compatibility are validated before activation.
- Failed update operations preserve a runnable previous installation.
- `--check` and update do not create workspace state or contact an LLM.
- Existing workspace sessions remain available after update.
- Release and operator documentation describe artifact production and recovery.
