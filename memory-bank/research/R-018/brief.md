---
title: "R-018: Secret Non-Transit Boundary"
doc_kind: research
doc_function: canonical
purpose: "Determine an enforceable secret non-transit contract and validation method."
derived_from: [../../flows/research.md, ../../engineering/security-boundary.md, ../../prd/PRD-002-self-extending-agent-harness.md]
status: active
research_status: validated
audience: humans_and_agents
---
# R-018: Secret Non-Transit Boundary

## Intake

| Field | Value |
| --- | --- |
| Source / trigger | PRD-002 `BR-05/VAL-08`, GitHub #18 |
| Research owner | Codex orchestration; Danil validated the bounded non-conformance finding after independent review |
| Decision owner | Danil Pismenny |
| Research mode | `technical_discovery` |
| Decision deadline / timebox | One boundary-inventory and synthetic-sentinel cycle, limited to the approved static/mock scope |

## Decision Question

- `RQ-01` What enforceable boundary keeps secret values out of LLM input and
  LLM-visible action-result context, including failure paths?

## Working Hypotheses

- `HYP-01` A mechanism-neutral conformance contract can be defined before choosing
  opaque references, bounded projection, redaction or a combination.
- `HYP-02` A finite sentinel matrix can detect material transit through the
  inventoried success and failure paths without using a real secret.

## Scope

- `RSC-01` Declared-secret sources and every code path that can copy, transform,
  serialize or render their values into model request input.
- `RSC-02` Synthetic action results, errors, retries, persistence records,
  diagnostics and known external rendering or telemetry sinks reachable by the
  selected sample.
- `RSC-03` A mechanism-neutral target contract and a repeatable validation method.

## Non-Scope

- `RNS-01` Real credentials, production migration or a preselected projection kernel.
- `RNS-02` Proving absence of leakage outside the explicitly inventoried paths or
  claiming an adversarial sandbox.
- `RNS-03` Activating GitHub #19 or implementing opaque references, projection,
  redaction, isolation or another candidate mechanism.

## Assumptions and Known Evidence

| ID | Statement | Type | Source / confidence |
| --- | --- | --- | --- |
| `EVD-01` | Secret non-transit is a target contract and is not currently verified. | Evidence | [Trust and security boundary](../../engineering/security-boundary.md) |
| `EVD-02` | The current process can execute generated code and shell commands and may have provider credentials available. | Evidence | [Trust and security boundary](../../engineering/security-boundary.md) |
| `ASM-01` | A bounded static inventory can identify a reviewable initial sample of secret sources and model-visible sinks. | Assumption | Must be tested by the approved inventory; no completeness claim yet |
| `ASM-02` | The proposed finite encodings represent the transformations material to the initial sample. | Assumption | Must be checked against the inventory before collection |
| `ASM-03` | A disposable isolated runner can keep provider access needed by the harness outside agent-executable authority. | Assumption | Requires a reviewed runner design; current runtime authority does not establish it |

## Material Unknowns

| Question | Blocks | Owner | Resolution evidence |
| --- | --- | --- | --- |
| Which settings, environment variables and credential stores are declared-secret sources? | Final source sample | Research owner | Reviewed static inventory with stable source links |
| Which request, result, error, retry, persistence and rendering paths are LLM-visible or externally observable? | Sentinel placement and sink assertions | Research owner | Reviewed data-flow inventory and tests |
| Which transformations occur before each sink? | Final encoding matrix | Research owner | Code-grounded transform map |
| Can the test runner isolate agent actions from provider credentials and writes outside its disposable workspace? | Safe collection approval | Research owner and security reviewer | Reviewed containment checks run before sentinel injection |
| What mechanism, if any, should enforce non-transit? | Downstream delivery/architecture handoff | Decision owner | Evidence and synthesis after collection; not decided in this package yet |

## Security and Access Constraints

- Use only deterministic non-secret sentinels; never place a real credential,
  customer value or private source content in a fixture, transcript or repository.
- Do not run collection in production, against shared state, or with public/network
  reachability. The approved runner must be disposable and isolated.
- The agent-executable process must receive a minimal allowlisted environment and
  must not receive provider credentials, user credential stores or the operator's
  home-directory access. Provider authentication, if required by the harness,
  remains outside that process boundary.
- Deny network access for the sentinel workload and fail closed on an attempted
  connection, an out-of-bound filesystem write or an unexpected environment read.
- Preserve only sanitized evidence in the stable carrier. Access-controlled raw
  material, if approval requires it, must be referenced rather than copied.
- A clean sample supports only the inventoried boundary. It is not a general
  security guarantee or evidence of sandboxing.

## Stopping Condition

- `STOP-01` Stop when current paths are inventoried, deterministic sentinels cover
  success and failure paths, and alternatives can be recommended with limitations.
- `STOP-02` Stop immediately on containment failure, real-secret exposure,
  sentinel transit to a prohibited sink, or loss of evidence provenance.

## Boundary Check

- [x] The brief contains questions, assumptions and hypotheses, not findings.
- [x] Known evidence links to the canonical owner; unsupported statements remain assumptions or unknowns.
- [x] No mechanism, delivery scope or architecture decision is selected.
- [x] Security, privacy and access constraints are explicit.
