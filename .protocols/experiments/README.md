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

`r031-live-boundary-runner.ts` is a mock boundary-envelope harness. It
spawns one macOS-sandboxed agent child for every variant/family/phase case and a
separate filesystem broker. The checked-in control keeps the broker in
`offline-mock` mode, where live/provider execution is rejected and provider
calls remain zero. Agent children receive only disposable HOME/TMPDIR plus four
non-auth process keys, and their network probe must fail before a request is
accepted. The operator repository, operator HOME and other projections remain
outside each lineage. Named TCP loopback listen/connect and non-Bun exec probes
must also fail.

```bash
bun test ./.protocols/experiments/r031-live-boundary.test.ts
bun .protocols/experiments/r031-live-boundary-runner.ts
```

The sanitized carrier is under
`runs/R-031/2026-08-13-live-boundary-mock-v1/`. Its common-context digest proves
that every phase/family comparison receives the same prompt, mock model alias, task, fixture,
golden result, authority declaration and six-continuation budget. The only
attributable envelope difference is the frozen projection. This is not yet a
live-agent boundary: `process*` and broad non-HOME reads remain allowed for Bun
compatibility; Mach denial has no named service probe; the child does not run
the full agent marker/write/reload runtime; and the broker is mock-only.
`safety-boundary.json` owns this exact remaining-gap list. A stricter boundary,
broker-owned provider execution and explicit authorization are required before
any live comparison.

## R-032 network-authority contract-model dry run

`r032-network-authority.ts` verifies the fixed R-029 committed-source carrier,
starts itself with a minimal `PATH`-only child environment, denies common Bun
and web network APIs, and generates one mechanism-neutral contract model over
all six candidates and three predeclared combinations. Each row receives the same
407 cases: all 36 committed routes and eight caller states, all nine deferred
authority tuples and six use-time states, committed/late/unclassified/overlay
route lifecycles, browser and direct CLI/TUI lifecycles, failures, locality and
synthetic non-transit controls.

```bash
bun test ./.protocols/experiments/r032-network-authority.test.ts
bun .protocols/experiments/r032-network-authority.ts
```

The sanitized checked-in carrier is under
`runs/R-032/2026-08-13-e301161-authority-contract-v1/`. Independent review
rejected it as candidate evidence: all 3,663 rows are formula-derived
contract/schema/accounting output, no candidate adapter ran, and its zero
non-transit counts had neither raw sentinel injection nor a positive detector
control. It therefore records no hard-gate pass or failure. It remains useful
only for frozen fixture cardinality, field/schema and source-provenance checks.
It opens no listener/socket, uses no real secret or user state, changes no
production source and selects no mechanism. R-032 stays `collecting`; a separate
additive executable-adapter carrier and another independent review are required
before synthesis.

`r032-executable-adapters.ts` is an additive bounded adapter-decision instrument.
It directly invokes decision/lifecycle methods for six minimal candidates and
three predeclared compositions over 19 identical representative cells per
adapter (171 total): immediate and deferred authority, late/unclassified/overlay routes,
verifier/policy/broker failures, browser and CLI lifecycle, and non-transit.
Unlike the dry run, it passes the raw synthetic sentinel into every adapter and
proves its detector with deliberately leaky positive and sanitized negative
controls.

It does not execute a common dispatcher, handler or authority-root spy chain;
therefore v2 supplies no evidence about those boundaries and no reviewed gate.

```bash
bun test ./.protocols/experiments/r032-executable-adapters.test.ts
bun .protocols/experiments/r032-executable-adapters.ts
```

The additive carrier is under
`runs/R-032/2026-08-13-e301161-executable-adapters-v2/`. It is intentionally a
representative executed subset, not a claim that every one of the 3,663 model
rows ran. Failures and uncovered mechanism behavior are retained. Its gate
assessment remains `not-reviewed`, and its in-process adapters do not prove OS
transport, external identity, cryptography or process confinement.

`r032-dispatch-chain-v3.ts` adds the boundary missing from v2. The same common
dispatcher invokes a real handler function, which invokes an independently
counted authority-root spy only after the adapter allows the call. Its 38 frozen
cells per candidate cover locality/peer cases, immediate caller states,
deferred expiry/revocation/replay/reduced scope, late and overlay routes,
verifier/policy/broker/stale/restart failures, and distinct browser/CLI start,
reconnect, expiry, revocation and recovery behavior. CAN-03 models identity
policy, CAN-04 models capability audience/scope/attenuation/expiry/revocation/
replay, and CAN-06 emits explicit broker-boundary messages.
CAN-06 is only an in-process broker-message adapter: no separate child process
or isolated broker handler/root boundary executes, so its fidelity is marked
incompatible with process-separation and residual-authority comparison.

```bash
bun test ./.protocols/experiments/r032-dispatch-chain-v3.test.ts
bun .protocols/experiments/r032-dispatch-chain-v3.ts
```

The v3 carrier is under
`runs/R-032/2026-08-13-e301161-dispatch-chain-v3/`. A raw synthetic credential
enters each candidate request and passes through six actual projection functions
for log, render, transcript, result, model input and persistence. The detector
declares raw, base64, hex, URL and reversed transforms; a deliberate leak path
must trigger in all six sinks and a digest-only negative control must remain
clear. This remains bounded in-process evidence with `not-reviewed` gates and
does not select a mechanism.

`r032-lifecycle-v4.ts` is a focused additive lifecycle carrier. For every
candidate label it executes route registration and default-policy inheritance,
records requested exposure, modelled reachability and peer evidence separately
from caller authority, drives browser and CLI machines through bootstrap,
disconnect, reconnect, expiry, revocation and recovery, and invalidates retained
authority across a restart generation before reissuing it.

```bash
bun test ./.protocols/experiments/r032-lifecycle-v4.test.ts
bun .protocols/experiments/r032-lifecycle-v4.ts
```

The carrier lives under
`runs/R-032/2026-08-13-e301161-lifecycle-v4/`. It explicitly retains the gap:
the complete symmetric matrix and real OS/network/process behavior remain
unexecuted. CAN-06 stays incompatible with process-separation comparison. Gates
remain `not-reviewed` and R-032 remains `collecting`.

`r032-committed-route-v5.ts` is the independently accepted bounded committed
route carrier. It passes all 36 fixed entries (34 imported route modules and two
script GET registrations) through committed `loadRoutes`, observes a safe
synthetic overwrite, and executes committed `match` plus captured `$start.fetch`
without opening a listener or invoking a production handler. One
mechanism-neutral policy wrapper then produces symmetric route, reachability,
browser/CLI lifecycle and restart records for all nine predeclared labels.

```bash
bun test ./.protocols/experiments/r032-committed-route-v5.test.ts
```

The checked carrier is under
`runs/R-032/2026-08-13-680be81-committed-route-v5/`. Independent review accepts
only G1 partial, G2 no evidence, G3 partial, G4 bounded structure, G5 no new
evidence, G6 bounded model and G7 partial. Committed loading, matching and
captured dispatch are real code paths; handler replacement, candidate policy,
late/unclassified/overlay behavior, reachability, lifecycle and restart remain
safe synthetic evidence. CAN-06 is still only an in-process broker label. The
complete matrix remains open, R-032 remains `collecting`, and the carrier does
not authorize synthesis, recommendation or mechanism selection.

`r032-v6_3/` is the independently accepted bounded current-runtime wave. Its
exact freeze SHA-256 is
`299336b032240d20458209e11e0f864a5ae869328a941fffd44ff947a40f8e28`
at HEAD `a4473e0e2bd0867e673099b24954d38b0b820089`; the precollection review is
`../reviews/r032-v6.3-precollection-review.json`. The collector executes the
frozen 9 × 16 matrix through committed loading/matching/captured fetch, real
POST/SQLite queue/worker claim-frontier handling and disposable use-time gates.
CAN-06 and COM-03 use a separately contained stdio broker/root. Governed R018
controls cover nine forms across S0-S8, and the carrier validator recomputes
row, containment, execution, bundle and final-file checksums before first write.

The accepted carrier is under `runs/R-032/V6.3/`, with canonical bundle digest
`cc2bf25f34a57a1f1eef0b426313114e6eef968b1e37a47e8dcd1d2369f3ca14`.
Independent review accepts bounded G1/G2/G5/G7 implications only. G3
late/unclassified/overlay policy, G4 reachability/residual-process authority and
G6 real browser/direct-CLI lifecycle evidence remain open. Rejected V6 freeze
`0487736d…`, V6.1 freeze `56629e9a…`, rejected whole freeze `2fa0d1ad…` and
rejected corrected freeze `fa0c2979…` remain method history only. R-032 remains
`collecting`; no synthesis, recommendation, mechanism selection or ADR follows.

## R-033 secret-mechanism disposable comparison

`r033-v5/` is the corrected executable staged-collector design. Its first
freeze `0ddad70a…` was rejected because provenance checks occurred too late and
several stage/authority outcomes were self-reported. V5.1 freeze `cac11c9e…`
moves every frozen-input check before temp state, uses injected refresh and
discovery spies, seven distinct CC-14 authority adapters, expanded sink/source
hashes and a cross-candidate carrier/control contract. Its one collected carrier
is retained only as a rejected diagnostic trace because CC-14 occurrence-based
arithmetic produced `deniedOrBounded=-7`. V5.2 freeze `36705a74…` counts zero-hit
paths and adds semantic unit checks for the bounded `0..7` result. Independent
pre-collection review approved that exact freeze; one contained collection was
run and independent post-collection review accepted the resulting carrier for
bounded synthetic synthesis:

```bash
bun test ./.protocols/experiments/r033-v5/collector.test.ts
```

The accepted V5.2 carrier is under
`runs/R-033/v5-collection-2026-08-13-36705a74/`. It contains 70 attributable
rows: `CAND-01`, `CAND-02`, `CAND-03` and `CAND-05` pass all 14 fixture cells;
`CAND-04` fails `CC-14` because all seven direct-authority probes return
detectable secret-bearing values. The carrier supports bounded comparison only,
not production conformance, ranking, recommendation, mechanism selection or an
ADR. The rejected V5.1 carrier remains unchanged under
`runs/R-033/v5-collection-2026-08-13-cac11c9e/`.

The first `r033-contained-comparison.ts` carrier verifies source drift,
containment and a rotating 70-cell case-plan schema. Independent review rejected
its candidate evidence because the child only emitted the plan, the parent
assigned outcomes from constants and authentication digests self-compared.

```bash
bun .protocols/experiments/r033-contained-comparison.ts
```

That downgraded carrier remains under
`runs/R-033/2026-08-13-contained-symmetry-v1/` only as containment,
matrix-schema and accounting evidence. Its pass/fail and compatibility fields
are explicitly rejected output, not candidate evidence.

The v2 additive instrument executes partial candidate adapters in a contained
child. It establishes bounded integrity and method execution, but independent
review found incomplete per-cell semantics, request controls and restart
execution. Its candidate totals are not full CC conformance evidence.

```bash
bun .protocols/experiments/r033-executable-comparison.ts
```

The v2 carrier is under
`runs/R-033/2026-08-13-executable-adapters-v2/`. This remains mechanism-shaped
partial execution evidence, not complete candidate fidelity or a decision.

`r033-v3-comparison.ts` adds candidate-distinct semantic adapters, frozen full
request/auth controls, S0-S8 controls at eight prohibited layers, synthetic
file/keychain/OAuth refresh cycles, actual throw/serialization paths,
retry/cancellation/use bounds, five separate restart processes, discovery
render/failure and callable generated-code-style probes.

```bash
bun .protocols/experiments/r033-v3-comparison.ts
```

The v3 carrier is under
`runs/R-033/2026-08-13-semantic-adapters-v3/`. Independent review rejected it:
the candidates shared a resolver core, refresh/discovery did not traverse
distinct mechanisms, layer controls were parent-only, and cyclic serialization
did not prove failure before durability. Subsequent instrument edits also make
its recorded provenance stale. It is retained only as a rejected trace; none of
its candidate outputs can enter synthesis. The R-033 evidence log preserves the
rejected clean-sheet history. V5.2 has moved R-033 to bounded synthesis; no
mechanism, winner, recommendation or ADR is selected.

## R-034 immutable fork storage comparison

`r034-storage-v3.ts` executes two disposable generated-data SQLite shapes: a
constant-size fork reference to an already-addressable immutable parent
revision plus prefix, and an immutable persistent structural-sharing graph with
root reuse and path-copy updates. It executes aggregate behavior/restart
scenarios and W1-W5 at two payload sizes:

```bash
bun .protocols/experiments/r034-storage-v3.ts
```

The frozen carrier is under `runs/R-034/2026-08-13-storage-v3/`. Independent
review accepted only bounded synthetic feasibility for `HYP-01` and `HYP-04`.
The assertions are aggregate rather than per-transition, W4 is count-only, the
COW graph is unbalanced and can amplify updates, graph/revision reachability
and orphan absence are not audited, and read-only reopen equality does not
prove foreign-key enforcement after reopen. Concurrency, GC, faults, backup,
migration, production operability and latency remain unknown. The carrier does
not rank candidates, select a design or authorize synthesis.
