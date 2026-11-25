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
- `POST /api/captures`: accepts raw captured image uploads (multipart/form-data) with capture metadata (`eventId`, `deploymentId`, `capturedAt`); persists to object storage, enqueues an inference task to RabbitMQ, and returns `202 Accepted`; ingestion service credentials required.
- `POST /api/detections`: creates an immutable classified capture event directly; ingestion service credentials required. In the asynchronous capture workflow, this persistence step is handled internally by consuming the `detections.classified` queue.

There are no `PUT`, `PATCH`, or `DELETE` endpoints for sensors, deployments, or detections.

## Asynchronous messaging contract (RabbitMQ / AMQP)

The backend interacts with the external AI inference worker using RabbitMQ.

### Queue: `captures.raw`

Published by the backend upon receiving a new capture from an ESP32 camera trap.

- **Routing Key**: `capture.raw`
- **Delivery Mode**: Persistent (2)
- **Message Payload**:
  ```json
  {
    "eventId": "UUID",
    "deploymentId": "UUID",
    "capturedAt": "ISO-8601 UTC timestamp",
    "imageKey": "string"
  }
  ```
- **Consumer**: Python AI inference worker. Consumers must set a constrained `prefetch_count` to ensure backpressure and protect GPU VRAM.

### Queue: `detections.classified`

Published by the AI inference worker upon model evaluation.

- **Routing Key**: `detection.classified`
- **Delivery Mode**: Persistent (2)
- **Message Payload**:
  ```json
  {
    "eventId": "UUID",
    "deploymentId": "UUID",
    "capturedAt": "ISO-8601 UTC timestamp",
    "classificationStatus": "IDENTIFIED | UNKNOWN | NO_ANIMAL",
    "speciesLabel": "string | null",
    "confidence": "number | null",
    "imageKey": "string",
    "modelVersion": "string",
    "classifiedAt": "ISO-8601 UTC timestamp"
  }
  ```
- **Consumer**: Backend API, which validates the payload and writes the immutable `Detection` record to PostgreSQL via Prisma.

### Dead-Letter Exchange (DLX): `captures.dlx`

Malformed payloads, missing object-storage blobs, or repeated inference failures are routed to `captures.dlq` after exceeding retry thresholds (e.g., 3 attempts with exponential backoff) without blocking the primary ingestion queue.
