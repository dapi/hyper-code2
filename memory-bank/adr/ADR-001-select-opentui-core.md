---
title: "ADR-001: Select OpenTUI Core"
doc_kind: adr
doc_function: canonical
purpose: "Selects the terminal rendering and input substrate for the hcode full-screen interface."
derived_from:
  - ../product/vision.md
  - ../engineering/architecture.md
status: active
decision_status: accepted
date: 2026-08-15
decision_makers:
  - Codex implementation agent
consulted:
  - Danil Pismenny
informed: []
audience: humans_and_agents
must_not_define:
  - current_system_state
  - implementation_plan
---

# ADR-001: Select OpenTUI Core

## Context

`hcode` needs a full-screen terminal surface with flex layout, Unicode/wide
characters, multiline editing, scrollback, resize handling, deterministic
input simulation, and reliable cleanup. The project is Bun-first and procedural;
adding React or Solid solely for the TUI would create a second application
framework. Hand-written ANSI rendering would make terminal correctness and test
infrastructure part of the product's maintenance burden.

The decision is required now because the first TUI feature cannot stabilize its
component, input, test, or cleanup contracts until it has a rendering substrate.

## Decision Boundaries

- Applies to the shipped `hcode` full-screen terminal adapter and its automated
  terminal rendering/input tests.
- Does not choose a PTY/process backend, approval UI protocol, browser
  framework, or general cross-client structured UI format.
- Does not require the React or Solid OpenTUI bindings.

## Decision Drivers

1. Bun 1.3.x compatibility and direct TypeScript use.
2. Deterministic in-memory frame, input, resize, and capability tests.
3. Native support for multiline input, scrollable content, Unicode, and terminal cleanup.
4. Minimal conceptual/framework overhead in the existing procedural codebase.
5. A maintained substrate already used by a production coding-agent TUI.

## Considered Options

| Option | Benefits | Costs | Disposition rationale |
| --- | --- | --- | --- |
| Imperative `@opentui/core` | Bun-first API, native renderer, textarea/scrollbox primitives, deterministic test renderer, no UI framework | Native package dependency; upstream API is still evolving | Best match for runtime and verification drivers |
| Ink/React | Mature declarative model and testing ecosystem | Adds React/runtime model, raw-mode behavior depends on Node streams, more reconciliation overhead | Viable, but conflicts with procedural/minimal-framework direction |
| Blessed/neo-blessed | Full widget set and established terminal model | Older maintenance/typing model and weaker modern deterministic test tooling | Viable for simple screens but higher long-term compatibility burden |
| Custom ANSI renderer | No dependency and total control | Must implement width, input editing, resize, diff rendering, cleanup, and test driver correctly | Rejected because terminal machinery would dominate the feature |

## Decision

Use the imperative `@opentui/core` package as the full-screen TUI rendering,
layout, input, and deterministic test substrate. Do not add React or Solid
bindings. Keep domain/runtime orchestration outside OpenTUI components so a
future renderer can replace it without changing durable agent semantics.

The implementation baseline is `@opentui/core` `0.5.x`; FT-009 must pin the
selected exact version through `package.json` and `bun.lock`. Version updates
remain ordinary reviewed dependency changes and must pass the terminal
compatibility suite.

## Consequences

### Positive

- The feature can use tested textarea, scrollbox, layout, key input, and resize primitives.
- Tests can capture exact in-memory frames and drive keyboard/resize without a host terminal.
- The adapter stays imperative and compatible with the procedural project style.

### Negative

- Installation gains native platform packages and a larger dependency surface.
- Upstream API churn may require adapter maintenance.
- Unsupported platforms can fail at dependency/runtime load before a broader
  support matrix exists.

### Neutral / Organizational

- Terminal behavior belongs behind an `hcode` adapter boundary; business and
  durable runtime code must not import OpenTUI.
- CI must install the locked package and exercise its Linux native artifact.

## Risks And Mitigation

- Native artifact availability: verify frozen install and a real test-renderer
  invocation on macOS locally and Ubuntu CI.
- API churn: centralize OpenTUI construction and key handling in the TUI module;
  avoid exporting OpenTUI types through runtime contracts.
- Terminal corruption: always destroy the renderer in `finally` and retain a
  separate PTY smoke for host-terminal lifecycle.

## Confirmation

- Owner: FT-009 implementation and reviewers.
- Evidence: frozen `bun install`, OpenTUI test-renderer frames/input/resize tests,
  host PTY cleanup smoke, full Bun suite, and GitHub Actions on Ubuntu.
- Evidence location: FT-009 PR verification summary and CI checks.

## Reconsideration Conditions

Reconsider or supersede this ADR if OpenTUI drops supported Bun/platform
artifacts, cannot restore the terminal reliably, makes the locked install
non-reproducible, or prevents required terminal accessibility/correctness.

## Follow-up

- FT-009 design owns the adapter/event interaction and terminal lifecycle.
- `memory-bank/engineering/architecture.md` should describe OpenTUI only after
  the shipped adapter is accepted; code remains the current-state owner meanwhile.

## Related Links

- [OpenTUI repository](https://github.com/anomalyco/opentui)
- [OpenTUI testing guide](https://opentui.com/docs/core-concepts/testing/)
