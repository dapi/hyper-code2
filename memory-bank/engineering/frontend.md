---
title: Frontend Engineering
doc_kind: engineering
doc_function: canonical
purpose: Browser UI stack, delivery model, and verification contract for hyper-code2.
derived_from:
  - ../dna/governance.md
  - ../product/context.md
status: active
audience: humans_and_agents
---

# Frontend Engineering

The project has one local web application for agent and settings workflows. It
uses server-rendered HTML, htmx attributes for requests and polling, Tailwind via
CDN, and a small browser-script layer. There is no separate frontend package,
native application, or documented public/admin split.

## Source Boundaries

- [Shared layout](../../src/$layout.ts) and root routes own page composition and navigation.
- [Agent page route](../../src/agent/$route_$id_GET.ts) and render functions own agent pages and fragments.
- [Chat script](../../src/agent/$script_chat.js) owns chat browser behavior.
- [UI browser bundle](../../src/ui/$script_bundle.entry.ts) and sibling helpers
  own control-event transport and browser scripts.
- [Markdown renderer](../../src/markdown/render.ts) and sibling helpers own
  Markdown rendering, highlighting, and diagrams.

## Interaction Contract

- New event HTML arrives by per-agent long-poll and carries the next cursor.
- Status and sidebar fragments poll independently.
- Normal forms and htmx routes are preferred over a client-side state store.
- Server output must remain valid and safely rendered; raw model HTML passes
  through the project sanitization path.

## Verification

Run targeted route/render tests, the full default suite, and type-check. For a
UI change, start the actual server, read its port from `.hyper/_runtime/port`,
and verify the served asset/route rather than relying only on source inspection.
Responsive, accessibility, localization, and supported-browser policies are not
documented and remain explicit gaps.
