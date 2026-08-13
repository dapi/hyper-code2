---
title: "R-018: Research Plan"
doc_kind: research
doc_function: canonical
purpose: "Boundary inventory and sentinel experiment method for R-018."
derived_from: [brief.md, ../../flows/research.md]
status: active
audience: humans_and_agents
---
# R-018: Research Plan

## Approval Gate

Danil Pismenny authorized the plan's static inventory and isolated synthetic
sentinel collection by instructing the orchestrator to add the reviewed work to
the plan and act on 2026-08-13. This approval does not authorize real secrets,
production/shared state, public network access or a mechanism decision.

## Method

| Question / hypothesis | Method | Why this method fits | Quality threshold |
| --- | --- | --- | --- |
| `RQ-01`, `HYP-01` | Read-only static data-flow inventory | Establishes source, transform and sink coverage before choosing a mechanism | Every included source and sink has a stable code link; each path names success, error, serialization and retry behavior or explicitly records absence |
| `RQ-01`, `HYP-02` | Isolated deterministic sentinel experiment over the approved inventory | Tests observable non-transit without real secrets | All planned cells produce attributable captures; zero sentinel variants in prohibited sinks; controls prove the sentinel was present at the source and detectors find positive-control copies |
| `RQ-01` | Mechanism-neutral gap synthesis after collection | Separates observed gaps from implementation choice | Recommendation names limitations and does not generalize beyond the inventory |

## Sources or Sample

| Group / source | Inclusion and exclusion | Target / access boundary | Sampling limitation |
| --- | --- | --- | --- |
| Canonical security contract | [Trust and security boundary](../../engineering/security-boundary.md) and PRD-002 `BR-05/VAL-08`; exclude issue prose as evidence of runtime behavior | Repository read only | Target statements do not prove implementation |
| Declared-secret inputs | Provider-related settings and endpoint resolution, beginning with [`src/llm/resolveEndpoint.ts`](../../../src/llm/resolveEndpoint.ts) and `src/llm/$setting_*ApiKey.ts`; extend only through static references found from these roots | Repository read only; never read actual values or credential stores | Static references may miss dynamically resolved or provider-owned sources |
| Model request construction | [`src/agent/buildLlmRequest.ts`](../../../src/agent/buildLlmRequest.ts), [`src/agent/llmCall.ts`](../../../src/agent/llmCall.ts), `src/llm/stream*.ts` and message converters | Repository read only during inventory; isolated mock/capture boundary during approved collection | Provider adapters may differ and require explicit per-adapter cells |
| Action result and error paths | [`src/agent/run.ts`](../../../src/agent/run.ts), [`src/agent/executeMarker.ts`](../../../src/agent/executeMarker.ts), [`src/agent/formatMarkerResult.ts`](../../../src/agent/formatMarkerResult.ts), REPL, bash, read/write/edit/grep success and failure paths | Tests use synthetic fixtures only; agent action process has no real secrets, network or home access | Initial matrix covers declared marker actions, not arbitrary future functions |
| Persistence and rendering sinks | `src/session/append*`, `replace*`, `save.ts`, `getMessages.ts`, `getEvents.ts`, agent event routes and rendering helpers | Disposable database and captured in-memory/rendered outputs only | Unknown telemetry or provider-side retention remains outside proof unless inventoried |
| Positive and negative controls | A deliberate allowed source capture and deliberate prohibited-sink copy for every detector family; a no-sentinel run | Isolated test-only fixtures | Controls validate detection, not inventory completeness |

## Collection Window

- Inventory snapshot: one approved commit SHA, recorded before collection.
- Collection: one bounded run per approved source × path × outcome cell plus its
  positive and negative controls, completed within five working days of the
  snapshot. If code changes in an inventoried path, stop and re-approve the snapshot.
- Freshness: evidence is valid only for the recorded SHA and runner version.

## Finite Sentinel Encoding Matrix

Choose one deterministic, non-secret UTF-8 sentinel with punctuation before the
run. Record its literal and detector digests in the run manifest. Search only the
following predeclared forms, deduplicating byte-identical forms:

| ID | Representation | Construction |
| --- | --- | --- |
| `S0` | Raw UTF-8 | Sentinel bytes unchanged |
| `S1` | JSON string escaped | JSON-escaped content, with and without enclosing quotes |
| `S2` | URL encoded | UTF-8 percent encoding with uppercase hexadecimal digits |
| `S3` | Standard Base64 | RFC 4648 standard alphabet with padding |
| `S4` | Base64url | RFC 4648 URL-safe alphabet without padding |
| `S5` | Lowercase hexadecimal | Lowercase hex of UTF-8 bytes |
| `S6` | Uppercase hexadecimal | Uppercase hex of UTF-8 bytes |
| `S7` | Shell single-quote form | POSIX single-quoted representation with embedded quote escaping |
| `S8` | Normalized text | NFC-normalized sentinel; include only if distinct from `S0` |

Before collection, the static transform map must either justify this matrix for
every inventoried path or amend the plan and obtain approval again. Hashes and
encryption outputs are not searched by guessing: if code applies a deterministic
transform, add its exact output as a separately reviewed finite cell.

## Collection Protocol

1. Record approved repository SHA, runner version, platform and the complete
   inventory of source → transform → sink paths in a manifest.
2. Prove containment before sentinel injection: allowlisted environment only,
   no agent access to provider credentials or home, denied network, disposable
   workspace/database, and enforced write boundary. Abort on failure.
3. Run a no-sentinel negative control and detector positive controls for `S0–S8`.
4. Inject the sentinel at exactly one declared-secret fixture source per cell.
5. Exercise success, thrown error, serialization failure and retry/cancellation
   where the static inventory shows those paths exist. Do not fabricate absent paths.
6. Capture pre-provider model requests, synthetic result/error messages,
   persistence rows, rendered events and any inventoried external sink.
7. Match byte-exact `S0–S8`, associate every hit with source/path/outcome, and
   fail closed on any hit in a prohibited model-visible or external sink.
8. Store sanitized artifacts and checksums in the stable carrier. Do not begin
   synthesis until a reviewer confirms matrix completeness for the snapshot.

## Stable Evidence Carrier

After approval, create `memory-bank/research/R-018/evidence.md` as the provenance
log and a run directory under `.protocols/experiments/runs/R-018/<run-id>/` for
sanitized manifests, captures and checksums. `evidence.md` must link each `SRC-*`
to a committed carrier file and record SHA, date, runner version, collection
context and quality note. Never commit credentials, home paths, raw provider
tokens or private content. This paragraph specifies the carrier; it is not an
evidence claim and does not authorize collection.

## Controls

| Risk | Control | Owner |
| --- | --- | --- |
| Confirmation bias toward a preferred mechanism | Inventory and run the same sink assertions before comparing mechanisms; record failures without solution labels | Research owner; decision owner reviews |
| Incomplete source/sink inventory | Two-person review of the static route/data-flow map; unresolved dynamic paths remain unknowns | Research owner and delegated security reviewer |
| Detector false negative | Positive controls for every distinct sentinel form and capture layer | Experiment operator; security reviewer verifies |
| Detector false positive | No-sentinel control and byte-exact matching with cell provenance | Experiment operator |
| Provider/adapter confounding | Separate cell per included adapter; do not generalize untested adapters | Research owner |
| Real secret or private-data exposure | Synthetic sentinel only; never inspect actual credential values; sanitized stable carrier | Experiment operator and security reviewer |
| Agent escape through environment, filesystem or network | Minimal allowlisted child environment, no home/credential mounts, denied network, enforced disposable write root, abort on violation | Experiment operator; security reviewer approves containment |
| Evidence loss or unverifiable summary | Committed manifest/captures/checksums linked from `evidence.md` | Research owner |
| Scope overclaim | Findings limited to recorded SHA, adapters, sources, sinks and matrix | Decision owner |

## Stop Rules

- `STOP-01` Do not start collection without a recorded plan approval.
- `STOP-02` Stop on containment failure, access to a real secret, any write outside
  the disposable root, any unplanned network attempt or missing provenance.
- `STOP-03` Stop a cell on sentinel transit to a prohibited sink; retain sanitized
  evidence and do not continue merely to accumulate more failures.
- `STOP-04` Stop the cycle when every approved matrix cell and control has an
  attributable result, or when an inventory gap prevents a reliable conclusion.
- `STOP-05` A clean run is bounded evidence only and cannot satisfy the stopping
  condition if inventory review or detector positive controls are incomplete.

## Plan Approval

| Field | Value |
| --- | --- |
| Reviewer / decision owner | Danil Pismenny or a delegated security reviewer |
| Approval reference | Danil Pismenny, 2026-08-13: add the reviewed work to the plan and act; static/mock/synthetic scope only |

## Execution Record

The original `20260813-static-mock-01` carrier is retained as the record of the
first partial attempt. The corrected
`20260813-os-contained-static-mock-02` repetition executed `CELL-01` in a
separate macOS `sandbox-exec` child. That child recorded and passed containment
controls before detector controls and sentinel injection. `STOP-03` fired on the
first prohibited sink, so the remaining current-state cells were not executed.

Independent review rejected `-02` as closure evidence because its profile
contained a broad `mach-lookup` allowance and did not probe macOS keychain
denial. The immutable `20260813-keychain-contained-static-mock-03` repetition
removed every `mach-lookup` allowance. Before injection it additionally:

- queried the active sandbox policy for `com.apple.securityd` and
  `com.apple.securityd.xpc` through a compiled `sandbox_check` probe;
- attempted a deterministic lookup for nonexistent service
  `com.hyper-code2.r018.nonexistent` and account `r018-contained-probe`;
- attempted a direct read of the operator's login keychain path.

Both named Mach lookups and the direct keychain-path read were denied, and the
nonexistent lookup failed while those policy denials were active. The carrier
retains the exact sanitized profile and classifications, not raw keychain
content or command output. These controls prove only the recorded paths and
named services; they do not prove denial of every credential store.

For the current-route conformance question, that repeated prohibited transit is
the planned disconfirming signal: accumulating the same unmitigated failure over
additional outcomes would not help choose a mechanism. The complete
success/error/serialization/retry matrix remains an acceptance requirement for
future candidate comparisons, not evidence collected by this cycle.
