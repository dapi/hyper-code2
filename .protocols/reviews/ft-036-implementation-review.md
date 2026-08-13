# FT-036 Implementation Review

- Reviewer: Codex convergence pass
- Reviewed branch: `feature/inspectable-self-evolution`
- Reviewed against: `memory-bank/features/FT-036/brief.md`, `design.md`, and `implementation-plan.md`
- Review date: 2026-08-13

## Review Focus

- truthful effective-origin and freshness reporting;
- secret and runtime-value non-transit;
- loopback-only HTTP access;
- read-only authority boundary;
- contract evolution and served-response freshness.

## Findings And Disposition

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| `REV-01` | important | The live descriptor route did not prohibit caches, so a consumer could observe an outdated origin/freshness result despite a newly generated descriptor. | Fixed: successful `GET /self` now returns `Cache-Control: no-store`; route contract and automated test updated. |

## Re-review

The original clean verdict was superseded when a later review found three
correctness gaps in the integrated implementation. It remains historical
evidence for `REV-01`, not a clean verdict for the current branch.

## Corrective Review Cycle

- Corrective baseline: `2990d66e5749db76ce0a03fe4e21f4fb4fb2bf92`
- Review mode: independent read-only convergence and adversarial reproduction
- Validation profile: `standard`

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| `REV-02` | important | A loader receipt remained apparently fresh after direct registry replacement or deletion. | Fixed: receipts preserve a non-enumerable exact function identity; mismatch is unavailable. |
| `REV-03` | important | Prompt layers were inferred from fixed shipped files even when the active composer was an overlay, replacement or arbitrary same-path implementation. | Fixed: known layers require validated live identity, fresh source and the exact reviewed shipped-composer SHA; every other composer is fail-closed. |
| `REV-04` | important | The route accepted only `127.0.0.1`, not all native IPv4 loopback peers. | Fixed: strict IPv4 parsing accepts the complete `127.0.0.0/8`, dotted IPv4-mapped forms and `::1`; malformed/non-loopback peers remain denied before evaluation. |
| `REV-05` | important | Timestamp cache collisions and an import/hash race could bind a receipt to bytes different from the live callable. | Fixed: collision-proof import nonce plus hash-before/import/hash-after equality gate; concurrent rewrite preserves the prior registry entry and creates no new receipt. |

### Corrective Re-review

Clean after `REV-02…05` remediation. Independent checks: 19 targeted tests pass;
full suite 422 pass / 3 opt-in provider skips / 0 fail; typecheck and
`git diff --check` pass. No remaining critical or important findings within
FT-036 scope.

The function-identity receipt is an honest-process consistency check, not a
security attestation against arbitrary in-process code that can mutate both the
registry and transient receipts. Mutation, visual UI, durable receipts and
authentication beyond the loopback-only baseline remain out of scope.
