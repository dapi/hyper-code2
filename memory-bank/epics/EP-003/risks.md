---
title: "EP-003: Risks"
doc_kind: epic
doc_function: risk_register
purpose: "Cross-feature release integrity, activation, compatibility and scope risks for EP-003."
derived_from:
  - charter.md
  - roadmap.md
status: active
audience: humans_and_agents
---

# EP-003: Risks

| Risk ID | Risk | Impact | Control | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| `ERISK-01` | Artifact or release metadata is tampered with or misbound to a tag | Executable compromise or wrong version installed | Pinned repository, SemVer validation, checksum/signature verification and version match | `EP-SI-01/02` | open |
| `ERISK-02` | Update leaves a partial installation | `hcode` stops launching | Temporary staging, atomic activation and rollback tests | `EP-SI-04` | open |
| `ERISK-03` | Updater overwrites local checkout changes | User work is lost | Detect unsupported checkout/layout and refuse unsafe update | `EP-SI-01/03` | open |
| `ERISK-04` | Release artifact omits runtime files or has incompatible Bun requirements | Installed version cannot run | Clean-fixture smoke test and compatibility metadata | `EP-SI-02` | open |
| `ERISK-05` | Update starts runtime or touches workspace state | Session disruption or unintended side effects | Keep update path before runtime bootstrap; assert with tests | `EP-SI-03` | open |
| `ERISK-06` | Scope expands into npm distribution or binary platform matrix | Delivery stalls and contracts diverge | Explicit non-scope and owner decision in `W0` | Epic owner | open |
