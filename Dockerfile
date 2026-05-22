# Multi-stage Dockerfile
# Stage 1 — install dependencies
# Stage 2 — build TypeScript
# Stage 3 — production image (no dev deps, no source)

FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ── build ─────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm typecheck && pnpm exec tsc -p tsconfig.build.json

# ── production image ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

# Only production deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --prod

# Compiled output and runtime assets
COPY --from=build /app/dist ./dist
COPY migrations ./dist/migrations
COPY public ./dist/public
COPY media ./dist/media

EXPOSE 3000

CMD ["node", "dist/src/index.js"]
