---
title: Web Agent UI Guide
doc_kind: engineering
doc_function: reference
purpose: Current routes, fragments, and source entry points for the browser agent UI.
derived_from:
  - README.md
  - ../frontend.md
status: active
audience: humans_and_agents
---

# Web Agent UI Guide

## Entry Points

- `src/$route_GET.ts` — root redirect or empty-state page.
- `src/$layout.ts` — shared layout and sidebar.
- `src/agent/$route_new_*` — new-agent form and creation.
- `src/agent/$route_$id_*` — agent page, actions, status, and event fragments.
- `src/settings/$route_declared_*` — declared settings UI.
- `src/agent/$script_chat.js` and `src/ui/` — browser behavior and control events.

## Patterns

- Server-rendered HTML and htmx requests; no client-side application store.
- Long-poll event tail with durable per-agent cursor.
- Independent status/sidebar refresh fragments.
- Classic POST/redirect for actions such as fork/archive where appropriate.
- Markdown, highlighting, and Mermaid rendering through `src/markdown/`.

Verify actual served HTML and assets after route or script changes. No supported
browser matrix, localization contract, or screenshot baseline is documented.
