---
title: "R-014: Evidence Log"
doc_kind: research
doc_function: canonical
purpose: "Traceable first comparison of current and proposed capability surfaces."
derived_from: [brief.md, plan.md, ../../flows/research.md]
status: active
audience: humans_and_agents
---
# R-014: Evidence Log

## Sources

| ID | Source / provenance | Date | Quality note |
| --- | --- | --- | --- |
| `SRC-01` | [R-001 live evidence](../R-001/evidence.md) | 2026-08-13 | Runtime evidence for current surface; one task |
| `SRC-02` | [Current generated function types](../../../src/genTypes.ts) | 2026-08-13 | Primary code; describes current projection |
| `SRC-03` | [GitHub #14](https://github.com/dapi/hyper-code2/issues/14) | 2026-08-13 | Research framing, not implemented evidence |
| `SRC-04` | [GitHub #16](https://github.com/dapi/hyper-code2/issues/16) | 2026-08-13 | Parked candidate, not implemented evidence |

## Observations

| ID | Observation | Source | Boundary |
| --- | --- | --- | --- |
| `OBS-01` | Current free function surface supports ordinary composition and restart reuse, but the live agent misread a callable signature and falsely claimed success. | [SRC-01](../R-001/evidence.md) | One task/model/run |
| `OBS-02` | Current code generates a typed `ctx.fns` view, so generated typing and free composition are not mutually exclusive concepts. | [SRC-02](../../../src/genTypes.ts) | Does not show what the model actually sees or understands |
| `OBS-03` | Mediated and broader generated alternatives have no comparable runtime fixture, correctness trace, authority measurement or migration measurement. | [SRC-03](https://github.com/dapi/hyper-code2/issues/14), [SRC-04](https://github.com/dapi/hyper-code2/issues/16) | Absence of evidence is not rejection |

## Collection Log

| Date | Activity | Result | Deviation |
| --- | --- | --- | --- |
| 2026-08-13 | Compared current runtime evidence with candidate issue contracts | Comparison is asymmetric; architecture choice cannot be supported | Candidate prototypes do not exist |
