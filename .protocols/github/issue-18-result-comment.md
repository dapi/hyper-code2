The first R-018 static/mock/synthetic collector stopped on its first prohibited
transit, as required by `STOP-03`, but later review found that the collector did
not satisfy the plan's OS-containment preconditions. Treat this as partial,
provisional evidence rather than a completed collection cycle.

A deterministic non-secret value resolved through a synthetic declared
`type: secret` setting was detected in:

- the synthetic result message;
- the persisted tool event;
- rendered event HTML;
- the pre-provider model request.

No real credential, provider call, HTTP request, home/credential-store read,
production state or shared state was used. S0–S8 detector positive controls and
the no-sentinel negative control passed. Error/retry/serialization/additional
source cells were intentionally not run after the first prohibited hit.

This confirms that the sampled current route does not enforce secret
non-transit. It does not choose opaque references, projection, redaction,
authority separation or another mechanism. #19 remains parked; owner review is
required before mechanism comparison or delivery.
