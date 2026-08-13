R-032 is concluded with terminal disposition `inconclusive` for mechanism selection.

An FPF scoped-claim review separated two questions that the original issue combined:

1. The target authority contract is supported by the independently accepted V6.3 evidence. Reachability, caller authority and residual process authority must remain separate; immediate work must deny unauthorized callers before an authority root; deferred work must carry per-work authority and revalidate scope, expiry, revocation, replay and generation; mixed-principal work must not collapse to ambient agent authority; verifier/policy/broker failures must fail closed; authority-bearing values must stay out of LLM-visible and durable result surfaces.
2. Selection of a best transport/process mechanism is not supported. Route/default/overlay behavior, actual reachability and parent residual authority, and real browser/direct-CLI lifecycle remain outside the evidence scope.

The weakest-link result is therefore: accept and promote the mechanism-neutral contract, abstain from choosing loopback, Unix sockets, authentication, capabilities, route separation, process separation or a layered realization.

No further broad R-032 matrix is planned. Remaining evidence is demand-triggered by a concrete downstream architecture, deployment or client-surface decision. No ADR, feature or implementation is authorized by this disposition.

Canonical records:

- `memory-bank/research/R-032/synthesis.md`
- `memory-bank/research/R-032/decision.md`
- `memory-bank/engineering/security-boundary.md`
