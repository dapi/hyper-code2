---
title: "EP-003: Decision Log"
doc_kind: epic
doc_function: decision_log
purpose: "Epic-local decisions governing self-update scope and sequencing."
derived_from:
  - charter.md
  - roadmap.md
status: active
audience: humans_and_agents
must_not_define:
  - code_steps
  - global_architecture_policy_without_adr
---

# EP-003: Decision Log

## Resolved Decisions

| ID | Date | Decision | Facts and reasoning | Consequences |
| --- | --- | --- | --- | --- |
| `DL-01` | 2026-08-15 | Treat self-update as a separate epic | Release packaging, CLI update behavior and recovery verification are independently reviewable delivery units | Use #53 as parent and #54–#57 as ordered subissues |
| `DL-02` | 2026-08-15 | Resolve the artifact/install contract before updater implementation | Current Releases are tag-only and the installation mode is not yet established | #54 gates #55–#57 |
| `DL-03` | 2026-08-15 | Keep workspace/session state outside update scope | Runtime state is workspace-scoped under `.hyper/_runtime`, while update is a CLI installation concern | Update must run before runtime bootstrap and preserve sessions |

## Open Decisions

- Source archive, prepared package or standalone executable for the first supported mode.
- Checksum-only verification or signed release metadata.
- Supported operating systems and CPU architectures.
- Version retention and rollback count.
