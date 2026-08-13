# R-032 runtime authority V6 author package

This directory is an exact pre-collection author package for independent
review. It is not an evidence carrier and contains no collected candidate
results.

The proposed collector drives the committed path
`loadRoutes → match → captured $start.fetch → real POST /agent/:id → SQLite
queue → workerLoop atomic claim/frontier`. Production `agent.run` and every
provider are replaced by a disposable use-time authority gate. CAN-06 and
COM-03 use a separate Bun stdio child during collection; author self-tests use
the same child decision function in memory and do not spawn a process.

All nine labels receive the same 16 cases: missing, insufficient and sufficient
enqueue authority; expired, revoked, replayed, reduced and missing use-time
authority; mixed-principal coalescing; verifier, policy, broker and stale
failures; and stale, missing and recovered restart state. S0-S8 scan the request,
sanitized envelope, SQLite envelope, messages, results, IPC, audit, rendered
events and would-be model input. Only S0 is permitted to contain the synthetic
raw sentinel.

The context does not use `mkTestCtx`, production `db.migrate`, `project.scan` or
real `self.describe`; it applies a frozen allowlist of committed SQL migrations
and supplies a synthetic descriptor function. Script entries are registered to
preserve the 37-entry surface but their handlers are never invoked.

Collection is locked until `collector.ts --collect <review.json>` receives an
independent `accepted-precollection` review matching the exact `freeze.json`
SHA-256. Preflight validates HEAD, clean `src`, every source and instrument hash,
and the review before creating a temp directory or spawning a child. Network,
listener and socket APIs fail closed. The collector must not read `.hyper`, home,
credentials, providers or user runtime state.

Author-only validation:

```bash
bun .protocols/experiments/r032-v6/self-test.ts
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
  authority material never enters IPC.
- Check S0-S8 detector positive and digest-only negative controls; raw material
  is allowed only at S0.
- Verify STOP guards and HEAD/source/review preflight precede temp creation and
  child spawn; verify no `.hyper`, home, credential, provider or user-state read.
- Confirm fidelity limits: captured listener only, no real transport, synthetic
  authority, disposable policy/broker, no OS isolation proof, no full matrix.
- Record `accepted-precollection` or rejection against the exact freeze SHA;
  do not collect on a conditional or edited freeze.
