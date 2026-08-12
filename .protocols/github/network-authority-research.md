Parent epic: EP-001 `EP-SI-06`.

## Decision question

What boundary should close the current unauthenticated network-to-process
authority path before any non-local or shared use is supported?

## Current evidence

The HTTP server binds to `0.0.0.0`, routes have no authentication/authorization,
and `POST /repl` evaluates code with server-process authority. Until this is
closed, operators must not expose the server beyond a trusted local environment.

## Research scope

- inventory reachable privileged routes and bind behavior;
- establish the threat and target contract;
- compare loopback-only binding, Unix socket, authentication/authorization,
  capability tokens, route separation and process separation;
- identify compatibility and delivery slices;
- do not select a mechanism in this issue body.

## Output

Evidence, recommended contract/option, limitations, ADR proposal if global
architecture changes, and bounded delivery candidates.

Decision owner: Danil Pismenny.
