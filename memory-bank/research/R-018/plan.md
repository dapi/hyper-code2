---
title: "R-018: Research Plan"
doc_kind: research
doc_function: canonical
purpose: "Boundary inventory and sentinel experiment method for R-018."
derived_from: [brief.md, ../../flows/research.md]
status: active
audience: humans_and_agents
---
# R-018: Research Plan

Inventory every place that constructs model input, synthetic action result/error,
persistence record or external rendering. Inject deterministic non-secret sentinels
at declared-secret sources and exercise success, thrown-error, serialization and
retry paths. Search exact and transformed sentinel forms in captured requests,
messages and events. Compare mechanisms only after the failing boundaries are known.

Controls: disposable local database, no HTTP, no real secrets, fixed sentinel, and
fail closed on any transit. A clean first UC-005 sentinel is only instrument smoke
evidence and is not a general guarantee.
