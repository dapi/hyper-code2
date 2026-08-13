# Changelog

## Unreleased

### Added

- Added a read-only `SelfDescriptor` that reports loaded capabilities, source
  candidates, effective origins, and source freshness.
- Added the loopback-only `GET /self` JSON endpoint with schema versioning and
  `Cache-Control: no-store` responses.
- Added transient loader receipts with SHA-256 hashes, including reliable
  `.hyper` overlay precedence and unavailable-source reporting.
- Added bounded visibility into prompt layers, runtime state categories, and
  available authority categories without exposing secrets or state values.
