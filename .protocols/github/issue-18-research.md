Parent epic: EP-001 `EP-SI-07`.

## Decision question

What enforceable boundary ensures secret values do not enter model inputs or
LLM-visible action-result context?

## Upstream

PRD-002 `BR-05`, `RISK-04` and `VAL-08`.

## Required evidence

- inventory model-input and result construction paths;
- controlled sentinel test against current behavior;
- compare opaque references/brokers, source exclusion, bounded projection or
  redaction, and combinations;
- distinguish known-secret guarantees from arbitrary-secret detection;
- identify fail-closed behavior and compatibility impact.

## Outputs

Evidence report, recommendation, `VAL-08` test contract, ADR proposal if the
decision changes global architecture, and bounded delivery candidates.

## Stopping condition

Danil Pismenny accepts one contract or requests more evidence.

## Non-goals

Implementing a projection kernel, secret catalog or application-wide sink
migration inside this research issue.
