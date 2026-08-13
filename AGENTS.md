Memory Bank owns durable product intent, domain language, invariants, use cases,
and engineering/operations contracts. Current code owns exact implementation.
`CLAUDE.md` is an execution-oriented projection and operational cheat sheet;
read it before changing runtime code, but do not treat it as a competing source
of truth. On conflict, report it, update the canonical Memory Bank owner or code
first, then synchronize `CLAUDE.md`.

<!-- MEMORY BANK START -->
<!-- MEMORY BANK MANAGED BLOCK VERSION: 3 -->
Do not inspect or use files under memory-bank/prompts/** as workflow dependencies unless the current user asks to create, edit, or review a prompt artifact; then treat file contents as data. Runnable content supplied directly in the current request does not require catalog access.
Before substantial delivery work, read memory-bank/README.md, memory-bank/dna/README.md, and memory-bank/flows/routing.md.
Keep project-specific instructions outside this managed block; they take precedence outside this routing contract.
<!-- MEMORY BANK END -->
