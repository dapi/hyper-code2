---
title: "EP-002: Risks"
doc_kind: epic
doc_function: risk_register
purpose: Cross-feature truthfulness, authority, recovery, prompt-injection, regression and scope risks for inspectable and bounded self-evolution.
derived_from:
  - charter.md
  - roadmap.md
status: active
audience: humans_and_agents
---

# EP-002: Risks

| Risk ID | Risk | Impact | Control | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| `ERISK-01` | Prompt text or model recollection is mistaken for current implementation evidence | Agent acts on stale or false self-knowledge | Runtime/source grounding, provenance, freshness and unknown states | `EP-SI-01` owner | open |
| `ERISK-02` | Effective `.hyper/` override is omitted | Self-description points to inactive core implementation | Resolve effective function origin and implementation identity | `EP-SI-01` owner | open |
| `ERISK-03` | Self-description exposes secret values | Credential material enters model-visible context | Metadata-only authority reporting; consume EP-001 non-transit controls; sentinel tests | Epic and security owners | open |
| `ERISK-04` | Proposal is treated as active merely because code was written or reloaded | Unverified behavior persists | Explicit states and post-activation behavioral verification | `EP-SI-02/05` owners | open |
| `ERISK-05` | Candidate breaks the loader or recovery mechanism | Agent cannot restore itself | Recovery mechanism independent from candidate; pre-change snapshot and external restore path | `EP-SI-02/06` owners | open |
| `ERISK-06` | Rollback restores files but not effective runtime behavior or state | Hidden partial failure and false recovery | Verify source identity, effective registry, live behavior and durable session preservation | `EP-SI-06` owner | open |
| `ERISK-07` | External content or reflection poisons persistent behavior | Prompt injection becomes durable self-modification | Candidate-only boundary, provenance, manual promotion and adversarial tests | `EP-SI-08` owner | open |
| `ERISK-08` | Approval classes are advisory and bypassable through eval/bash/files | Policy claims exceed enforcement | Inventory all mutation paths and distinguish policy from enforced mediation | `EP-SI-02` owner | open |
| `ERISK-09` | `.hyper/` becomes hidden shipped core | Untracked runtime state becomes required for the product | Core/overlay classification, dependency checks and delivery review | Project developer | open |
| `ERISK-10` | Accumulated changes regress unrelated tasks | Agent improves locally and degrades globally | Held-out regression set, activation budget and kill switch | `EP-SI-08/09` owners | open |
| `ERISK-11` | Existing network/secret gaps are duplicated or weakened | Conflicting owners and unsafe claims | Consume EP-001 outcomes and keep security mechanisms out of EP-002 charter | Epic owner | open |
| `ERISK-12` | “Self-awareness” is marketed as consciousness | Misleading positioning and untestable acceptance | Use inspectable self-model terminology and observable contracts | Product owner | open |
| `ERISK-13` | Multiple ambitious slices begin before contracts close | Unreviewable scope and unsafe mutation | Research-first gates; read-only slice first; mutation and reflection blocked | Epic owner | open |
