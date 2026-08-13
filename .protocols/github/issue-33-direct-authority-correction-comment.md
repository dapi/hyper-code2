The second independent inventory review found another blocking omission: direct
generated-code authority through the shared root `ctx`. Candidate prototype
collection still has not started.

R-033 now additionally inventories:

- startup copying `process.env` into `ctx.env`;
- generated eval receiving the root context with `env`, `state`, routes and the
  full generated `ctx.fns` registry;
- `settings.get` returning raw parsed DB values or declared environment values;
- `settings.getString` returning strings unchanged;
- `settings.list` returning parsed values even when `isSecret` is true;
- arbitrary caller-supplied SQL through generated `db.select`;
- the remaining same-process filesystem, shell and keychain authority described
  by the canonical security boundary.

The common matrix is expanded symmetrically through `CC-14`. For every
candidate, synthetic DB/env/file/keychain sources must be unavailable to
generated code or mediated as an authorized opaque reference/bounded projection;
clean transport and sink captures alone are insufficient.

All newly inspected files match published baseline `06ae8df`. Inspection was
read-only: no generated code, setting lookup, SQL, environment-value read, file
or keychain command executed. R-033 remains `collecting` at the renewed
independent inventory-review gate.
