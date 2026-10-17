# Flourist API

REST API for the Flourist storefront and back office. Built with NestJS 12, Drizzle ORM and [Supabase](https://supabase.com) Postgres.

## Quick start (Docker — recommended for the team)

Requires only Docker Desktop. Everyone gets the same Node, Bun and Postgres, and each developer has their own local database.

```bash
cp .env.example .env        # database values in .env are overridden by docker-compose.yml
bun run docker:up           # or: docker compose up --build
```

- Starts Postgres 17 and the API with hot reload on http://localhost:8787/api. Migrations run on every start.
- Local DB for a GUI client: `postgresql://postgres:postgres@localhost:5432/flourist`
- Run commands inside the container: `docker compose exec api bun run test:e2e` (DB suites run here too), `docker compose exec api bun run db:generate --name <change>`
- After someone changes dependencies: `docker compose up --build -V` (`-V` refreshes the container's `node_modules`).
- Reset the local database: `docker compose down -v`
- Keep the repo **outside OneDrive / Dropbox**: syncing `node_modules` and `dist` makes file watching slow and flaky.

## Quick start (without Docker, against Supabase)

```bash
bun install
cp .env.example .env        # fill in the Supabase URLs (below)
bun run db:migrate
bun run start:dev           # http://localhost:8787/api
```

## Supabase setup

In the Supabase dashboard, open **Connect** and copy two connection strings into `.env`:

| Variable                 | Connection string                    | Why                                                              |
| ------------------------ | ------------------------------------ | ---------------------------------------------------------------- |
| `DATABASE_URL`           | **Transaction pooler** (port `6543`) | The running API: many short queries, IPv4, scales with instances |
| `DATABASE_MIGRATION_URL` | **Session pooler** (port `5432`)     | Migrations and `drizzle-kit studio`                              |

- TLS is on by default (`DATABASE_SSL=true`). To also verify the certificate, download the CA from **Database → SSL Configuration** and set `DATABASE_SSL_CA` to its path.
- Don't add `?sslmode=` to the URLs; it is stripped, since TLS is configured by the variables above.
- **Row Level Security** is enabled on every table (`.enableRLS()` in the schema). With no policies, the public Data API (anon / authenticated keys) cannot touch the tables; the API connects as `postgres`, which bypasses RLS. Add policies only if the frontend should query Supabase directly.
- Only the `public` schema is managed by Drizzle; Supabase's own schemas (`auth`, `storage`, …) are left alone.
- **Local database:** `supabase start` (Supabase CLI) runs the full stack in Docker with Postgres on `127.0.0.1:54322` (user/password `postgres`). Point both URLs there and set `DATABASE_SSL=false`.
- **e2e tests** write rows, so they only run against `TEST_DATABASE_URL` (local Supabase or a throwaway Postgres) and skip otherwise. They never use your project's `DATABASE_URL`.

- Swagger UI: http://localhost:8787/api/docs (JSON at `/api/docs/json`)
- Liveness: `GET /api/health/live` · Readiness (checks DB): `GET /api/health/ready`
- Feature routes are versioned: `GET /api/v1/categories`

## Project structure

```
flourist-api/
├── src/
│   ├── main.ts                    # Bootstrap: logger, listen
│   ├── app.module.ts              # Root module: config, logging, rate limit, observe, DB, features
│   ├── app.setup.ts               # Helmet, CORS, compression, prefix, versioning, validation, Swagger
│   ├── config/                    # Env schema (zod) + typed AppConfigService
│   ├── common/                    # Cross-cutting code, no business logic
│   │   ├── constants/
│   │   ├── decorators/            # Swagger helpers (ApiPaginatedResponse, ApiErrorResponses)
│   │   ├── dto/                   # PaginationQueryDto, Paginated<T>, ErrorResponseDto
│   │   ├── filters/               # AllExceptionsFilter: one error shape for every failure
│   │   └── utils/
│   ├── database/
│   │   ├── schema/                # Drizzle tables — one file per table, re-exported from index.ts
│   │   ├── connection.ts          # Supabase pooler URLs + TLS options
│   │   ├── database.module.ts     # Global pg Pool + Drizzle client (DATABASE token)
│   │   └── migrate.ts             # Runtime migrator used in production
│   └── modules/                   # Feature modules
│       ├── health/                # Liveness / readiness probes
│       └── categories/            # Reference CRUD module — copy this for new features
│           ├── dto/
│           ├── categories.controller.ts   # HTTP only
│           ├── categories.service.ts      # Business rules
│           ├── categories.repository.ts   # SQL only
│           └── categories.service.spec.ts # Unit test (co-located)
├── test/                          # e2e tests (supertest against the real app)
├── drizzle/                       # Generated SQL migrations — commit these
├── Dockerfile                     # Multi-stage, non-root, healthcheck
├── docker-compose.yml             # Dev: Postgres + API with hot reload
├── docker-compose.prod.yml        # Prod-like: migrate → api, against the Supabase URLs in .env
└── .github/workflows/ci.yml       # format · lint · typecheck · test · build · migrate · e2e
```

### Adding a feature

1. Add a table in `src/database/schema/<name>.ts` and export it from `schema/index.ts`.
2. `bun run db:generate --name <change>` → review the SQL in `drizzle/` → `bun run db:migrate`.
3. Copy `src/modules/categories/` to `src/modules/<name>/`, rename, and register the module in `app.module.ts`.

## Conventions

| Concern       | Behaviour                                                                                        |
| ------------- | ------------------------------------------------------------------------------------------------ |
| Config        | Every variable is validated at boot (`src/config/env.schema.ts`); the app refuses bad config.    |
| Errors        | `{ statusCode, code, message, details?, path, timestamp, requestId }`. 5xx never leak internals. |
| DB errors     | Unique / FK violations → `409 CONFLICT`; bad input → `400`.                                      |
| Validation    | `class-validator` DTOs; unknown fields are rejected (`VALIDATION_ERROR`).                        |
| Pagination    | `?page=&limit=&search=` → `{ data, meta: { page, limit, total, totalPages } }`.                  |
| Logging       | pino: JSON in production, pretty locally. Auth headers and cookies redacted.                     |
| Tracing       | `x-request-id` is accepted or generated, returned in the response and in every log line.         |
| Security      | Helmet headers, CORS allow-list, rate limit (`THROTTLE_*`), no `x-powered-by`.                   |
| Shutdown      | SIGTERM drains requests and closes the DB pool.                                                  |
| Observability | NestJS Observe is wired in; set `OBSERVE_APP_KEY` / `OBSERVE_APP_SECRET` to enable it.           |

## Scripts

| Script                                          | Purpose                                                         |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `start:dev` / `start:debug`                     | Watch mode                                                      |
| `build` / `start:prod`                          | Compile to `dist/` and run it                                   |
| `lint` · `format` · `typecheck`                 | Code quality                                                    |
| `test` · `test:cov` · `test:e2e`                | Unit, coverage, end-to-end (DB suites need `TEST_DATABASE_URL`) |
| `db:generate` · `db:migrate` · `db:studio`      | Drizzle migrations and browser                                  |
| `db:migrate:prod`                               | Apply migrations from the compiled build                        |
| `docker:up` · `docker:down` · `docker:test:e2e` | Docker dev environment                                          |

## Deployment

```bash
docker compose -f docker-compose.prod.yml up --build   # migrate → api on :8787
```

In other environments: build the image, run `node dist/database/migrate.js` once per release, then start the container. Set `NODE_ENV=production`, the Supabase `DATABASE_URL` and `DATABASE_MIGRATION_URL`, `CORS_ORIGINS`, and `TRUST_PROXY=true` behind a load balancer. Consider `SWAGGER_ENABLED=false` for public deployments.
