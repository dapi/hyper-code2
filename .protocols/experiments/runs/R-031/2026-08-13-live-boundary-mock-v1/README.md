# R-031 boundary-envelope offline mock carrier 2026-08-13-live-boundary-mock-v1

This mock-only carrier exercises 36 fresh isolated child cases: four frozen projections by three task families by three phases. The filesystem broker ran separately in offline-mock mode and made zero provider calls. Every phase/family group had identical common prompt, mock model alias, fixture, golden, declared authority and six-continuation budget; only the attributable projection content differed. Each lineage exposed exactly one projection; retain-control and fresh-reuse alone shared that variant/family workspace.

The named checks passed in every child: TCP loopback bind/listen denied, outbound TCP loopback connect to an established control listener denied, operator repository and HOME reads denied, and non-Bun process exec denied. The profile has no mach-lookup allow rule. This is not yet a live-agent boundary: `process*` and broad non-HOME reads remain for Bun compatibility, Mach denial has no named service probe, the child exercises only envelope/broker transport, and the broker is mock-only. See `remainingBoundaryGaps` in `safety-boundary.json`. No real secret, live model, production source, architecture decision or winner selection was involved.

- `context-symmetry.json`: equality controls and substrate/projection identities.
- `safety-boundary.json`: exact proved controls and remaining boundary gaps.
- `boundary-results.json`: sanitized per-case request/broker observations.
- `provenance.json` and `SHA256SUMS`: instrument identity and integrity.
