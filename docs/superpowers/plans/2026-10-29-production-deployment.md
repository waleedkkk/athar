# ATHAR Production Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the live store at `https://atharr.duckdns.org` from a production build (Next.js `next start` + Medusa `medusa start`) instead of the development servers, with the same host ports so nginx needs no port changes.

**Architecture:** Two new multi-stage Dockerfiles build self-contained images (`athar-backend:latest`, `athar-storefront:latest`). A new `docker-compose.prod.yml` overlays the existing `docker-compose.yml` (postgres + redis, same volumes/network) with production `backend` and `storefront` services publishing host ports 9000 and 8000. The storefront talks to the backend over the internal Docker network (`MEDUSA_BACKEND_URL=http://backend:9000`); all storefront→backend traffic is server-side (server actions), so no public `/store` route is required for the checkout.

**Tech Stack:** Medusa v2.22.1, Next.js 16.3.8, pnpm 10.11.1, Docker Compose, PostgreSQL 16, Redis 7, host nginx + Let's Encrypt.

**Spec:** User instruction "yes, do that" to the proposed next step — build a production stack (`docker-compose.prod.yml` + Dockerfiles) and re-verify the live purchase flow in production mode. Referenced by `RUNBOOK.md`.

## Global Constraints

- Node 22.23.4+ (images use `node:24-bookworm-slim`), pnpm 10.11.1 via corepack, frozen lockfile.
- Host ports stay `9000` (backend/admin) and `8000` (storefront) so `/etc/nginx/sites-available/atharr.duckdns.org` keeps working unchanged.
- Production URLs: storefront `https://atharr.duckdns.org`, admin `https://atharr.duckdns.org/app`.
- Region `reg_01M63A579QNMTPQW81749YMXTV`, currency `egp`, publishable key `pk_9a857a6df7f4065b02199b8c55f7300916da5a3ec0973b524d81e4dd24bdbd70`.
- Secrets (JWT/COOKIE/DB) live only in gitignored env files; never commit them.
- No destructive database commands; the existing `athar` database and its volumes are reused as-is.
- The development stack must stay recoverable: stopping it must not remove data.

## Review Focus

- The backend must still reach PostgreSQL with `?sslmode=disable` over the internal network (migrations and runtime queries hang otherwise).
- `NEXT_PUBLIC_*` storefront variables are inlined at build time — changing them requires an image rebuild, not a container restart.
- The admin dashboard must answer on `/app` with `Host localhost:9000` (plain `$host` gives 403 from Medusa).
- A production storefront has no HMR websocket; `allowedDevOrigins` must not be required for hydration (hydration must work without it).
- The storefront build can exhaust the 4-core/8GB VPS: the build stage needs a bounded heap and must not run concurrently with the dev server's compilation.

---

### Task 1: Production Dockerfiles

**Files:**
- Create: `apps/backend/Dockerfile`
- Create: `apps/storefront/Dockerfile`

**Interfaces:**
- Consumes: monorepo root `pnpm-lock.yaml`, `pnpm-workspace.yaml`, app `package.json` scripts (`build`/`start`).
- Produces: images `athar-backend:latest` (entrypoint `node .medusa/server`, listens 9000) and `athar-storefront:latest` (entrypoint `next start -p 8000`, listens 8000).

- [ ] **Step 1: Write `apps/backend/Dockerfile`**

Multi-stage: `deps` (corepack pnpm 10.11.1, `pnpm install --frozen-lockfile`), `builder` (`pnpm --filter @dtc/backend build` → `.medusa/server`), `runner` (`node:24-bookworm-slim`, non-root user, copies `.medusa/server` + production `node_modules` + `medusa-config.ts` + `src`, `EXPOSE 9000`, `CMD ["node", ".medusa/server"]`).

- [ ] **Step 2: Write `apps/storefront/Dockerfile`**

Multi-stage: `deps`, `builder` (`pnpm --filter @dtc/storefront build` with `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://atharr.duckdns.org`, `NEXT_PUBLIC_BASE_URL=https://atharr.duckdns.org`, `NEXT_PUBLIC_DEFAULT_REGION=eg` as build args), `runner` (copies `.next`, `public`, `package.json`, `node_modules`; `CMD ["pnpm", "run", "start"]`, `EXPOSE 8000`).

- [ ] **Step 3: Build both images**

Run: `docker compose -f docker-compose.yml -f docker-compose.prod.yml build`
Expected: both images built; storefront build completes without missing-env errors.

### Task 2: Production compose overlay and env files

**Files:**
- Create: `docker-compose.prod.yml`
- Create: `apps/backend/.env.production` (gitignored, not committed)

**Interfaces:**
- Consumes: `apps/backend/.env` (dev values for JWT/COOKIE secrets, copied without printing), `docker-compose.yml` (postgres/redis services and volumes).
- Produces: compose project services `backend` and `storefront` with `restart: unless-stopped`, healthchecks, and published ports `9000:9000`, `8000:8000`.

- [ ] **Step 1: Write `apps/backend/.env.production`**

Contents: `NODE_ENV=production`, `DATABASE_URL=postgres://medusa:medusa@postgres:5432/athar?sslmode=disable`, `REDIS_URL=redis://redis:6379`, `STORE_CORS/ADMIN_CORS/AUTH_CORS=https://atharr.duckdns.org,http://localhost:8000,http://127.0.0.1:8000,http://localhost:9000,http://127.0.0.1:9000`, `JWT_SECRET`/`COOKIE_SECRET` copied from `apps/backend/.env`, `DB_NAME=medusa`.

- [ ] **Step 2: Write `docker-compose.prod.yml`**

`services.backend`: `build: {context: ., dockerfile: apps/backend/Dockerfile}`, `env_file: ./apps/backend/.env.production`, `environment: {NODE_ENV: production}`, `ports: ["9000:9000"]`, `depends_on: postgres/redis (service_healthy)`, `restart: unless-stopped`.
`services.storefront`: `build: {context: ., dockerfile: apps/storefront/Dockerfile}`, `environment: {NODE_ENV: production, MEDUSA_BACKEND_URL: http://backend:9000, NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY: ..., NEXT_PUBLIC_DEFAULT_REGION: eg, NEXT_PUBLIC_BASE_URL: https://atharr.duckdns.org}`, `ports: ["8000:8000"]`, `depends_on: [backend]`, `restart: unless-stopped`.

- [ ] **Step 3: Verify compose config resolves**

Run: `docker compose -f docker-compose.yml -f docker-compose.prod.yml config >/dev/null`
Expected: exit 0, no interpolation errors.

### Task 3: Cut over to production and verify the live site

**Files:**
- Modify: `RUNBOOK.md` (production commands, cutover, rollback)

**Interfaces:**
- Consumes: images and compose overlay from Tasks 1–2; nginx vhost already pointing at host ports 8000/9000.
- Produces: live site served by production containers; verified purchase flow.

- [ ] **Step 1: Stop the development services (keep data)**

Run: `docker compose -f docker-compose.yml -f docker-compose.dev.yml stop backend storefront`
Expected: dev containers stopped; postgres/redis keep running with their volumes.

- [ ] **Step 2: Start the production services**

Run: `docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d`
Expected: `athar-backend-1` and `athar-storefront-1` (production images) running and healthy.

- [ ] **Step 3: Verify the public endpoints**

Run: `curl -s -o /dev/null -w "%{http_code}" https://atharr.duckdns.org` and `.../app`, plus `curl https://atharr.duckdns.org/eg/products/athar-signature-tshirt | grep -o "أثر"`.
Expected: `200`, `200`, and the Arabic brand text present in the product HTML.

- [ ] **Step 4: Verify a production purchase end-to-end with Playwright**

Add one ATHAR t-shirt to the cart, complete address + shipping + COD, and confirm the order page.
Expected: `/eg/order/order_.../confirmed` with «تم تأكيد الطلب» and a new row in `order` (total 540 EGP, session provider `pp_cash-on-delivery_cod`).

- [ ] **Step 5: Document and commit**

Add the production/rollback commands to `RUNBOOK.md`, then `git add` + `git commit` + `git push origin main`.
Expected: push succeeds; `git log --oneline -1` shows the new commit.

### Task 4: Rollback path (only if the production stack fails)

**Files:**
- Modify: `RUNBOOK.md` (rollback section only)

**Interfaces:**
- Consumes: development compose overlay.
- Produces: dev stack serving the live domain again.

- [ ] **Step 1: Stop production and restart development**

Run: `docker compose -f docker-compose.yml -f docker-compose.prod.yml down && docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d`
Expected: dev containers running; `https://atharr.duckdns.org` answers 200 again (dev HMR origin allowance is already committed in `next.config.js`).
