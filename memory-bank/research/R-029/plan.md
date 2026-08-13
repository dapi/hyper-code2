---
title: "R-029: Research Plan"
doc_kind: research
doc_function: canonical
purpose: "Static route inventory and controlled authority-test protocol for R-029."
derived_from:
  - brief.md
  - ../../flows/research.md
status: active
audience: humans_and_agents
---

# R-029: Research Plan

## Approval Boundary

Static read-only inventory and mocked direct-handler tests are the planned primary
method. A real listener/reachability stage is optional and requires a separate
approval recorded below. This plan does not authorize public/shared exposure and
does not select an authority mechanism.

## Method

| Question / hypothesis | Method | Why this method fits | Quality threshold |
| --- | --- | --- | --- |
| `RQ-01`, `HYP-01` | Static listener, route-discovery and route-to-authority inventory at a fixed SHA | Establishes actual surface and privileged call paths before generalizing | Every discovered route has method, source, dispatch path, direct/transitive authority class and evidence link; inventory reconciles scanner output with route files |
| `RQ-01`, `ASM-02` | Mocked `Bun.serve` capture and direct handler tests with synthetic requests | Tests bind configuration, dispatch and caller checks without opening a socket | Listener options captured without binding; each authority class has positive and negative caller cases; no real credentials or shared state |
| `RQ-01` | Optional isolated-network reachability test | Answers interface-level reachability only if static/mock evidence cannot | Separate approval; disposable isolated namespace; expected interface matrix captured; zero public/shared/user-network reachability |

## Sources or Sample

| Group / source | Inclusion and exclusion | Target / access boundary | Sampling limitation |
| --- | --- | --- | --- |
| Listener and dispatcher | [`src/http/$start.ts`](../../../src/http/$start.ts), [`src/http/loadRoutes.ts`](../../../src/http/loadRoutes.ts), [`src/http/match.ts`](../../../src/http/match.ts), project scanner/roots used by discovery | Repository read only; mock `Bun.serve`, never bind during this stage | Runtime-generated routes outside scanner conventions must be recorded as unknowns |
| Static route files | Every `src/**/$route*.ts`, plus script/static entries registered by the route loader | Fixed-SHA route manifest | Filename inventory alone does not establish transitive authority |
| Authority roots | REPL/eval, bash, file helpers, git mutations, settings/credential access, session/agent mutation and provider invocation reachable from routes | Code reading and direct handler calls with stubbed dependencies | Classification is limited to reachable code at the snapshot |
| Caller controls | Any route-local or route-independent authentication, authorization, origin, bind, token, identity or middleware checks found statically | Synthetic allowed/denied requests; no real identities | Absence claim requires complete inventory review |
| Real reachability sample | Loopback and explicitly created isolated peer only, if separately approved | Disposable network namespace/container with no default route or host/public bridge | Does not represent production ingress, shared LAN or multi-user deployment |

## Static Route Inventory Protocol

1. Record repository SHA and tool versions.
2. Enumerate `src/**/$route*.ts` and the project scanner classifications used by
   `loadRoutes`; reconcile file-derived and loader-derived sets.
3. For every route, record HTTP method, normalized path, source file, loader rule,
   handler dependencies and response/error behavior.
4. Trace direct and transitive calls into authority classes: in-process eval,
   shell, filesystem read/write, git mutation/push, settings/credentials, model
   invocation, agent/session mutation and server/process control.
5. Record every caller-control check, where it executes and which routes it covers.
   Do not convert “no check found yet” into a repository-wide absence claim.
6. Review the matrix for unresolved dynamic registrations. Mark incomplete paths
   as unknown rather than excluding them silently.

## Mocked Test Protocol

1. Replace `Bun.serve` with a capture stub and invoke the listener start function;
   assert hostname/interface, port source and dispatcher without opening a socket.
2. Construct synthetic `Request` objects for every route/authority class and call
   handlers or the captured dispatcher directly with disposable context/state.
3. For each discovered caller control, include allowed, missing, malformed and
   unauthorized cases. If no control is found for a route, record the observation
   at that route only and include a request without identity material.
4. Stub eval, bash, filesystem, git, provider and settings authority roots. Assert
   whether the handler reaches each stub; do not execute the privileged operation.
5. Exercise handler success, parse/validation failure and dependency failure where
   those paths exist. Capture status and whether privileged stubs were reached.
6. Reconcile test coverage with the static matrix before synthesis.

## Optional Isolated Reachability Protocol

This stage remains prohibited until its separate approval reference is recorded.
If approved because static/mock evidence is insufficient:

1. Use a disposable network namespace or equivalent isolated container with no
   public route, host bridge, shared LAN, tunnel, ingress or port-forward.
2. Mount no home directory or credential store; use synthetic state, a minimal
   allowlisted environment and an enforced disposable write root.
3. Start the server only inside that boundary. Probe from loopback and one explicitly
   created isolated peer; assert the predeclared reachable/unreachable matrix.
4. Capture bind metadata and probe results, then terminate the environment.
5. Stop immediately if the listener is reachable from any unplanned interface.

## Collection Window and Evidence Quality

- Inventory and mocked tests use one recorded commit SHA and must finish within
  five working days of that snapshot. Any route/loader/auth change invalidates the
  snapshot and requires a refreshed inventory.
- A route-level conclusion requires a stable source link and reproducible mocked
  result. A repository-wide statement additionally requires reconciled inventory,
  control coverage and review of unresolved dynamic paths.
- Real reachability evidence, if approved, is valid only for the captured topology;
  it cannot support production, multi-user or public-exposure claims.

## Stable Evidence Carrier

After collection begins, create `memory-bank/research/R-029/evidence.md` as the
provenance log and store sanitized manifests/test captures/checksums under
`.protocols/experiments/runs/R-029/<run-id>/`. Each material claim must link to a
committed `SRC-*` record with SHA, date, environment, collection context and quality
note. Do not commit credentials, home paths, private content or live network data.
This defines the carrier and is not a claim that evidence already exists.

## Controls

| Risk | Control | Owner |
| --- | --- | --- |
| Confirmation bias toward a mechanism | Complete route/control inventory before option comparison; use mechanism-neutral authority classes | Research owner; decision owner reviews |
| Route omission | Reconcile route files, scanner output and loader registry; independent matrix review | Research owner and reviewer |
| Static-analysis false certainty | Mark dynamic/unresolved paths unknown; corroborate material route claims with direct-handler tests | Research owner |
| Handler-test side effects | Stub all privileged roots; disposable context/database; assert stubs rather than execute authority | Experiment operator |
| Mock vs network confounder | Use real reachability only for interface questions and label topology limits | Research owner and security reviewer |
| Accidental exposure | No real socket in primary stage; isolated namespace only after approval; no tunnel/bridge/default route | Experiment operator and security reviewer |
| Secret/private data access | Synthetic requests/state, minimal environment, no home/credential mounts | Experiment operator |
| Evidence overclaim | Limit claims to SHA, route matrix, controls and topology; broad auth statement remains provisional until reviewed | Decision owner |

## Disconfirming Signals

- A route-independent control may already enforce equivalent caller authority for
  all privileged routes.
- The documented all-interface bind may be overridden before the effective listener
  starts in the tested configuration.
- Routes may divide into materially different authority classes, invalidating one
  repository-wide target contract.

Each signal must be actively checked; none is currently asserted as observed.

## Stop Rules

- `STOP-01` Stop static/mock collection when the reconciled route matrix, caller
  controls and authority-stub results have reviewed coverage, or when unresolved
  dynamic behavior makes a reliable conclusion impossible.
- `STOP-02` Do not run real reachability without separate approval.
- `STOP-03` Stop immediately on any real credential/private-data access, unexpected
  socket, unplanned interface reachability, or write outside the disposable root.
- `STOP-04` Do not select or implement a mechanism in this package's collection stage.

## Plan Approval

| Field | Value |
| --- | --- |
| Static inventory and mocked tests reviewer | Danil Pismenny or delegated reviewer |
| Static/mock approval reference | Danil Pismenny, 2026-08-13: add the reviewed work to the plan and act |
| Real reachability reviewer | Danil Pismenny and delegated security reviewer |
| Real reachability approval reference | **Pending — real listener tests are prohibited** |

## Collection Progress

| Gate | State | Evidence / boundary |
| --- | --- | --- |
| Fixed-source entry reconciliation | complete | 34 route handlers plus two loader scripts reconcile to 36 unique dispatch entries at source baseline `d119f1c` |
| Common and route-local caller-control review | complete | Listener, matcher, loader and every entry source have per-entry evidence in the additive v2 carrier |
| Synthetic dispatch variants | complete | Missing, malformed and synthetic-invalid identity material reached the handler boundary for every entry: 108 captured calls, no socket |
| Authority timing reconciliation | complete | All nine planned classes map to their immediate and/or deferred paths; no authority root was executed |
| Handler coverage classification | complete | Seven entries link repository tests; 29 entries carry an explicit static-only rationale; the prior run retains 11 representative direct-handler mocks |
| Independent matrix review | complete | Separate reviewer signed off entry completeness and control classifications for the bounded committed-`src` claim; manual authority timing remains a code-path classification rather than certified runtime behavior |
| Optional real reachability | prohibited / not required for this gate | No approval exists; requested bind configuration is not actual interface reachability |

Static/mock collection stopped under `STOP-01` after the complete technical
reconciliation. Independent review then signed off the bounded committed-`src`
caller-control claim. The next action inside this research package is decision
preparation and owner disposition; mechanism comparison remains outside collection.
