# Wildlife Monitor — Backend

A NestJS REST API for wildlife observations from ESP32 camera and PIR sensors in parks around Łódź, Poland. Developed for the Research Based Workshop, AY 2026/27.

The domain separates physical **sensors**, fixed **deployments**, and classified **detections**, preserving observation locations when a sensor moves. This repository contains the backend; device capture, cloud inference, and the frontend belong to the wider project.

## Current scope

- PostgreSQL persistence with Prisma and a versioned initial migration.
- List, lookup, and creation endpoints for sensors, deployments, and detections.
- Request validation and Swagger UI.
- Vitest unit tests and database-backed HTTP end-to-end tests.

Authentication and public response filtering are still planned. Current routes expose full database records. See [API contract and status](docs/api-contract.md) and [domain model](docs/domain-model.md) for the distinction between implemented and intended behavior.

## Local development

Prerequisites: Node.js 24, npm and Docker Compose (or an existing PostgreSQL instance).

```sh
npm ci
cp .env.example .env
docker compose up -d db
npm run db:generate
npm run db:migrate:deploy
npm run start:dev
```

The example environment matches the local Compose database. If port 5432 is already in use, adjust Compose and `DATABASE_URL` together. Open Swagger UI at <http://localhost:3000/api>. Resource routes start at `/sensors`, `/deployments`, and `/detections`.

Use `npm run db:migrate -- --name <change>` when developing schema changes, then regenerate the client. Generated Prisma code lives in `src/generated/prisma/` and is ignored by Git.

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

## Quality checks

```sh
npm run build
npm run lint
npm run typecheck
npm run format:check
npm test
```

GitHub Actions runs code quality checks and unit tests independently from database-backed HTTP tests. Both jobs have a ten-minute timeout. CI runs on pushes to `main` and `prisma`, on pull requests, and manually; newer runs cancel superseded runs for the same branch or PR.

Unit tests mock database access and require no running database. End-to-end tests require a **separate, migrated test database**:

```sh
# Set this to a dedicated PostgreSQL database before running these commands.
export TEST_DATABASE_URL='postgresql://wildlife:wildlife_local@localhost:5432/wildlife_test'
DATABASE_URL="$TEST_DATABASE_URL" npm run db:migrate:deploy
npm run test:e2e
```

Create `wildlife_test` in your local PostgreSQL instance first. Tests create their own records and remove those records in foreign key order; they do not require seeded data or truncate tables. `TEST_DATABASE_URL` is mandatory and never falls back to the development database.

## Next milestones

- Service credentials and user authentication.
- Public and authenticated response views and private image access.
- Idempotent ingestion and cross-field domain validation.
- Pagination
