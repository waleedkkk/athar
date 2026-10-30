FROM node:24-bookworm-slim AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable && corepack prepare pnpm@10.11.1 --activate

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/storefront/package.json ./apps/storefront/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS builder

WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=3072
ENV DATABASE_URL=postgres://medusa:medusa@localhost:5432/athar?sslmode=disable
ENV REDIS_URL=redis://localhost:6379
ENV STORE_CORS=http://localhost:8000
ENV ADMIN_CORS=http://localhost:9000
ENV AUTH_CORS=http://localhost:8000,http://localhost:9000

COPY apps/backend ./apps/backend

RUN pnpm --filter @dtc/backend build

FROM base AS deploy

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules

RUN pnpm --filter @dtc/backend deploy --legacy --prod /app/deploy/backend

FROM base AS runner

ENV NODE_ENV=production

COPY --from=deploy --chown=node:node /app/deploy/backend /app/deploy/backend
COPY --from=builder --chown=node:node /app/apps/backend/.medusa/server /app/deploy/backend/.medusa/server

USER node

WORKDIR /app/deploy/backend/.medusa/server

EXPOSE 9000

CMD ["/app/deploy/backend/node_modules/.bin/medusa", "start"]
