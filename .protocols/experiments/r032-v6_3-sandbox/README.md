# R-032 V6.3 compiled Bun sandbox boundary probe

Status: exact diagnostic probe only; `collectionAuthorized: false`.

This additive package is bound to HEAD
`18ea94437390bcf822df0165f79246fab0da436e`. It determines whether one exact
compiled Bun child can reach a canary after its containment assertions. It does
not execute an R-032 collector, runtime/candidate matrix, production route,
provider, or real listener.

## Boundary exercised

`self-test.ts` verifies HEAD, every instrument/source hash, the build-tool hash,
environment tuple and profile-template hash before creating disposable state.
It then runs `bun build --compile` in a parent-owned disposable build directory
outside `sandbox-exec`, verifies the standalone binary hash, and starts that
exact binary twice under the deny-default profile. No repository source or
import is read by the contained process, and no compiled binary is stored in
the repository.

The contained environment has exactly `HOME`, `PATH`, `R032_V63_CHILD` and
`TMPDIR`; HOME and TMPDIR point into a disposable writable root. The child runs
with `/` as cwd. Its content-read closure is limited to the exact compiled
binary, literal `/`, the sandbox-check dylib, `/dev/null`, `/dev/dtracehelper`,
the observed Cryptex bootstrap subtree and the timezone subtree. There is no
broad repository content read, `process*`, `process-fork`, broad or named Mach
allowance, network allowance, or non-Bun executable allowance.

The profile does retain a broad `file-read-metadata` allowance outside operator
HOME. That exposes path metadata—not file contents—and is a residual boundary,
not evidence of full filesystem confidentiality. Operator-HOME and keychain
paths are checked only with `sandbox_check(file-read-data, PATH, ...)` inside
the child. Neither the parent nor the child opens, stats, or reads bytes from
those real paths.

## Policy and behavior evidence

The parent creates and preflight-reads a synthetic regular fixture outside the
child's writable root. The child records two distinct fields for connect, bind,
synthetic outside read, outside write, non-Bun exec, and fork/descendant probes:

- `policyDenied` comes only from the matching direct `sandbox_check` operation
  (and path filter where applicable).
- `behaviorSucceeded` reports the attempted API outcome. A caught exception is
  not itself classified as a policy denial.

HOME, keychain, `securityd`, and `securityd.xpc` are policy-query-only probes
and explicitly record `behaviorAttempted: false`. Every policy query must be
denied and every permitted behavioral probe must fail before the canary reaches
`rootCalls: 1`. Both contained runs must return the same receipt. Stdout and
stderr are bounded, child execution has a deadline, and disposable directories
are removed in `finally`.

## Exact rendered profile

`profile-manifest.json` pins the placeholder profile-template hash. Each run
substitutes exactly:

- `[DISPOSABLE_ROOT]` with the canonical parent-created writable root;
- `[OPERATOR_HOME]` with `process.env.HOME` for the metadata exclusion and
  policy-path probes only;
- `[COMPILED_BINARY]` with the canonical hash-pinned temporary executable.

Because two substitutions contain random temporary paths, the fully rendered
profile hash is per-run rather than a repository constant. Successful output
records that actual `profileSha256` together with `profileSubstitutionSpec`;
the manifest separately pins `profileTemplateSha256`.

Run the repeatable diagnostic:

```bash
bun .protocols/experiments/r032-v6_3-sandbox/self-test.ts
```

Successful output contains only declared constants, booleans, digests,
substitution labels and disposable basenames. Raw build/child stderr is never
copied into the receipt. Any output overflow, deadline, HEAD/environment/hash
drift, non-zero exit, failed policy query, successful prohibited behavior or
root-before-containment condition fails closed.

The compile step itself is not sandboxed and must remain covered by a later
outer freeze/review/source/status gate. This package is exact observed probe
evidence, not proof of complete macOS isolation, a whole-V6 freeze, collection
approval, candidate evidence, synthesis, mechanism selection, or production
containment.
