# Changelog

All notable changes to this project will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-17

### Added

- Server-rendered UI: landing, docs, dashboard, API keys, usage, status, and Mantle demo pages
- Public API: `/v1/status`, `/v1/sources`, account/key routes, usage routes, and mock Mantle intelligence routes
- API key auth with HMAC-SHA256 hashed storage, timing-safe lookup, and per-prefix revocation
- Usage logging with per-key fixed-window rate limiting and standard `RateLimit-*` headers
- Mantle response envelope with `source`, `freshness`, `indexed_until_block`, `confidence`, `is_partial`, and `warnings` metadata
- Mock Mantle provider behind a `MantleProvider` interface; real provider plugs in without route changes
- Docker Compose development environment with Postgres, health checks, and volume-isolated `node_modules`
- Database migration runner and seed script with clearly marked demo-only data
- Public/private boundary documentation explicitly listing what this repository excludes
