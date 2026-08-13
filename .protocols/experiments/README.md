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

`r018-collect.ts` records the original partial attempt. The corrected
`r018-contained-runner.ts` launches `r018-contained-child.ts` under a macOS
deny-default `sandbox-exec` profile and executes the same fixed mock success
cell through current result, persistence, rendering and pre-provider request construction. The
detector library and tests cover the predeclared S0–S8 encodings with positive
and negative controls. The run carrier is under `runs/R-018/`.

```bash
bun test .protocols/experiments/r018-sentinel.test.ts
bun .protocols/experiments/r018-contained-runner.ts
```

The corrected child records containment before injection: exact allowlisted
environment, disposable HOME/TMPDIR, absent provider auth and denied probes for
operator-home read, outside-root write and network listen. The v2 profile has no
Mach lookup allowance; it additionally checks sandbox-policy denial for two
named securityd services, denial of the direct login-keychain path and failure
of a deterministic nonexistent keychain lookup. It then uses only a
deterministic non-secret fixture and in-memory state. It stopped at the first
prohibited transit and did not select an enforcement mechanism. The first
carriers remain unchanged; the `20260813-keychain-contained-static-mock-03`
carrier closes the bounded evidence cycle. Independent review signed off the
named controls and sampled transit; R-018 is terminal `validated` for that
bounded non-conformance claim without selecting a mechanism.

## R-029 static network-authority inventory

`r029-static-mock.ts` enumerates committed `src` route/script entries at its
fixed HEAD, classifies direct and transitive authority, replaces `Bun.serve`
and privileged handler dependencies with capture stubs, and writes sanitized
carriers plus checksums under `runs/R-029/<run-id>/`.

```bash
bun .protocols/experiments/r029-static-mock.ts
```

The first instrument aborts if HEAD changes or `src` has a worktree diff. It
never opens a socket and intentionally excludes the runtime `.hyper` overlay.
Its 11 direct-handler mocks are representative rather than route-exhaustive.

`r029-route-control-v2.ts` is the additive exhaustive reconciliation. It refuses
source drift from the approved baseline, validates every prior source hash,
reviews common and route-local caller-control candidates for all 36 entries, and
sends missing, malformed and synthetic-invalid identity variants through the
captured dispatcher for every entry (108 calls). It also records per-entry test
or static-only coverage and all nine immediate/deferred authority classes. It
does not overwrite the first carrier, execute handler side effects, open a
socket, select a mechanism or prove interface reachability.

```bash
bun .protocols/experiments/r029-route-control-v2.ts
```

Independent review signed off the 36-entry committed-`src` caller-control claim
and technical `STOP-01`. R-029 is terminal `validated` for that bounded gap; the
instrument does not cover `.hyper`, middleware, reachability or production
containment and does not select a mechanism.

## R-031 offline discovery-contract symmetry control

`r031-offline-comparison.ts` materializes the four frozen R-031 projections over
one deterministic ordinary-callable substrate. For each projection and each of
the three fixture families, a fresh Bun process performs discovery, ordinary
direct invocation, ordinary callable composition and exact golden comparison.
A matching negative case deliberately claims the golden final result after a
wrong tool result so the verifier must detect false success.
V3 resolves and invokes its admitted ordinary callable through an explicit
descriptor-adapter function; each result records whether that boundary was
crossed, while V0–V2 assert that it was not. The same ordinary-callable
composition check remains a hard admission gate for all four variants.

```bash
bun test ./.protocols/experiments/r031-offline-comparison.test.ts
bun .protocols/experiments/r031-offline-comparison.ts
```

The checked-in sanitized carrier is under
`runs/R-031/2026-08-13-offline-symmetry-v1/`. This is only the pre-run control
required by R-031 `STOP-01`: it uses no model/provider, opens no socket, reads no
real secret, changes no production source and does not select an architecture
or a preferred variant. Independent symmetry review remains required before a
live comparison.
