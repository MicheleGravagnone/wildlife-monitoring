# Domain model and intended behavior

This document describes the target domain rules. See [API status](api-contract.md) for implemented behavior.

## Access and immutability

- Visitors can view a public map of detections without logging in.
- Logged-in users can view additional detection and sensor information. Login grants read access only as there are no editor or administrator permissions to change data.
- Sensors, deployments and detections are immutable after creation. No API client, including the ingestion service, can update or delete existing records.
- Creation endpoints are reserved for trusted ingestion/provisioning services using separate service credentials. A user login never grants access to these endpoints.

## Data conventions

- IDs are UUIDs. Timestamps use ISO 8601 in UTC.
- Coordinates use WGS84 decimal degrees: latitude from -90 to 90 and longitude from -180 to 180.
- `null` means a value is unavailable. Optional input fields are stored as `null` when omitted.
- Creation requests reject unknown fields. Server-generated fields cannot be supplied by clients.

## Data models

### Sensor

A Sensor represents one physical camera and PIR-equipped ESP32. Its unique `deviceId` identifies the device independently of where it is installed.

| Field       | Type      | Required    | Meaning                                                                |
| ----------- | --------- | ----------- | ---------------------------------------------------------------------- |
| `id`        | UUID      | Generated   | Physical sensor identifier.                                            |
| `deviceId`  | string    | Yes, unique | Stable identifier of the physical ESP32; not an authentication secret. |
| `name`      | string    | Yes         | Human-readable device name.                                            |
| `createdAt` | timestamp | Generated   | When the backend registered the device.                                |

All Sensor fields require user authentication to read. Mutable values such as battery level, connectivity or last-seen time are not Sensor fields.

### Deployment

A Deployment records one fixed installation of a Sensor. A Sensor can have multiple Deployments. Moving it creates a new Deployment, while existing detections retain their original Deployment and location. Each Detection belongs to exactly one Deployment, which belongs to exactly one Sensor.

| Field         | Type      | Required  | Meaning                                     |
| ------------- | --------- | --------- | ------------------------------------------- |
| `id`          | UUID      | Generated | Deployment identifier.                      |
| `sensorId`    | UUID      | Yes       | Reference to the physical Sensor.           |
| `name`        | string    | Yes       | Human-readable deployment name.             |
| `parkName`    | string    | Yes       | Park containing this deployment.            |
| `latitude`    | number    | Yes       | Deployment latitude.                        |
| `longitude`   | number    | Yes       | Deployment longitude.                       |
| `installedAt` | timestamp | Yes       | When this deployment was installed.         |
| `createdAt`   | timestamp | Generated | When the backend registered the deployment. |

All Deployment fields require user authentication to read. Public map coordinates are returned through Detection responses. Deployment creation requires an existing Sensor; Sensor deletion is restricted while deployments reference it and Deployment deletion is restricted while detections reference it.

### Detection

A Detection represents one classified capture event from one Deployment. The initial model assumes one primary classification per capture, rather than one record per animal or bounding box.

| Field                  | Type           | Required    | Meaning                                                                                                                                                    |
| ---------------------- | -------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | UUID           | Generated   | Detection identifier.                                                                                                                                      |
| `eventId`              | UUID           | Yes         | Capture event identifier generated before upload and reused across retries; globally unique.                                                               |
| `deploymentId`         | UUID           | Yes         | Reference to an existing Deployment.                                                                                                                       |
| `capturedAt`           | timestamp      | Yes         | When the ESP32 captured the image, rather than when it uploaded it.                                                                                        |
| `classificationStatus` | enum           | Yes         | `identified`, `unknown`, or `no_animal`. Failed inference requests are not stored as classified detections.                                                |
| `speciesLabel`         | string or null | Conditional | Classifier's species label; required for `identified`, otherwise `null`.                                                                                   |
| `confidence`           | number or null | Conditional | Model score from 0 to 1 for the species label; required for `identified`, otherwise `null`. Not a calibrated probability unless the model guarantees that. |
| `imageKey`             | string or null | No          | Private object-storage key for the captured image; not image bytes or a permanent public URL.                                                              |
| `modelVersion`         | string         | Yes         | Exact inference model version used to classify the capture.                                                                                                |
| `classifiedAt`         | timestamp      | Yes         | When inference completed.                                                                                                                                  |
| `createdAt`            | timestamp      | Generated   | When the backend stored the detection.                                                                                                                     |

Rules:

- `deploymentId` must reference a registered deployment, and `capturedAt` must not precede its `installedAt`.
- `classifiedAt` must not precede `capturedAt`. Delayed uploads are accepted; capture time and receipt time remain distinct.
- Retrying the same `eventId` with the same input returns the existing record. Reusing it with different input returns `409 Conflict` and never modifies the record.
- Classification results cannot be corrected in place or replaced by uploading the same event again.
- Images, when available, are retrieved through an authenticated endpoint that resolves `imageKey` to a short-lived URL. Storage keys and service credentials are never exposed in public responses.

### Response views

Public detection responses contain only `id`, `capturedAt`, `speciesLabel`, and deployment `latitude`/`longitude` resolved from the referenced Deployment. Only `identified` detections appear in the public map and public detection endpoints.

Authenticated detection responses include all Detection fields except `imageKey`, plus the deployment location and park name. Authenticated users can also retrieve Sensor and Deployment details and an image URL when an image exists. They can read `unknown` and `no_animal` records for additional context.
