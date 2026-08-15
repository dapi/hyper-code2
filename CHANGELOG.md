# Changelog

## Unreleased

### Added

- Added a full-screen, streaming `hcode` TUI with a multiline composer,
  durable conversation viewport, live assistant activity, and explicit trusted
  execution-mode status.
- Added a read-only `SelfDescriptor` that reports loaded capabilities, source
  candidates, effective origins, and source freshness.
- Added the loopback-only `GET /self` JSON endpoint with schema versioning and
  `Cache-Control: no-store` responses.
- Added transient loader receipts with SHA-256 hashes, including reliable
  `.hyper` overlay precedence and unavailable-source reporting.
- Added bounded visibility into prompt layers, runtime state categories, and
  available authority categories without exposing secrets or state values.

### Fixed

- Fall back to the line terminal client when modified Enter cannot be reported,
  so interactive submissions remain possible in unsupported terminals.
- Preserve a newly typed composer draft while an earlier submission is awaiting
  durable acceptance.
