---
title: "R-014: Research Plan"
doc_kind: research
doc_function: canonical
purpose: "Controlled comparison method for capability discovery and invocation surfaces."
derived_from: [brief.md, ../../flows/research.md]
status: active
audience: humans_and_agents
---
# R-014: Research Plan

## Method

Run the same UC-005 fixtures and fixed prompts against the current surface and the
smallest disposable projection for each viable alternative. Compare exact output,
wrong-signature calls, discovery turns/tokens, ordinary function composition,
authority visibility, migration cost and implementation complexity. A paper API
description is not equivalent to runtime evidence.

## Controls and stop rules

- Keep model, fixtures, call budget and golden outputs fixed.
- Fail any alternative that hides an incorrect action result behind successful prose.
- No real secrets or network exposure.
- Stop before production code or ADR; synthesize for the decision owner.

## Plan Approval

| Field | Value |
| --- | --- |
| Reviewer / decision owner | Danil Pismenny |
| Approval reference | Pending owner approval of comparative instrument |
