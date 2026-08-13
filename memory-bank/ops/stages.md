---
title: Stages And Non-Local Environments
doc_kind: ops
doc_function: canonical
purpose: Explicitly records the current absence of documented non-local environments.
derived_from:
  - ../dna/governance.md
status: active
audience: humans_and_agents
---

# Stages And Non-Local Environments

`N/A / unknown`: no production, staging, preview, sandbox, cluster, remote host,
health endpoint, logs platform, metrics backend, trace system, or error tracker is
defined in this repository.

The local Bun server is the only evidenced runtime environment. Do not infer a
deployment target from GitHub Actions, provider integrations, or the ability to
bind an HTTP port. Any non-local operation requires a separately documented
environment owner, access path, safety boundary, and approval contract.
