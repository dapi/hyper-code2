---
title: "EP-001: Validate Reusable Self-Extension"
doc_kind: epic
doc_function: canonical
purpose: "Govern the evidence-led validation of reusable self-extension and the contract, security and architecture work needed to turn PRD-002 into bounded delivery units."
derived_from:
  - ../../flows/epic.md
  - ../../prd/PRD-002-self-extending-agent-harness.md
  - ../../product/metrics.md
  - ../../domain/rules.md
  - ../../engineering/security-boundary.md
status: active
audience: humans_and_agents
must_not_define:
  - implementation_sequence
  - feature_issue_ids_not_approved
---

# EP-001: Validate Reusable Self-Extension

## Origin And Epic Route

| Field | Value |
| --- | --- |
| Source / trigger | Active PRD-002 and owner request dated 2026-08-13 |
| Epic owner / decision owner | Danil Pismenny |
| Why Epic | End-to-end product evidence, independent contract/security gaps and conditional architecture decisions require multiple governed units and shared risk control |
| Intake proposal | Not used; direct Bootstrap Epic |
| GitHub epic | [#24](https://github.com/dapi/hyper-code2/issues/24) |

## Problem

PRD-002 accepts reusable self-extension as an experimental product initiative,
but no representative-task baseline or complete end-to-end reuse evidence exists.
The current GitHub issue set predates the accepted PRD and mixes useful design
inventory with unaccepted implementation choices. Active fork and secret-handling
contracts also have known implementation gaps. Executing the old issue DAG
directly would turn hypotheses and proposed mechanisms into an implicit roadmap.

## Outcome

The epic produces:

- an evidence-backed verdict for the central reusable self-extension hypothesis;
- a bounded experiment contract and representative-task baseline;
- separately governed contract and security work;
- an evidence-backed architecture disposition that preserves ordinary function composition unless a replacement is justified;
- issue and feature handoffs that do not invent epic-level facts.

## Stakeholder Channels

| Channel | ID / URL | Purpose |
| --- | --- | --- |
| Product decision | Danil Pismenny, owner approval dated 2026-08-13 | Scope, stop/continue and hypothesis verdict |
| Product source | [PRD-002](../../prd/PRD-002-self-extending-agent-harness.md) | Authoritative initiative intent and validation posture |
| Scenario input | [Draft UC-005](../../use-cases/UC-005-extend-and-reuse-capability.md) | Candidate observable self-extension/reuse scenario, not implementation proof |
| Delivery tracker | [GitHub #24](https://github.com/dapi/hyper-code2/issues/24) | Subissue status and execution coordination |
| Existing design inventory | GitHub issues `#10`, `#12`, `#14`, `#16`, `#17`, `#18`, `#19` | Inputs to triage and decisions, not roadmap authority |

## Scope

- `REQ-01` Define 2–3 representative tasks, baseline, success threshold,
  measurement method and measurement owner before the corresponding experiment.
- `REQ-02` Test the draft UC-005 outcome on the current runtime: relevant
  functions can be found or composed, useful work may be retained explicitly,
  and a retained callable capability can be used in later relevant work.
- `REQ-03` Preserve alternate outcomes: reuse of an existing capability and
  intentionally one-off code are valid; the epic does not impose a universal lifecycle.
- `REQ-04` Split issue `#17` into bounded identity, immutable-fork and migration
  outcomes before implementation.
- `REQ-05` Create an independent outcome for closing the current unauthenticated
  network-to-process-authority gap without preselecting the mechanism.
- `REQ-06` Route secret non-transit through research, controlled sentinel
  evidence and only then boundary-specific delivery.
- `REQ-07` After experiment evidence exists, evaluate compact result/diagnostic
  separation and compare current `ctx.fns` composition with issues `#14/#16`.
- `REQ-08` Transfer only accepted outcomes from issue `#10`; do not execute its
  dependency DAG as the authoritative roadmap.
- `REQ-09` Keep every research or delivery unit independently routed and reviewed.

## Non-Scope

- `NS-01` TUI implementation and GitHub issue `#1`; TUI remains a separate supporting stream.
- `NS-02` Reflection, bounded sleep and context consolidation; they remain later initiatives around draft `UC-006/007`.
- `NS-03` Multi-user access, team workflow or multi-tenant operation.
- `NS-04` An adversarial sandbox or delivery of GitHub issue `#3`.
- `NS-05` Public or production deployment.
- `NS-06` A marketplace or automated capability curation.
- `NS-07` A bounded domain-practitioner surface.
- `NS-08` Selection of exact schemas, migrations, APIs, authentication mechanism,
  projection kernel or mediated execution design inside the epic.
- `NS-09` Real credentials or secret values in experiments.
- `NS-10` Treating `discover -> compose -> save -> verify -> reuse` as a mandatory lifecycle.

## Source / Evidence Boundaries

| Source | Authority | Refresh rule |
| --- | --- | --- |
| PRD-002 | Product problem, goals, scope, rules and validation posture | Update epic owners after any PRD change |
| Product metrics | Absence of approved baseline, thresholds and measurement owner | Resolve them in the experiment contract rather than inventing project-wide metrics |
| Domain rules and active UC-001…004 | Existing durable/action/fork contracts | Never weaken an active invariant to match current code |
| Draft UC-005 | Candidate scenario for validation | Keep draft until its own Activation Gate |
| Security boundary | Current authority and exposure gaps | Refresh before every security handoff |
| Existing GitHub issues | Design proposals and technical inventory | Re-read before mutation; not architecture authority |
| Current code and tests | Exact implementation behavior | Re-ground separately in each research/feature flow |

## Acceptance

| Criterion | Check |
| --- | --- |
| `EAC-01` | Representative tasks, baseline, thresholds, method and owner are recorded before the experiment |
| `EAC-02` | Evidence distinguishes existing capability use, composition, explicit retention and later reuse without requiring all paths in every task |
| `EAC-03` | `VAL-01…VAL-05` receive a supported, unsupported or inconclusive verdict with limitations |
| `EAC-04` | `VAL-08` uses only controlled sentinel values and records checked LLM-visible boundaries |
| `EAC-05` | Fork, network-authority and secret gaps have bounded owner issues without inherited mechanism choices |
| `EAC-06` | Architecture comparison records evidence, alternatives and consequences; any global decision is promoted to an ADR |
| `EAC-07` | Useful outcomes from issue `#10` are transferred and its old DAG is explicitly superseded or narrowed |
| `EAC-08` | TUI, sandbox, reflection/consolidation, multi-user and domain-practitioner delivery have not entered implicitly |
| `EAC-09` | Every execution unit has its own route, package when required, and validation decision where applicable |
| `EAC-10` | Danil Pismenny records the final continue, revise, park or stop verdict |

## Handoff

Research uses separate governed research packages. Delivery uses separate
`memory-bank/features/FT-<issue>/` packages. The epic does not own code-level plans.
