# API contract and implementation status

## Implemented

The API currently exposes unauthenticated `GET /<resource>`, `GET /<resource>/:id`, and `POST /<resource>` for `sensors`, `deployments`, and `detections`. Records persist in PostgreSQL through Prisma. Unknown lookup IDs return `404`; malformed UUIDs and invalid DTOs return `400`. Unknown input properties are rejected. Unique constraint violations on creation return `409`.

Responses currently serialize full Prisma records, including `imageKey` for detections. Dates serialize as ISO 8601 strings. Classification input and output use Prisma enum names: `IDENTIFIED`, `UNKNOWN`, and `NO_ANIMAL`; the lowercase values in the domain model are database mappings.

Swagger UI is served at `/api`; resource routes do not have an `/api` prefix. There is no root greeting route.

## API endpoints

The API will expose the following endpoints:

- `GET /api/sensors`: lists physical Sensors; user authentication required.
- `GET /api/sensors/:id`: returns a physical Sensor; user authentication required.
- `GET /api/detections`: lists detections using the public or authenticated response view, depending on the caller's session.
- `GET /api/detections/:id`: returns a detection using the appropriate response view. Records excluded from the public view return `404` to unauthenticated callers.
- `GET /api/detections/:id/image`: returns a short-lived image URL; user authentication required. Returns `404` if no image is available.
- `GET /api/deployments`: lists Deployments; user authentication required.
- `GET /api/deployments/:id`: returns a Deployment; user authentication required.
- `POST /api/deployments`: registers a new immutable installation for an existing Sensor; provisioning service credentials required.
- `POST /api/sensors`: registers a new immutable physical Sensor; provisioning service credentials required.
- `POST /api/detections`: creates an immutable classified capture event; ingestion service credentials required.

There are no `PUT`, `PATCH`, or `DELETE` endpoints for sensors, deployments, or detections.
