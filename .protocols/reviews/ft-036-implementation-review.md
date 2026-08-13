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
| `REV-04` | important | The route accepted only `127.0.0.1`, not all native IPv4 loopback peers. | Fixed: strict IPv4 parsing accepts the complete `127.0.0.0/8`; dotted IPv4-mapped forms and `::1` remain defensive classifier support. The listener stays on `0.0.0.0`, so no IPv6 exposure or reachability is claimed. |
| `REV-05` | important | Timestamp cache collisions, ordinary import rewrites and ABA rewrites could bind a receipt to bytes different from the live callable. | Fixed: collision-proof import nonce plus hash-before/import/hash-after and stable file-version equality gates; a detected rewrite preserves the prior registry entry and creates no new receipt. |
| `REV-06` | important | `self.describe` could report stale live-registry or composer-source facts if either changed during awaited source or prompt-layer inspection. | Fixed: effective-source hashes use stable file-version reads, the composer is re-hashed after all layer awaits, and a final synchronous registry reconciliation downgrades changed capabilities/layers while reconciling runtime-only names with authority evidence. |
| `REV-07` | important | A proposed `::` listener bind would have widened every unauthenticated route to IPv6. | Rejected: listener topology remains `0.0.0.0`; a dedicated regression asserts the unchanged bind. |
| `REV-08` | important | Namespace reload evaluated the winning overlay once for every duplicate scan entry, causing duplicate top-level initialization and receipt generations. | Fixed: namespace reload deduplicates logical runtime names before import; the regression proves one overlay evaluation and one generation. |
| `REV-09` | important | An earlier capability could retain obsolete source facts, or a new source/overlay candidate could be omitted, when files or scan membership changed while later capabilities were inspected. | Fixed: descriptor construction compares whole-source version vectors and canonical scan membership around the complete async build; membership ignores harmless ordering between independent logical functions while preserving the exact candidate order and multiplicity for each name, including root and same-root alias precedence. It retries once on drift and returns current membership without file-derived facts if a stable retry cannot be obtained. |
| `REV-10` | important | An exact-byte composer copied into a remapped root could report prompt layers from this checkout rather than from the active physical source tree. | Fixed: validated effective-source receipts now retain the physical composer path and root; prompt layers are resolved and hashed beside that active composer path. |
| `REV-11` | important | A cyclic runtime namespace could recurse forever during registry traversal and break the descriptor route. | Fixed: registry traversal tracks only the current ancestor objects, skipping back-edges while preserving non-cyclic aliases. |
| `REV-12` | important | The documented Bun startup command allowed shell expansion of the `$main` filename. | Fixed: the entrypoint is quoted as `bun 'src/$main.ts'`. |

### Corrective Re-review

The `REV-02…12` corrections pass 36 targeted tests and the full suite at
439 pass / 3 opt-in provider skips / 0 fail; typecheck and `git diff --check`
pass. Two independent read-only re-reviews returned `CLEAN ACCEPT` for the
final `REV-09` membership model; no critical or important findings remain.

The function-identity receipt is an honest-process consistency check, not a
security attestation against arbitrary in-process code that can mutate both the
registry and transient receipts. Mutation, visual UI, durable receipts and
authentication beyond the loopback-only baseline remain out of scope.
