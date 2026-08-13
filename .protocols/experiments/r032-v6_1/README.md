# R-032 runtime authority V6.1 author package

This directory is an exact pre-collection author package for independent
review. It is not an evidence carrier and contains no collected candidate
results.

The proposed collector drives the committed path
`loadRoutes → match → captured $start.fetch → real POST /agent/:id → SQLite
queue → workerLoop atomic claim/frontier`. Production `agent.run` and every
provider are replaced by a disposable use-time authority gate and an independently
counted authority-root spy. CAN-06 and COM-03 have no parent root: their root
exists only inside a `sandbox-exec` stdio child with exact HOME/TMPDIR/env,
denied network/write policy, containment receipt and forced timeout. Author self-tests use
the same child decision function in memory and do not spawn a process.

All nine labels receive the same 16 cases: missing, insufficient and sufficient
enqueue authority; expired, revoked, replayed, reduced and missing use-time
authority; mixed-principal coalescing; verifier, policy, broker and stale
failures; and stale, missing and recovered restart state. State changes are
persisted between enqueue and worker use. S0-S8 scan the request,
sanitized envelope, SQLite envelope, messages, results, IPC, audit, rendered
events and transcript rows explicitly not claimed as model input. The governed
R-018 S0-S8 forms have a positive for every form × sink and a digest-only
negative. Only the request authority header may contain a sentinel form; the
POST body and S1-S8 remain clear.

The context does not use `mkTestCtx`, production `db.migrate`, `project.scan` or
real `self.describe`; it applies a frozen allowlist of committed SQL migrations
and supplies a synthetic descriptor function. Script entries are registered to
preserve the 37-entry surface but their handlers are never invoked.

Collection is locked until `collector.ts --collect <review.json>` receives an
independent `accepted-precollection` review matching the exact `freeze.json`
SHA-256. Preflight validates HEAD, clean `src`, every source and instrument hash,
and the review before creating a temp directory or candidate child. The only
pre-temp subprocess is the recorded read-only git preflight. Network,
listener and socket APIs fail closed. The collector must not read `.hyper`, home,
credentials, providers or user runtime state.

Author-only validation:

```bash
bun .protocols/experiments/r032-v6_1/self-test.ts
```

This uses SQLite `:memory:` only and writes no evidence. It cannot authorize
collection, synthesis, ranking, recommendation or mechanism selection.

## Independent pre-collection checklist

- Verify HEAD and all source/instrument hashes in `freeze.json`.
- Verify exactly 37 committed entries, including route-local `GET /self`.
- Verify the explicit migration allowlist and absence of `mkTestCtx`, production
  `db.migrate`, `project.scan`, real `self.describe` and script invocation.
- Trace a permitted request through every real production hop named above.
- Trace a denied enqueue and a denied use-time case; confirm no provider/run
  authority is reached and cursor/error behavior is recorded honestly.
- Check all 9 × 16 cells exist and use the same fields and execution path.
- Check mixed-principal coalescing binds per-message envelopes and fails closed
  for controlled candidates.
- Check expiry, revocation, replay, attenuation, missing propagation, service
  failures, stale generation, restart and recovery semantics independently.
- Check CAN-06 and COM-03 use the real stdio child in collection and that raw
  authority material never enters IPC; verify parent root calls stay zero.
- Check independently counted roots: exactly one on allowed use, zero on every
  denial, and broker roots only inside the contained child.
- Check every governed R-018 transform × every honest sink positive control,
  digest-only negative, and S1-S8 candidate cleanliness.
- Check collection-time assertions cover exactly 144 rows, symmetry, expected
  transitions, root suppression and S1-S8 before artifacts are accepted.
- Check full carrier contract: per-row hashes, controls, containment receipts,
  actual provenance/stdout/stderr and `SHA256SUMS`.
- Verify STOP guards and HEAD/source/review preflight precede temp creation and
  child spawn; verify no `.hyper`, home, credential, provider or user-state read.
- Confirm fidelity limits: captured listener only, no real transport, synthetic
  authority, disposable policy/broker, no OS isolation proof, no full matrix.
- Record `accepted-precollection` or rejection against the exact freeze SHA;
  do not collect on a conditional or edited freeze.
