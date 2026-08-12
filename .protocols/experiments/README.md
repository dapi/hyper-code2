# UC-005 experiment instruments

`uc005-v2-runner.ts` replaces the first live runner for subsequent evidence. It
creates one sandboxed child Bun process per agent phase, a separate restart
verifier and a credential-owning LLM broker. Agent children exchange serialized
LLM requests/responses with that broker through the disposable run root; they
never receive the authentication HOME or provider token. Each run stores
sanitized transcripts, logs, the retained capability, machine comparisons and
checksums under `runs/<run-id>/`.

## Offline instrument check

```bash
bun .protocols/experiments/uc005-v2-runner.ts
```

On macOS with `sandbox-exec`, agent children are denied network access and writes
outside the disposable run root. Reads below the user's HOME are denied except
for the repository and Bun executable. The broker is intentionally not placed in
that sandbox: it owns network/auth authority and never executes model-produced
markers. Elsewhere the runner still uses a clean HOME, TMPDIR and minimal child
environment, but reports that OS containment was not established.

## Product-behavior live run

Run only after coordinating model usage:

```bash
UC005_RUN_ID=<stable-run-id> \
UC005_MODEL=codex:gpt-5.4 \
UC005_AUTH_HOME="$HOME" \
bun .protocols/experiments/uc005-v2-runner.ts --live
```

Live mode validates the experiment's process boundary: only the broker receives
`UC005_AUTH_HOME`; agent children use a disposable HOME, have no network, and
cannot read other paths below the user's HOME on macOS. This is deliberately
**not** proof that the current production runtime satisfies secret non-transit:
production still resolves credentials in the same process that executes
arbitrary `§eval`. The broker is an experimental supporting mechanism, not a
shipped product guarantee.

Known instrument limitation: agent children can read the disposable run root,
which contains broker coordination metadata such as the authentication-HOME
path and the random sentinel. They do not receive credential values and cannot
read that HOME through the macOS sandbox. Consequently the v2 sentinel result is
only an accidental-appearance check; the sentinel was not injected into a model
or action-result path.

Sanitization is defense in depth, not proof that arbitrary model output is safe
to publish. Review every generated artifact before committing or sharing it.

For UC-005, `runs/canonical-offline/` is the checked-in mock fixture and
`runs/2026-08-13-tags-v2/` is the sanitized stopped live repetition. Other
UC-005 run directories are ignored and disposable.

## R-018 synthetic secret-transit collection

`r018-collect.ts` executes a fixed mock success cell through current
result, persistence, rendering and pre-provider request construction. The
detector library and tests cover the predeclared S0–S8 encodings with positive
and negative controls. The run carrier is under `runs/R-018/`.

```bash
bun test .protocols/experiments/r018-sentinel.test.ts
bun .protocols/experiments/r018-collect.ts
```

The collector uses only a deterministic non-secret fixture, in-memory state and
a fail-closed provider/network stub. It stopped at the first prohibited transit
and did not select an enforcement mechanism. The first collector did not satisfy
the plan's OS-sandbox, minimal-environment and enforced write-boundary
preconditions, so its carrier is partial evidence and R-018 remains collecting.

## R-029 static network-authority inventory

`r029-static-mock.ts` enumerates committed `src` route/script entries at its
fixed HEAD, classifies direct and transitive authority, replaces `Bun.serve`
and privileged handler dependencies with capture stubs, and writes sanitized
carriers plus checksums under `runs/R-029/<run-id>/`.

```bash
bun .protocols/experiments/r029-static-mock.ts
```

The instrument aborts if HEAD changes or `src` has a worktree diff. It never
opens a socket and intentionally excludes the runtime `.hyper` overlay. It does
not select an authority mechanism or prove interface reachability. Its 11 mocks
are representative rather than route-exhaustive; complete route/control
reconciliation and independent review remain pending.
