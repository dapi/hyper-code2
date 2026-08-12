Bug Fix reproduction completed against commit `d119f1c` in the isolated worktree
`~/.worktrees/hyper-code2-issue-27` on branch
`agent/issue-27-reproduction`.

The reproduction is durable in commit
[`792a166`](https://github.com/dapi/hyper-code2/commit/792a166).

The new regression in `src/session/getFullMessages.test.ts` creates a child,
then edits the first and deletes the second parent message inside the inherited
prefix. The child was expected to retain:

```text
["original first", "original second", "child continuation"]
```

It instead returned:

```text
["edited first", "child continuation"]
```

Targeted result: four pre-existing tests pass and the new regression fails at
the immutable-prefix assertion. `git diff --check` passes. No fix or storage
design is included; if the fix requires a material persistence/migration choice,
the Bug Fix Flow must stop and reroute that decision.
