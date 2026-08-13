Parent epic: EP-001 `EP-SI-10`.

## Decision question

Which capability surface best preserves ordinary function composition while
making discovery, callable contracts and authority sufficiently clear?

## Alternatives

- current/free `ctx.fns` composition;
- descriptor-backed mediated calls;
- generated typed projection;
- hybrid explicit enrollment.

## Evidence criteria

Compare representative `VAL-01…VAL-05` tasks, discovery success, composability,
context cost, incorrect calls, authority clarity, migration cost and implementation
complexity. The first live UC-005 run is evidence of discovery/signature friction,
but does not show that mediation is the preferred solution.

## Output

Recommendation with limitations. Produce an ADR proposal only if evidence supports
a project-wide architecture choice. Do not implement the candidate design here.
