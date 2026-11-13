# Wildlife Monitor — Backend

A NestJS REST API for wildlife observations from ESP32 camera and PIR sensors in parks around Łódź, Poland. Developed for the Research Based Workshop, AY 2026/27.

The domain separates physical **sensors**, fixed **deployments**, and classified **detections**, preserving observation locations when a sensor moves. This repository contains the backend; device capture, cloud inference, and the frontend belong to the wider project.

## Current scope

- PostgreSQL persistence with Prisma and a versioned initial migration.
- List, lookup, and creation endpoints for sensors, deployments, and detections.
- Request validation and Swagger UI.
- Vitest unit tests and database-backed HTTP end-to-end tests.

Authentication and public response filtering are still planned. Current routes expose full database records. See [API contract and status](docs/api-contract.md) and [domain model](docs/domain-model.md) for the distinction between implemented and intended behavior.

## Run locally

Prerequisites: Node.js 24, npm, and Docker Compose. The API runs on your machine and connects to PostgreSQL in Docker through `localhost:5432`.

```sh
npm ci
cp .env.example .env
docker compose up -d --wait db
npm run db:generate
npm run db:migrate:deploy
npm run start:dev
```

The `.env.example` values match the Compose database. The API is available at <http://localhost:3000>; Swagger UI is at <http://localhost:3000/api>. Resource routes start at `/sensors`, `/deployments`, and `/detections`. To stop PostgreSQL, run `docker compose down`; its data remains in the Compose volume.

If port 5432 is already in use, change the published port in `compose.yaml` and the port in `DATABASE_URL` in `.env` to match. For local schema development, run `npm run db:migrate -- --name <migration-name>` to create and apply a migration. `npm run db:generate` regenerates the Prisma Client when needed; generated code lives in `src/generated/prisma/` and is ignored by Git.

## Repository layout

```text
src/
  main.ts                 Application bootstrap, validation, Swagger
  app.module.ts           Feature composition
  sensors/                Physical device registration and lookup
  deployments/            Fixed installations and locations
  detections/             Classified capture events
  prisma/                 Shared database provider and lifecycle
prisma/                   Schema and versioned migrations
test/                     HTTP tests and shared test support
docs/                     Domain rules and API implementation status
examples/                 HTTP requests for manual exploration
```

Unit tests (`*.spec.ts`) live next to their implementation. `test/e2e/` contains HTTP tests grouped by feature; `test/support/` contains their shared setup. Feature modules depend on the Prisma module directly, without dependencies on unrelated feature modules. Prisma is the source of persistence model types; input DTOs define request validation. Explicit public response DTOs will be introduced with access controls.

## Tests and checks

```sh
npm run build
npm run lint
npm run typecheck
npm run format:check
npm test
```

`npm test` runs unit tests, which mock database access and need no running database. End-to-end HTTP tests use real PostgreSQL and require a **separate test database**. With the Compose database running, create it once, set its connection URL, apply migrations, then run the tests:

```sh
docker compose exec db sh -c 'createdb -U "$POSTGRES_USER" wildlife_test'

export TEST_DATABASE_URL='postgresql://wildlife:wildlife_local@localhost:5432/wildlife_test'
DATABASE_URL="$TEST_DATABASE_URL" npm run db:migrate:deploy
npm run test:e2e
```

Adjust the username, password, and port in `TEST_DATABASE_URL` if you changed the Compose settings. `TEST_DATABASE_URL` is necessary for end-to-end tests and must identify a database separate from development; tests create and clean up their own records and do not truncate tables. GitHub Actions runs these database-backed tests alongside the quality checks on pull requests.

## Next milestones

- Service credentials and user authentication.
- Public and authenticated response views and private image access.
- Idempotent ingestion and cross-field domain validation.
- Pagination
