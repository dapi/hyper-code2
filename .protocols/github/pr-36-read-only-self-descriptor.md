## Outcome

Adds the first read-only, source-grounded SelfDescriptor slice from EP-002 and
keeps all mutation/activation work out of scope.

Source requirement from Nikolay Ryzhikov (`@niquola`):
`я бы добавил еще самоосознание более явно - те агент знает как он написан и может себя менять ;)`

Source: https://t.me/c/1951583351/97428

## What changed

- preserves the source wording and adds PRD-002, UC-008, EP-002, R-035 and
  R-036 governance packages;
- routes the effective-origin inconsistency separately in #35 and fixes reload
  precedence so `.hyper` wins consistently;
- records transient SHA-256 loader receipts for the function actually loaded at
  startup or hot reload;
- adds `ctx.fns.self.describe` schema v1 with capability candidates, effective
  origin, freshness, prompt identities, state categories and authority
  categories;
- excludes prompt, environment, credential, session, scratchpad, database and
  arbitrary state values, with a sentinel non-transit regression;
- adds loopback-only `GET /self`; non-loopback peers receive 403 before the
  descriptor is evaluated.

## Validation

- Bun 1.3.14 typecheck: pass
- Full Bun suite: 413 pass, 3 opt-in provider skips, 0 fail
- Targeted loader/descriptor/route suite: 12 pass
- Real served `GET /self`: HTTP 200, `application/json`, schema v1, 156
  capabilities, `self.describe` observed/fresh, no values included
- `memory-bank-cli lint`: pass
- `memory-bank-cli doctor -json`: 0 errors, 39 existing navigation-depth warnings
- `git diff --check`: pass

## Tracking

- Addresses #35
- Addresses #36

Base branch: `chore/memory-bank-adoption`
