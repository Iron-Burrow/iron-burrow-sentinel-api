# Iron Burrow: `sentinel-api` 📡

<img src="media/sentinel-api.png" alt="sentinel-api" width="300">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node >=20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)
[![pnpm 10](https://img.shields.io/badge/pnpm-10-blue)](package.json)
[![CI](https://github.com/YOUR_GITHUB_ORG/iron-burrow-sentinel-api/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_GITHUB_ORG/iron-burrow-sentinel-api/actions/workflows/ci.yml)

**Iron Burrow Sentinel** is a hackathon-focused public API and server-rendered UI for source-aware Mantle intelligence. It is the public-facing table for agents and builders; private indexers, nodes, RPC details, and future internal gateways stay behind the burrow.

Sentinel is the public table where guests are served.  
Bigwig guards the burrow entrance.  
Indexers cook underground.  
Nodes never meet strangers.

## What Ships

- Server-rendered UI: landing, docs, dashboard, API keys, usage, status, and Mantle demo pages.
- Public API: `/v1/status`, `/v1/sources`, account/key routes, usage routes, and mock Mantle intelligence routes.
- API key auth: keys are generated once, stored hashed, shown only by prefix afterward, and can be revoked.
- Usage logging and fixed-window per-key rate limits with honest rate-limit headers.
- Mantle responses with `source`, `freshness`, `indexed_until_block`, `confidence`, `is_partial`, and `warnings` metadata.

## Prerequisites

- **Node.js** `>=20.0.0`
- **pnpm** `10.x` — `corepack enable && corepack prepare pnpm@latest --activate`

For normal development, Docker and Docker Compose handle the runtime. Host-local Node is only needed to run checks outside of containers.

## Environment Variables

Copy `.env.example` to `.env` for development. See `.env.production.example` for production guidance.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes (prod) | `postgresql://postgres:postgres@localhost:5432/iron_burrow_sentinel` | PostgreSQL connection string |
| `API_KEY_HASH_SECRET` | **Yes (prod)** | `dev-…-change-me` | HMAC secret for hashing stored API keys. Use ≥32 random bytes in production. |
| `SESSION_SECRET` | **Yes (prod)** | `dev-…-change-me` | Session signing secret. Use ≥32 random bytes in production. |
| `RATE_LIMIT_WINDOW_SECONDS` | No | `60` | Rolling window length for per-key rate limiting |
| `RATE_LIMIT_REQUESTS` | No | `60` | Maximum requests per key per window |
| `RATE_LIMIT_COST_UNITS` | No | `600` | Total cost-unit budget per key per window |
| `PORT` | No | `3000` | HTTP listen port |

> **Never commit real values for `API_KEY_HASH_SECRET` or `SESSION_SECRET`.** Rotate immediately if leaked.

## Docker Run

```bash
cp .env.example .env
docker compose up
```

Open `http://localhost:3000`.

The app, Postgres, dependency install, and migrations run inside Docker. The Compose file mounts `node_modules` and the pnpm store as Docker volumes so the host workspace stays focused on source files.
Do not start a host-local app process for normal development; use Compose as the runtime boundary.

Run checks in the app container:

```bash
docker compose run --rm app sh -lc "corepack enable && pnpm install && pnpm typecheck && pnpm test"
```

## Judge Demo Flow

1. Open `/` and use the API key form.
2. Copy the generated key once.
3. Call an endpoint:

```bash
curl -H "Authorization: Bearer ibs_test_your_key" \
  http://localhost:3000/v1/mantle/assets/0x1111111111111111111111111111111111111111/summary
```

4. Open `/usage` to see request logging and `/mantle-demo` for the demo signals page.

## API Examples

Create an API key:

```bash
curl -X POST http://localhost:3000/v1/api-keys \
  -H "content-type: application/json" \
  -d '{"email":"builder@example.com","name":"Hackathon Builder","keyName":"Demo key"}'
```

Check usage:

```bash
curl -H "X-API-Key: ibs_test_your_key" http://localhost:3000/v1/me/usage
```

List sources:

```bash
curl http://localhost:3000/v1/sources
```

## Public And Private Boundary

This repository intentionally uses mock Mantle data behind a provider interface. It does not include real RPC URLs, production secrets, private indexer internals, internal database inspection routes, or infrastructure gateway details.

See:

- [API docs](docs/api.md)
- [Architecture](docs/architecture.md)
- [Public/private boundary](docs/public-private-boundary.md)

## Contributing

1. Fork the repository and create a feature branch from `main`.
2. Run `docker compose run --rm app sh -lc "corepack enable && pnpm install && pnpm typecheck && pnpm test"` to confirm the build and tests pass.
3. Open a pull request against `main` and fill out the PR template.

## Two-Developer Workflow

Sentinel is built to stay comfortable for two people working in parallel: one frontend-focused developer and one backend-focused developer. The split is about clear leads, not hard walls; either person can help across the stack when a change crosses the boundary.

The frontend lead owns the server-rendered UI and browser experience:

- `views/*` page rendering.
- `public/*` styles, scripts, and static assets.
- Landing, docs, dashboard, API keys, usage, status, and Mantle demo page flows.
- Browser-side behavior, page copy, layout, responsive polish, and demo UX.

The backend lead owns the API, data, and service behavior:

- JSON/API behavior in `src/routes/*`.
- Database access in `src/db/*` and migrations in `migrations/*`.
- Middleware in `src/middleware/*`, including auth, rate limits, request IDs, and usage logging.
- Mantle provider boundaries in `src/providers/*`, plus backend tests.

Shared touchpoints should be called out early in a PR. `src/routes/web.ts` is shared because it connects Hono routes to rendered pages. Backend changes to public API behavior must update `docs/api.md`. Frontend pages that consume API responses should coordinate with backend changes before merging.

See [SECURITY.md](SECURITY.md) for the responsible disclosure policy.
