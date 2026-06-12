# Iron Burrow Sentinel — Web

A Next.js app for **Iron Burrow Sentinel**: public, source-aware Mantle
intelligence for agents and builders. It reproduces the full site — Mantle
explorer, asset intelligence pages, catalog, and account tooling — as a modern
React app with no separate backend service.

## Stack

- **Next.js 16** (App Router, Server Components, Route Handlers, Turbopack)
- **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** (design tokens via `@theme`, component layer in
  `src/app/globals.css`)
- **Three.js** for the WebGL particle-network hero (Canvas 2D fallback)
- **@google/generative-ai** (Gemini) for the Sentinel chat assistant
- **@neondatabase/serverless** (Postgres) for API keys / usage — serverless-safe

## Pages

| Route | Description |
| --- | --- |
| `/` | Landing — search + principles |
| `/docs` | API quick reference |
| `/app` | Dashboard workspace |
| `/api-keys` | Create an API key (Postgres-backed) |
| `/usage` | Inspect usage for a key |
| `/status` | Service + database health |
| `/search?q=` | Public catalog resolver → redirect or result list |
| `/asset/[slug]` | Canonical asset (representations, similar assets) |
| `/mantle-demo` | **Mantle explorer** — animated hero, search, featured assets, chat |
| `/mantle/asset/[slug]` | **Asset intelligence** — 24h price chart, 5 intelligence tabs, holders |

## API routes

| Route | Purpose |
| --- | --- |
| `POST /api/chat` | Gemini chat (enabled when `GEMINI_API_KEY` is set) |
| `POST /api/v1/api-keys` | Create a user + API key |
| `GET /api/v1/me/usage` | Authenticated usage summary + key list (`X-API-Key` / `Bearer`) |
| `GET /api/v1/status` | Service + DB health |
| `GET /mantle-demo/search?q=` | Resolve a query → redirect to the Mantle asset |
| `GET /currency/[value]` | Set the USD/MXN display cookie and redirect back |

## Data sources

- **Iron Burrow upstream API** (`https://api.ironburrow.com`) — asset list,
  asset detail, 24h price series, and search resolution. Fetched in Server
  Components (`src/lib/iron-burrow.ts`), cached for 60s.
- **In-memory catalog** (`src/lib/catalog.ts`) — the curated canonical-asset
  catalog + search/resolve. No database needed for this.
- **Mock Mantle provider** (`src/lib/mantle-provider.ts`) — deterministic
  holder / concentration / liquidity demo data.
- **Postgres** (`src/lib/db.ts`, `account.ts`) — users + API keys + usage logs
  for the account pages. Tables are created automatically on first use.
- **Gemini chat** (`src/lib/chat.ts`) — optional; enabled when `GEMINI_API_KEY`
  is set.

Everything except the account pages works with no database. The Mantle demo,
catalog, search, and chat are self-contained.

## Getting started

```bash
npm install
cp .env.example .env.local       # set DATABASE_URL (and optionally GEMINI_API_KEY)
npm run dev                      # http://localhost:3000
```

For the account pages, point `DATABASE_URL` at any Postgres — the easiest is a
free [Neon](https://neon.tech) / Vercel Postgres database (the same connection
string works locally and in production). Without it, the demo/catalog/chat
pages still work; the account pages report a clear "database not configured"
error.

Scripts:

```bash
npm run dev         # dev server (Turbopack)
npm run build       # production build
npm run start       # serve the production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
```

## Deploying to Vercel

1. Push the repo and import it in Vercel.
2. Add a Postgres database (Vercel Postgres / Neon) and set **`DATABASE_URL`**
   to its pooled connection string.
3. Set **`API_KEY_HASH_SECRET`** (a long random value) and, for chat,
   **`GEMINI_API_KEY`**.
4. Deploy. Account tables auto-create on first request; no migration step.

The Neon serverless driver is used specifically so the route handlers don't
exhaust Postgres connections under serverless concurrency.

## Environment variables

See [`.env.example`](./.env.example):

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | for account pages | Postgres (Vercel Postgres / Neon), pooled string |
| `API_KEY_HASH_SECRET` | for account pages | HMAC secret for hashing API keys |
| `GEMINI_API_KEY` | optional | Enables the chat assistant |
| `GEMINI_CHAT_MODEL` | optional | Chat model id (default `gemini-2.0-flash`) |
| `IRON_BURROW_BASE_URL` | optional | Upstream public API base |

## Project structure

```
src/
  app/                      # App Router routes
    page.tsx                # /
    docs|app|api-keys|...    # standard pages
    search/page.tsx          # /search resolver
    asset/[slug]/page.tsx    # canonical asset
    mantle-demo/             # explorer + /mantle-demo/search route
    mantle/asset/[slug]/     # asset intelligence
    currency/[value]/        # cookie-setting redirect
    api/chat/                # Gemini chat route handler
    api/v1/                  # account API: api-keys, me/usage, status
    globals.css             # Tailwind v4 tokens + component styles
  components/
    top-bar.tsx             # nav + currency switch
    ui/                     # TokenIcon, Pill, EmptyState
    account/                # api-key / usage / status client forms
    mantle/                 # ParticleBackground, ChatWidget, PriceChart, AssetTabs
  lib/
    types.ts                # shared domain types
    iron-burrow.ts          # upstream client (server-only)
    catalog.ts              # in-memory catalog + search/resolve
    mantle-provider.ts      # deterministic demo data
    mantle-asset.ts         # payload builder + demo address derivation
    chat.ts                 # Gemini client (server-only)
    db.ts, account.ts, keys.ts   # Postgres + API-key persistence (server-only)
    currency.ts, format.ts, token-media.ts
```
