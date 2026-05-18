# Iron Burrow: `sentinel-api` 📡

<img src="media/sentinel-api.png" alt="sentinel-api" width="300">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node >=20](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)
[![pnpm 10](https://img.shields.io/badge/pnpm-10-blue)](package.json)

**Iron Burrow Sentinel** is a hackathon-focused public API and server-rendered UI for source-aware Mantle intelligence. It's an agent-facing intelligence layer that turns raw on-chain activity and price data into structured, evidence-backed signals that autonomous agents, bots, and human operators can use before making decisions.

Instead of only exposing indexed events, Sentinel answers questions such as:

- What changed in asset liquidity?
- Is holder concentration increasing?
- Which wallets accumulated before volatility?
- Where is the current price relative to its 7-day range?
- What changed since a specific block?

Each answer includes metrics, evidence, confidence, and limitations.

For this hackathon, Sentinel focuses on Mantle assets such as `mETH`, `USDY`, and `MNT`, with the goal of helping AI agents understand market and protocol activity without relying on vague or hallucinated context.

**Iron Burrow Sentinel gives agents eyes, memory, and evidence on-chain.**

The architecture maintains a clean public-private boundary: Sentinel is the public-facing table for agents and builders, while private indexers, nodes, RPC details, and future internal gateways stay behind the burrow.

## Architecture

```txt
                         OUTSIDE THE BURROW
                    Humans · Bots · Agents · Builders
                                   │
                                   │
                                   ▼
                    ┌────────────────────────────┐
                    │  Iron Burrow Sentinel UI   │
                    │  Server-rendered public UI │
                    └─────────────┬──────────────┘
                                  │
                                  │ HTTP / API requests
                                  ▼
              ┌────────────────────────────────────────┐
              │        Iron Burrow Sentinel API        │
              │                                        │
              │  Public-facing hackathon API           │
              │  - Rate limits public access           │
              │  - Serves source-aware responses       │
              │  - Logs every request and response     │
              │  - Exposes only safe public surfaces   │
              └───────────────┬───────────────┬────────┘
                              │               │
              ┌───────────────┘               └────────────────┐
              │                                                │
              ▼                                                ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│ Iron Burrow Price Indexer    │              │        Bigwig Gateway        │
│                              │              │                              │
│ Private price intelligence   │              │ Guards low-level blockchain  │
│ - Source-aware prices        │              │ access behind the burrow     │
│ - Transparent provenance     │              │ - RPC pressure control       │
│ - Confidence / freshness     │              │ - Chain-specific limits      │
└───────────────┬──────────────┘              │ - No strangers touch nodes   │
                │                             └───────────────┬──────────────┘
                │                                             │
                │                                             ▼
                │                             ┌──────────────────────────────┐
                │                             │ Private Blockchain Nodes     │
                │                             │                              │
                │                             │ Mainnet · Mantle · Sepolia   │
                │                             └──────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────────────────────────┐
│                      Iron Burrow API                               │
│                                                                    │
│ Internal mother API of the burrow                                  │
│ - Canonical access to Iron Burrow data                             │
│ - Reads from the properly stored indexed database                  │
│ - Keeps private schemas, indexing details, and internal logic safe │
└───────────────────────────────┬────────────────────────────────────┘
                                │
                                ▼
                 ┌──────────────────────────────┐
                 │ Iron Burrow Database         │
                 │                              │
                 │ Correctly stored historical  │
                 │ data, indexed facts, prices, │
                 │ entities, and future signals │
                 └───────────────┬──────────────┘
                                 ▲
                                 │
                  ┌──────────────┴───────────────┐
                  │ Private Iron Burrow Indexers │
                  │                              │
                  │ Cook underground.            │
                  │ They write the facts.        │
                  └──────────────────────────────┘
```

- Sentinel is the public table where guests are served.
- Bigwig guards the burrow entrance.
- Indexers cook underground.
- Iron Burrow API is the mother API where canonical data is served.
- Nodes never meet strangers.
- Sentinel records everything.

## What Ships

- Server-rendered UI: landing, docs, dashboard, API keys, usage, status, and Mantle demo pages.
- Public API: `/v1/status`, `/v1/sources`, account/key routes, usage routes, and mock Mantle intelligence routes.
- API key auth: keys are generated once, stored hashed, shown only by prefix afterward, and can be revoked.
- Usage logging and fixed-window per-key rate limits with honest rate-limit headers.
- Mantle responses with `source`, `freshness`, `indexed_until_block`, `confidence`, `is_partial`, and `warnings` metadata.

## Two-Developer Workflow

Sentinel is designed for two people working in parallel: one frontend-focused developer and one backend-focused developer. This is about clear ownership, not hard walls—either person can contribute across the stack when needed.

**Frontend lead owns:**

- `views/*` — Page rendering functions (TypeScript functions that return HTML strings)
- `public/*` — Styles, scripts, and static assets
- UI flows: landing, docs, dashboard, API keys, usage, status, and Mantle demo pages
- Browser-side behavior, page copy, layout, responsive design, and demo UX

**Backend lead owns:**

- `src/routes/*` — API endpoints and route handlers
- `src/db/*` — Database access layer and migrations
- `src/middleware/*` — Auth, rate limits, request IDs, usage logging
- `src/providers/*` — Mantle provider interfaces and backend tests

**Shared touchpoints:**

- `src/routes/web.ts` connects Hono routes to rendered pages (both frontend and backend touch this)
- Backend API changes should update `docs/api.md`
- Frontend pages consuming API responses should coordinate with backend changes before merging

## Frontend Stack

**Server-side rendering with Hono:**
- Pages are rendered server-side using TypeScript functions in `views/*`
- Each view function returns an HTML string
- No frontend framework (React, Vue, etc.)—just vanilla JavaScript where needed

**Styling:**
- Single CSS file: `public/styles.css`
- CSS custom properties for theming (see `:root` variables)
- Responsive design with clean, minimal aesthetic

**Page structure:**
- `views/layout.ts` — Base HTML wrapper with common head/navigation
- `views/landing.ts`, `views/dashboard.ts`, etc. — Individual page components
- `public/app.js` — Minimal client-side JavaScript for interactive features

**Development workflow:**
- Hot reload: Docker Compose watches files and restarts on changes
- View your changes at `http://localhost:3000`
- Modify HTML in `views/*`, styles in `public/styles.css`, scripts in `public/app.js`

## Prerequisites

- **Node.js** `>=20.0.0`
- **pnpm** `10.x` — `corepack enable && corepack prepare pnpm@latest --activate`
- **Docker** and **Docker Compose** for development runtime

For normal development, Docker and Docker Compose handle the runtime. Host-local Node is only needed to run checks outside of containers.

## Quick Start (5 Minutes)

1. **Clone and start:**
   ```bash
   cp .env.example .env
   docker compose up
   ```

2. **Open the app:** Navigate to `http://localhost:3000`

3. **Make frontend changes:**
   - Edit pages in `views/*` (e.g., `views/landing.ts`)
   - Edit styles in `public/styles.css`
   - Edit client scripts in `public/app.js`
   - Changes auto-reload—refresh your browser to see updates

4. **Common frontend tasks:**
   - **Change landing page:** Edit `views/landing.ts`
   - **Update styles:** Modify `public/styles.css` (uses CSS variables)
   - **Add a new page:** Create a view in `views/`, add route in `src/routes/web.ts`
   - **Test the API demo:** Visit `/mantle-demo` to see the mock Mantle intelligence UI

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

## Frontend Examples

**Adding a new page:**

1. Create a view function in `views/my-new-page.ts`:
   ```typescript
   import { layout } from "./layout.js";
   
   export function myNewPage() {
     return layout({
       title: "My New Page",
       content: `<h1>Hello from my new page</h1>`
     });
   }
   ```

2. Add a route in `src/routes/web.ts`:
   ```typescript
   import { myNewPage } from "../views/my-new-page.js";
   
   app.get("/my-new-page", (c) => c.html(myNewPage()));
   ```

3. Refresh `http://localhost:3000/my-new-page`

**Updating styles:**

Modify CSS variables in `public/styles.css`:
```css
:root {
  --accent: #216e63;  /* Change the primary accent color */
  --bg: #f6f7f9;      /* Change the background color */
}
```

**Adding interactivity:**

Add JavaScript to `public/app.js` for client-side behavior (forms, animations, etc.).

## Contributing

1. Fork the repository and create a feature branch from `main`.
2. Run `docker compose run --rm app sh -lc "corepack enable && pnpm install && pnpm typecheck && pnpm test"` to confirm the build and tests pass.
3. Open a pull request against `main` and fill out the PR template.
4. Call out any shared touchpoints (e.g., changes to `src/routes/web.ts` or API contract changes) early in your PR.

See [SECURITY.md](SECURITY.md) for the responsible disclosure policy.
