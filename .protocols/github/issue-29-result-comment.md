The first R-029 static/mock stage produced partial evidence without opening a
socket. It does not complete the plan: route/control reconciliation and an
independent matrix review remain pending.

At fixed commit `d119f1c`:

- 34 route handlers plus two registered scripts produced 36 committed-source
  dispatch entries;
- all nine inventoried authority classes were represented by mocked cases;
- no route-local caller identity/authorization gate was discovered;
- missing, malformed and synthetic-invalid identity material reached
  representative eval, file-write, scheduling, fork, stop and settings stubs;
- mocked `Bun.serve` captured requested hostname `0.0.0.0`;
- privileged roots were stubbed and no real listener, credential, provider,
  home file or shared runtime state was used.

The result confirms a committed-source caller-authority gap and separates bind
policy from caller authorization. Runtime `.hyper` overlays and actual interface
reachability remain unknown and separately gated. No authentication, token,
socket, route-separation or process-isolation mechanism is selected.
