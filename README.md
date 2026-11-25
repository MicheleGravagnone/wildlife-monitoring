# Wildlife Monitor

A monorepo for wildlife monitoring. It currently contains a NestJS REST API for wildlife observations from ESP32 camera and PIR sensors in parks around Łódź, Poland. Developed for the Research Based Workshop, AY 2026/27.

The domain separates physical **sensors**, fixed **deployments**, and classified **detections**, preserving observation locations when a sensor moves. The backend coordinates asynchronous photo capture ingestion with an external AI vision inference service via **RabbitMQ** before persisting immutable observations to PostgreSQL.

## Current scope

- PostgreSQL persistence with Prisma and a versioned initial migration.
- List, lookup, and creation endpoints for sensors, deployments, and detections.
- Request validation and Swagger UI.
- Vitest unit tests and database-backed HTTP end-to-end tests.

Authentication, public response filtering, and asynchronous RabbitMQ pipeline integration are planned. Current routes expose full database records. See [API contract and status](docs/api-contract.md) and [domain model](docs/domain-model.md) for more details.

## Architecture

The target system, sketched by hand. ESP32 traps and browsers reach the backend through NGINX over HTTPS. The backend stores images in object storage and publishes captures to RabbitMQ. The AI service consumes them, reads each image by key, and publishes classifications back. Failed messages go to a dead-letter queue that the backend consumes.

![Logical architecture: ESP32 and browser connect over HTTPS to NGINX, which forwards to the backend; the backend stores data in PostgreSQL and images in object storage, pushes captures to a RabbitMQ queue consumed by the AI service, which reads images by key and pushes classifications to a second queue consumed by the backend; both queues dead-letter to a DLQ consumed by the backend](docs/diagrams/architecture-logical.png)

Planned AWS deployment: the same services run with Docker Compose on one EC2 instance in a public subnet. S3 replaces object storage, an IAM instance role grants bucket access, and secrets live in SSM Parameter Store.

![AWS deployment: DNS record and Elastic IP lead through a security group to an EC2 instance running Docker Compose with NGINX, the NestJS backend, the Python AI service, RabbitMQ, and PostgreSQL on EBS; the backend and AI service access a private S3 bucket through an IAM instance role, and secrets are read from SSM Parameter Store](docs/diagrams/architecture-aws.png)

UI wireframes for the public overview and the logged-in live map are in [docs/wireframes](docs/wireframes/ui-wireframes.png).

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

Alternatively, to run the entire backend containerized:

```sh
docker compose --profile app up --build
```

The `.env.example` values match the Compose database. The API is available at <http://localhost:3000>; Swagger UI is at <http://localhost:3000/api/docs>. Resource routes are versioned under `/api/v1`: `/api/v1/sensors`, `/api/v1/deployments`, and `/api/v1/detections`. To stop PostgreSQL, run `docker compose down`; its data remains in the Compose volume.

If port 5432 is already in use, change the published port in `compose.yaml` and the port in `DATABASE_URL` in `.env` to match. For local schema development, run `npm run db:migrate -- --name <migration-name>` to create and apply a migration. `npm run db:generate` regenerates the Prisma Client when needed; generated code lives in `apps/api/src/generated/prisma/` and is ignored by Git.

## Repository layout

The repository uses npm workspaces. Root scripts (`npm run build`, `npm test`, and so on) run the matching script in `apps/api`; one `.env` at the root serves Compose and the API.

```text
apps/
  api/                    NestJS API (workspace @wildlife-monitor/api)
    src/
      main.ts             Application bootstrap, validation, Swagger
      app.module.ts       Feature composition
      sensors/            Physical device registration and lookup
      deployments/        Fixed installations and locations
      detections/         Classified capture events
      prisma/             Shared database provider and lifecycle
    prisma/               Schema and versioned migrations
    test/                 HTTP tests and shared test support
    examples/             HTTP requests for manual exploration
    Dockerfile            Built from the repository root
docs/                     Domain rules, API contracts, diagrams, and wireframes
compose.yaml              Local services (PostgreSQL, containerized API)
```

The Python AI worker (`services/ai/`) and the web frontend (`apps/web/`) will be added in their own directories.

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
- Asynchronous capture ingestion and AI inference integration via RabbitMQ (AMQP).
- Object storage (S3/MinIO) integration for raw photo storage and presigned image URLs.
- Public and authenticated response views and private image access.
- Idempotent ingestion and cross-field domain validation.
- Pagination.
