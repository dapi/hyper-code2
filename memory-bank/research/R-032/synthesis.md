---
title: "R-032: Research Synthesis"
doc_kind: research
doc_function: canonical
purpose: "FPF-bounded synthesis of the network authority contract and mechanism comparison."
derived_from:
  - brief.md
  - evidence.md
status: active
audience: humans_and_agents
---

# R-032: Research Synthesis

## FPF Decision Frame

The original question combines two different claims and therefore must not be
answered with one undifferentiated confidence label:

1. **Target-contract claim** — which properties are required to close the
   network-to-process caller-authority gap?
2. **Mechanism-selection claim** — which transport, identity, route and process
   mechanism is the best implementation while preserving browser and CLI/TUI
   use?

Under FPF Trust and Assurance, evidence is scoped to a typed claim and the
weakest material evidence path limits the aggregate conclusion. The accepted
V6.3 carrier strengthens the first claim and selected candidate comparisons; it
does not widen its scope into real reachability, arbitrary overlays, real client
lifecycle or general process isolation.

## Findings

| ID | Finding | Evidence | Assurance reading | Consequence |
| --- | --- | --- | --- | --- |
| `FND-01` | Reachability, caller authority and residual process authority are separate contract dimensions. A local bind or route partition cannot substitute for caller authentication/authorization. | `OBS-07`, `OBS-08`, `OBS-13`, `OBS-14` in [Evidence](evidence.md) | High within committed-source and disposable-runtime scope | The target contract must state all three dimensions independently. |
| `FND-02` | Caller authority must be denied before immediate authority and must remain bound to each durable unit of deferred work, with use-time revalidation. Locality-only and route-separation-only candidates preserve ambient-authority gaps in the frozen cases. | `OBS-13`, `OBS-14`, `OBS-16` | High for the frozen POST/queue/worker path; not production enforcement | This is an accepted mechanism-neutral contract requirement. |
| `FND-03` | Expiry, revocation, replay, reduced scope, missing context and unavailable verifier/policy/broker states require fail-closed handling before the authority root. Mixed-principal queued work must not collapse to agent-level ambient authority. | `OBS-14`, `OBS-16`, accepted V6.3 rows | High for the exact synthetic state matrix | Downstream designs must preserve per-work authority context and explicit failure reasons. |
| `FND-04` | Authority-bearing values can be represented without appearing in the accepted stable S1–S8 projections, while all governed detector controls remain sensitive to their test forms. | `OBS-15`, accepted controls and carrier review | Moderate and bounded: no provider/model call; HTML omitted; transcript rows are not proven model input | Non-transit remains a required contract and downstream validation obligation, not a completed production guarantee. |
| `FND-05` | The evidence does not establish a best transport/process mechanism. G3 route/default/overlay behavior, G4 actual reachability and parent residual authority, and G6 real browser/direct-CLI lifecycle remain below the plan's fidelity gate. | `OBS-17` and [V6.3 gate implications](evidence.md#v63-bounded-gate-implications) | Insufficient for mechanism ranking | The mechanism-selection portion of `RQ-01` must abstain rather than infer a winner. |

## FPF Assurance Ledger

No numeric confidence score is manufactured. Formality, scope and reliability
remain separate, and design-time evidence is not blended with run-time or
deployment evidence.

| Typed claim | Formality | Supported scope | Reliability / weakest link | Gate result |
| --- | --- | --- | --- | --- |
| Target authority contract separates reachability, caller authority and residual authority | Structured executable evidence plus canonical source inventory | Frozen committed routes and disposable POST/queue/worker path | High; bounded by synthetic authority adapters | `pass` for contract synthesis |
| Caller authority must propagate and be revalidated across deferred work | Result-derived 9 × 16 runtime matrix with independent review | Exact message-indexed disposable queue cases | High in scope; production schema/concurrency remain absent | `pass` for contract synthesis |
| Locality or route separation alone closes the caller-authority gap | Same candidate matrix | Frozen candidate semantics | Reliably contradicted in scope | `block` as a standalone contract answer |
| A particular transport/process mechanism is best | Prototype/model evidence only | No real topology, arbitrary overlays or real clients | Insufficient; G3/G4/G6 are the weakest links | `abstain` from selection |

## Decision Answer

R-032 supports a mechanism-neutral target contract:

- reachability, caller authority and residual process authority are explicit and
  independently reviewable;
- unauthorized immediate work is denied before an authority root;
- deferred work carries authority bound to the initiating work unit rather than
  inheriting ambient agent authority;
- authority is revalidated at use time for scope, expiry, revocation, replay and
  generation freshness;
- mixed-principal queued work remains separable;
- verifier, policy and broker failures fail closed;
- authority-bearing values do not enter LLM-visible or durable result surfaces.

R-032 does **not** support choosing loopback, Unix sockets, authentication,
capabilities, route separation, process separation or a layered combination as
the best implementation. Under the FPF weakest-link rule, the combined original
question is therefore inconclusive at mechanism-selection level.

## Limitations And Disconfirming Evidence

| ID | Limitation | Effect |
| --- | --- | --- |
| `LIM-01` | No real listener or topology was exercised. | No actual reachability or transport recommendation. |
| `LIM-02` | Arbitrary `.hyper` overlays and a production authority-default policy were excluded. | No claim that dynamic routes inherit a safe policy today. |
| `LIM-03` | Browser and CLI/TUI flows are synthetic state models. | No usability, credential-channel or reconnect recommendation. |
| `LIM-04` | Sandbox receipts are exact host/Bun/Darwin observations and compile occurs outside the sandbox. | No general OS-isolation or parent residual-authority claim. |
| `LIM-05` | Restart evidence reconstructs a SQLite authority store but does not restart the whole process. | No production recovery guarantee. |
| `LIM-06` | Provider/model execution was replaced before the authority root. | Non-transit is bounded evidence, not end-to-end production proof. |

## Recommended Disposition

Conclude R-032 as `inconclusive` for the original combined mechanism-selection
question while promoting the supported target-contract requirements. Do not run
another broad comparison cycle. Route later questions only when their consuming
decision exists:

- route/default/overlay inheritance belongs to the eventual architecture/design
  owner;
- real reachability belongs to a concrete deployment topology decision;
- browser and direct CLI/TUI lifecycle belongs to the selected delivery surface;
- process-isolation testing belongs to a proposed process-boundary design.
