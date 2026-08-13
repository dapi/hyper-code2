Parent research: #29 (`R-029`).

Parent epic: EP-001 `EP-SI-06`.

Route: Research & Discovery (`technical_discovery`).

## Decision question

What target authority contract and candidate mechanism best close the validated
committed-`src` network-to-process caller-authority gap while preserving trusted
local browser and CLI/TUI use?

## Known evidence and boundary

R-029 validated that all 36 committed-`src` dispatch entries at its fixed
baseline lack a common or route-local caller identity/auth control. It also
separated requested bind configuration, actual reachability and caller
authority. This successor does not reopen that bounded finding.

The target contract must cover immediate request authority and deferred
authority scheduled through agent/model/marker execution. Trusted-local UX and
non-local/shared authority are compatibility cases, not an assumption that
multi-user operation is already supported.

## Alternatives to compare symmetrically

- bind scope, including loopback-only defaults;
- Unix-domain socket transport;
- caller authentication plus authorization;
- scoped capability tokens;
- route separation by authority class;
- process separation;
- reasonable combinations of the above.

Bind/reachability and caller authority must be scored separately. No option is
selected by this issue body.

## Evaluation contract

For every candidate or combination, use the same committed-source route and
authority fixtures and record:

- default-deny coverage before immediate and deferred authority;
- possession, issuance, scope, propagation, revocation and replay properties;
- trusted-local browser and CLI/TUI startup/reconnect compatibility;
- dynamic route/overlay treatment and privileged-route bypass resistance;
- failure behavior, operability, migration and testability;
- residual reachability, caller-authority and process-authority risk.

Use static analysis, direct-handler/dispatcher mocks and disposable prototypes
only. A prototype must use synthetic identities and state, stub privileged
roots, write only to its evidence carrier and open no real listener or socket.

## Safety and non-scope

- no public, shared, production or user-local network exposure;
- no real listener, socket, tunnel, ingress or port-forward;
- no real secret, credential, user session, private data or provider call;
- no production implementation, delivery scope or mechanism selection before
  reviewed comparative evidence and Danil's disposition;
- no claim that bind scope alone authenticates a caller or that authentication
  alone limits process authority;
- adversarial sandboxing and multi-user product support remain separate.

## Stopping condition and output

Stop when the comparison covers every named candidate with equivalent fixtures,
negative controls, compatibility results and residual-risk notes, or when a
recorded blocker makes the result `inconclusive`. Stop immediately on an actual
socket/listener, unexpected network access, real credential/private-data access
or an out-of-bound write.

Output: governed research evidence, synthesis, recommendation with confidence
and limitations, Danil's disposition, and downstream routing. Trigger a
proposed ADR before delivery if the selected target contract changes the
project-wide client/server, transport, identity/authorization or process trust
boundary. Implementation remains a separately routed security-sensitive
delivery unit.

Decision owner: Danil Pismenny.
