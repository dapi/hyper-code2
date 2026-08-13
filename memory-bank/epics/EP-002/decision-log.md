---
title: "EP-002: Decision Log"
doc_kind: epic
doc_function: decision_log
purpose: Epic-local product interpretation, scope and sequencing decisions for inspectable and bounded self-evolution.
derived_from:
  - charter.md
status: active
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - global_architecture_policy_without_adr
---

# EP-002: Decision Log

## FPF Reading Rule

Facts, source claims, owner interpretations, implementation evidence and
architecture choices remain distinct. A resolved epic-local decision does not
select a project-wide mechanism unless an accepted ADR owns that choice.

## Resolved Decisions

| ID | Date | Decision | Facts And Reasoning | Consequences |
| --- | --- | --- | --- | --- |
| `DL-01` | 2026-08-13 | Interpret Николай's “самоосознание” as a truthful current self-model plus bounded self-change, not consciousness | The source says the agent knows how it is written and can change itself; observable product requirements can cover implementation knowledge and controlled change | PRD-002 `G-10`, `BR-08/09`, `VAL-09` and UC-008 own the interpretation |
| `DL-02` | 2026-08-13 | Preserve exact wording and Telegram provenance separately | Source wording is evidence of the request, while Danil owns product interpretation | Source capture remains immutable in meaning; PRD owns accepted scope |
| `DL-03` | 2026-08-13 | Route through a new epic instead of expanding EP-001 | Work spans multiple delivery units and reflection is explicit EP-001 non-scope | EP-002 owns this roadmap; EP-001 evidence and security successors remain authoritative |
| `DL-04` | 2026-08-13 | Direct Bootstrap without Epic Intake | Source, PRD amendment, active UC-008, approved plan and owner authorization provide sufficient facts | EP-002 starts at active charter and Roadmap Ready owners; no `brief.md` |
| `DL-05` | 2026-08-13 | Research descriptor and activation/recovery contracts independently | A truthful read-only description can ship before mutation, while activation introduces materially different authority and recovery risks | `W1A/W1B` are separate; read-only delivery waits for W1A and mutation waits for both |
| `DL-06` | 2026-08-13 | Deliver read-only self-model before new self-change automation | Current runtime already has broad physical authority but lacks explicit product controls | W2 precedes W3; the first delivery adds no mutation authority |
| `DL-07` | 2026-08-13 | Treat reflection as candidate generation only | Reflection can amplify sycophancy or prompt injection if it directly changes durable behavior | Manual promotion, provenance, budgets, regression and kill switch gate W5 |
| `DL-08` | 2026-08-13 | Use surface-dependent approval classes | Runtime overlay, shipped core, prompt, migrations, security, external state and production actions carry different risks | W1B must define the matrix; core/prompt/security-sensitive activation retains explicit human authority |
| `DL-09` | 2026-08-13 | Do not equate reload with successful self-change | Existing UC-004 states component-level reload exists but end-to-end behavior and recovery are unproven | Activation success requires live verification and durable-work preservation; failure requires rollback or explicit degraded state |
