---
title: Shared UI Helpers Guide
doc_kind: engineering
doc_function: reference
purpose: Curated map of shared layout, rendering, and browser-control helpers.
derived_from:
  - README.md
  - ../frontend.md
status: active
audience: humans_and_agents
---

# Shared UI Helpers Guide

| Asset | Consumers | Source |
| --- | --- | --- |
| Shared layout/sidebar | Root and agent/settings pages | `src/$layout.ts` |
| Markdown and syntax rendering | Agent events and file views | `src/markdown/` |
| UI control event helpers | Agent-driven browser actions | `src/ui/` |
| Agent event/status rendering | Agent page fragments | `src/agent/renderEventHtml.ts`, `renderStatusBar.ts` |

There is no separate component package or token library. Reuse existing server
helpers only after checking their current signatures and tests.
