---
title: Configuration Guide
doc_kind: ops
doc_function: canonical
purpose: Configuration resolution, important runtime variables, and secret boundaries.
derived_from:
  - ../dna/governance.md
status: active
audience: humans_and_agents
---

# Configuration Guide

## Resolution Model

Declared settings live in `$setting_*` files under the owning module. The
observed resolution chain is explicit caller input, persisted SQLite setting,
declared environment binding, declared default, then caller fallback. The
settings UI exposes declared values without storing secrets in documentation.

## Important Runtime Variables

| Variable | Purpose | Default / behavior | Code owner |
| --- | --- | --- | --- |
| `PORT` | HTTP listen port | `3000` | `src/http/$start.ts` |
| `DB_PATH` | SQLite session database | `.hyper/_runtime/sessions` | `src/$main.ts` |
| `MODEL` | Default model descriptor | declaration-defined | `src/llm/$setting_defaultModel.ts` |
| `LMSTUDIO_URL` | Local OpenAI-compatible base URL | `http://localhost:1234` | `src/llm/$setting_lmstudioBaseUrl.ts` |
| `OPENAI_API_KEY` | OpenAI provider credential | none | declared LLM setting |
| `ANTHROPIC_API_KEY` | Anthropic provider credential | none | declared LLM setting |
| `KIMI_API_KEY` | Moonshot/Kimi provider credential | none | declared LLM setting |
| `GROQ_API_KEY` | Groq provider credential | none | declared LLM setting |
| `OPENROUTER_API_KEY` | OpenRouter provider credential | none | declared LLM setting |
| `LIVE_LLM` | Opt in to live provider tests | unset/off | LLM test files |

The code also reads subscription credentials maintained by the user's Codex,
Claude Code, or Kimi tools. Never copy, log, commit, or document token values.
Credential provisioning, rotation, and supported-provider ownership are unknown.


`.env` variants are ignored; `.env.test` contains only non-secret test defaults.
