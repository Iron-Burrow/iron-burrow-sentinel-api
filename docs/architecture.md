# Architecture

Sentinel is one Hono service that serves both JSON APIs and server-rendered HTML.

```text
browser / agent
  -> Sentinel Hono app
    -> Postgres for users, API keys, usage logs, and rate buckets
    -> MantleProvider interface
      -> mock provider in this public repo
      -> private providers later
```

The public repo keeps the integration boundary honest. It ships a stable provider interface and demo data, not private indexing code.

## Runtime Pieces

- `src/app.ts` wires routes and middleware.
- `src/db/*` owns the minimal public schema access.
- `src/middleware/*` owns request IDs, API-key auth, usage logging, and rate limits.
- `src/providers/*` owns Mantle intelligence providers.
- `views/*` renders the public UI without a frontend framework.

## Developer Ownership

Sentinel stays as one service, but it is organized for two clear work streams. The frontend lead owns `views/*`, `public/*`, and the user-facing page flows. The backend lead owns API route behavior, database access, middleware, migrations, provider boundaries, and tests.

`src/routes/web.ts` is the main shared boundary: it connects backend routing to server-rendered pages. Changes there should be coordinated, and any public API behavior change should be reflected in `docs/api.md`.
