---
title: "R-036: Research Synthesis"
doc_kind: research
doc_function: canonical
purpose: Findings, minimum state contract, candidate direction and limitations for self-change activation and recovery.
derived_from:
  - brief.md
  - evidence.md
status: active
audience: humans_and_agents
---

# R-036: Research Synthesis

## Findings

| ID | Finding | Evidence | Confidence | Implication |
| --- | --- | --- | --- | --- |
| `FND-01` | Current write/edit/reload behavior is observable but is neither proposal-gated nor automatically reversible. | `OBS-01/03/04/07` | high | Reject `CAND-01` as bounded self-change contract |
| `FND-02` | Existing eval, bash and unrestricted filesystem paths bypass any newly added voluntary self-change API. | `OBS-02/09` | high | First delivery may claim policy-governed path, not comprehensive enforcement, unless authority is separately mediated |
| `FND-03` | One universal activation/rollback mechanism is inappropriate across overlays, core, prompt, migrations, security and external/production surfaces. | `OBS-05/06/08/09`, surface matrix | high | Adopt surface-dependent policy and recovery contracts |
| `FND-04` | For `.hyper`, a versioned candidate generation plus candidate-independent restore direction best supports attributable activation and recovery. | Candidate comparison, `OBS-04/10` | medium | Supports `CAND-03` direction after origin semantics are resolved; exact mechanism needs prototype/ADR assessment |
| `FND-05` | Core and prompt changes fit repository-governed review/revert better than untracked overlay activation. | `OBS-08/09`, candidate comparison | medium-high | Keep W4 separate and explicitly human-approved |
| `FND-06` | A durable state machine must record proposal, approval basis, before/candidate/effective identities, verification, observation and recovery outcome. | `OBS-01/04/07` | medium-high | Transcript events alone are insufficient as the product contract |
| `FND-07` | The current duplicate-name origin conflict blocks reliable overlay activation and rollback identity. | `OBS-10` | high for static source | Resolve before EP-SI-06 delivery |

## Contract Direction

Adopt a hybrid surface-aware contract:

- read-only description adds no mutation path;
- `.hyper` uses a governed proposal and versioned candidate/restore path;
- shipped core and base prompt use tracked repository delivery with explicit human approval;
- migrations, security-sensitive, destructive, external and production changes
  retain their specialized approvals and cannot be generalized as automatic self-change;
- reflection produces candidates only.

Every activation-capable path records:

- proposal and source provenance;
- surface and authority class;
- immutable before and candidate identities;
- approval basis;
- verification contract/result;
- activation attempt and observed effective identity;
- rollback trigger, result and final effective identity;
- explicit failure/degraded state when recovery is incomplete.

## Limitations And Disconfirming Evidence

| ID | Limitation / conflicting signal | Effect | Mitigation or next question |
| --- | --- | --- | --- |
| `LIM-01` | No executable recovery prototype was run | Candidate-independent restore is a direction, not proven mechanism | W3 design/prototype after owner disposition |
| `LIM-02` | Raw eval/bash/files remain intentionally powerful | Comprehensive approval enforcement cannot be claimed | Choose policy-governed claim or route authority mediation separately |
| `LIM-03` | Route reload and migration have partial/specialized semantics | Overlay mechanism cannot generalize to all surfaces | Keep surfaces separate and require dedicated design |
| `LIM-04` | Startup/hot-reload effective origin conflicts | Overlay identity/rollback correctness is blocked | Resolve with contract and regression evidence before W3 |
| `LIM-05` | Persistence schema and independent restore carrier are undecided | ADR may be required | Assess in downstream design; do not invent in feature plan |

## Answer To Decision Question

Use a surface-dependent contract, not a universal self-modification API. The
first mutation-capable slice should be limited to policy-governed `.hyper`
overlays with immutable before/candidate identities, versioned staging,
behavioral verification, durable audit and recovery that does not execute the
candidate. It must explicitly state that raw trusted-agent authority can bypass
the governed path unless separately mediated. Core, prompt, migration, security,
external and production changes keep stronger human and delivery gates.

## Review Check

- [x] Findings trace to evidence and distinguish policy from enforcement.
- [x] Confidence reflects static-source and no-prototype limitations.
- [x] Candidate conflicts, bypasses and blockers are visible.
