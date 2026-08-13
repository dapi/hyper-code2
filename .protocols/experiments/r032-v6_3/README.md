# R-032 V6.3 whole integration package — precollection freeze

Status: `frozen precollection / collectionUnauthorized`. This additive package binds
the independently bounded runtime and compiled-sandbox components at source
HEAD `a4473e0e2bd0867e673099b24954d38b0b820089`. It contains no collected result.
The earlier whole freeze `2fa0d1ad635ad8a3883435496aef8d0c262a3257cac7297297a152db5416b0b0`
was independently rejected and remains method history only; it cannot authorize
collection. Freeze `fa0c29794833c8cff0969da233b651ad495522f856c0106b4f0689ca368920c6`
was also rejected because its bundle digest framing, governed R018 log gate and
nested carrier validation did not meet the exact review contract.

`collector.ts` performs a no-subprocess outer HEAD/relevant-path hash/review
gate before any temp directory or child. Its author self-test relaunches the
whole parent with only PATH/HOME/TMPDIR/R032_V63_PARENT, compiles the exact
broker child after that gate, runs CAN-06 and COM-03 through contained stdio,
executes all 144 runtime rows in memory, validates the opaque snapshot, removes
S0, rescans stable bytes, and only then can build a carrier. Collection additionally
requires an independent `accepted-precollection` review bound to the exact
freeze SHA. Carrier publication is a staging-directory rename and is never run
by the author self-test.

The source-status receipt is deliberately scoped to exact relevant source,
instrument and component hashes; it does not claim a general Git worktree
parser. Compile is outside sandbox but after the outer gate and under the
minimal parent environment. Sandbox evidence remains host/Bun/Darwin-specific.
Restart is a reconstructed SQLite-store boundary, not a process restart, and
service outages are deterministic adapters, not production failure evidence.

The minimal-env parent writes its exact machine receipt to an explicit file
inside disposable TMPDIR. Production `console.log`, `console.warn`, and
`console.error` calls are captured into bounded in-memory sanitized frames and
restored in `finally`. The stable receipt retains exact level counts, frame-byte
count and digest; raw log content is not copied into the carrier. Sentinel forms,
operator-home paths and credential-path labels fail the run. `--collect` remains unauthorized
until an independent review accepts the exact freeze. No earlier V6/V6.1 review
applies. `freeze.json` is the corrected exact precollection freeze. The author
self-test passed against it; this does not substitute for independent review or
authorize collection.

The canonical bundle digest is computed once over every JSON artifact after
removing only the manifest's `bundleDigest` field; validation recomputes that
same rule. `SHA256SUMS` separately covers the final serialized files. Before a
possible first write, exact validation recomputes results row hashes, controls,
nested containment and provenance receipts, execution and containment digests,
artifact membership, bundle digest and checksum plan. Author self-tests include
every governed R018 sentinel form plus mutations of each critical receipt family.

## Independent review checklist

- Recompute freeze, source, component and instrument hashes; verify HEAD.
- Confirm outer gate precedes temp creation, parent relaunch and compile.
- Confirm exact four-key parent and child environments and bounded deadlines.
- Trace both broker candidates through sandbox stdio with no parent root.
- Re-run runtime and sandbox component adversarial suites.
- Verify exact 144-row validation, S0 removal and final-byte sentinel scan.
- Verify carrier schemas, keyed row hashes, actual containment/provenance and SHA256SUMS.
- Confirm atomic first write and absence of run carrier before approval.
- Preserve all bounded limitations; record exact freeze SHA in review JSON.
