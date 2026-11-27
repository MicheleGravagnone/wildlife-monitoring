# Wildlife Monitor

A monorepo for wildlife monitoring. It contains a NestJS REST API and a React web frontend, Trop, for wildlife observations from ESP32 camera and PIR sensors in parks around Łódź, Poland. Developed for the Research Based Workshop, AY 2026/27.

The domain separates physical **sensors**, fixed **deployments**, and classified **detections**, preserving observation locations when a sensor moves. The backend coordinates asynchronous photo capture ingestion with an external AI vision inference service via **RabbitMQ** before persisting immutable observations to PostgreSQL.

## Current scope

- PostgreSQL persistence with Prisma and a versioned initial migration.
- List, lookup, and creation endpoints for sensors, deployments, and detections.
- Request validation and Swagger UI.
- Vitest unit tests and database-backed HTTP end-to-end tests.
- A React web frontend built against the full API contract in [docs/openapi.yaml](docs/openapi.yaml), running on a mock API until the backend implements it.

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

This also starts the AI worker (`services/ai`), currently a placeholder that logs a heartbeat. It publishes no ports; follow it with `docker compose logs -f ai`.

The `.env.example` values match the Compose database. The API is available at <http://localhost:3000>; Swagger UI is at <http://localhost:3000/api/docs>. Resource routes are versioned under `/api/v1`: `/api/v1/sensors`, `/api/v1/deployments`, and `/api/v1/detections`. To stop PostgreSQL, run `docker compose down`; its data remains in the Compose volume.

If port 5432 is already in use, change the published port in `compose.yaml` and the port in `DATABASE_URL` in `.env` to match. For local schema development, run `npm run db:migrate -- --name <migration-name>` to create and apply a migration. `npm run db:generate` regenerates the Prisma Client when needed; generated code lives in `apps/api/src/generated/prisma/` and is ignored by Git.

## Web frontend

The frontend (`apps/web`) is React, Vite and TypeScript. It follows the Trop design: a public overview and field journal, and staff pages for sensors, the capture pipeline and the LIVE 3D map.

To run it locally, from the repository root:

```sh
npm ci
npm run dev:web
```

Open <http://localhost:5173>. The API and database don't need to be running: the frontend uses its built-in mock API (see below). Code changes reload in the browser as you save. When the real API is used, the dev server proxies `/api` to it on port 3000 (override with `API_PROXY_TARGET`).

To run the production build in Docker instead:

```sh
docker build -f apps/web/Dockerfile -t wildlife-web .
docker run --rm -p 8080:8080 \
  --add-host=host.docker.internal:host-gateway \
  -e API_UPSTREAM=http://host.docker.internal:3000 \
  wildlife-web
```

Open <http://localhost:8080>. nginx serves the app and forwards `/api` to `API_UPSTREAM`. The `--add-host` flag is needed on Linux, where `host.docker.internal` isn't defined by default.

Most endpoints the frontend uses exist only in [docs/openapi.yaml](docs/openapi.yaml) so far, so by default the app answers them itself with a mock API (`apps/web/src/mocks`). The mock serves deterministic sample data, and new sightings keep arriving while the app is open. Any email and password sign in to the mock. Set `VITE_API_MOCKS=false` to use the real API instead.

- `?mocks=inpage` mocks requests in the page instead of through a service worker. The app falls back to this automatically if the worker can't start.
- `?mockUser=staff` starts the mock signed in.

Both are useful for headless screenshots.

The LIVE map uses MapLibre GL with vector tiles from [OpenFreeMap](https://openfreemap.org), which the viewer's browser loads directly. Species and park photographs come from Wikimedia Commons; their credits are in `apps/web/public/assets/CREDITS.md` and in the site footer.

## Repository layout

The repository uses npm workspaces. Root scripts (`npm run build`, `npm test`, `npm run lint`, `npm run typecheck`) run the matching script in every workspace; one `.env` at the root serves Compose and the API.

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
  web/                    React frontend (workspace @wildlife-monitor/web)
    src/
      api/                Types mirroring docs/openapi.yaml, fetch client, query hooks
      mocks/              Mock API for endpoints the backend doesn't serve yet
      shell/              App frame, navigation island, page transitions
      pages/              Overview, Journal, Sensors, System, LIVE
      components/         Bubbles, drawers, dropdowns and other shared UI
      lib/                Species and park reference data, time and sun helpers
    public/assets/        Colour-graded photographs and their credits
docs/                     Domain rules, API contracts, diagrams, and wireframes
compose.yaml              Local services (PostgreSQL, containerized API)
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
- Asynchronous capture ingestion and AI inference integration via RabbitMQ (AMQP).
- Object storage (S3/MinIO) integration for raw photo storage and presigned image URLs.
- Public and authenticated response views and private image access.
- Idempotent ingestion and cross-field domain validation.
- Pagination.
