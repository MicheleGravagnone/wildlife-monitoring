# Architecture and Messaging Decisions

This document details the architectural decisions regarding the asynchronous capture-to-inference pipeline, the selection of RabbitMQ as the message broker, and the decoupling of low-power IoT devices from compute-heavy AI vision services.

## Problem Context and Workflow

The system captures wildlife activity across parks in Łódź, Poland, using camera- and PIR-equipped ESP32 microcontrollers. The capture-to-observation workflow involves:

1. **Capture Reception**: An ESP32 detects motion, captures an image, and uploads it to the backend along with metadata (`eventId`, `deploymentId`, `capturedAt`).
2. **AI Inference**: A vision model evaluates the photo, classifying species (`IDENTIFIED`, `UNKNOWN`, `NO_ANIMAL`), confidence score, and model metadata.
3. **Observation Persistence**: The backend validates and writes the resulting `Detection` to PostgreSQL as an immutable record.

```
┌──────────────┐          ┌───────────────────────┐          ┌─────────────────────┐
│ ESP32 Sensor │ ───────► │ Backend Ingestion API │ ───────► │ Object Storage (S3) │
└──────────────┘          └──────────┬────────────┘          └─────────────────────┘
                                     │
                             (captures.raw)
                                     ▼
                          ┌───────────────────────┐
                          │    RabbitMQ Broker    │
                          └──────────┬────────────┘
                                     │
                             (prefetch_count)
                                     ▼
                          ┌───────────────────────┐
                          │ Python AI Worker Pool │
                          └──────────┬────────────┘
                                     │
                         (detections.classified)
                                     ▼
                          ┌───────────────────────┐          ┌─────────────────────┐
                          │  Backend Persistence  │ ───────► │    PostgreSQL 17    │
                          └───────────────────────┘          └─────────────────────┘
```

## Why an Asynchronous Message Queue is Necessary

A direct synchronous HTTP approach (`ESP32 -> Backend -> AI Service -> Database`) introduces critical operational failure modes in a wildlife monitoring environment:

1. **GPU Memory Saturation (CUDA OOM)**:
   Wildlife movement is bursty. Animals traveling in groups or lingering in front of a PIR sensor trigger multiple photos within a few seconds (predominantly at dawn and dusk). Concurrently invoking deep learning models (e.g., YOLO, MegaDetector) causes GPU VRAM exhaustion or steep latency degradation. A message queue enforces **backpressure** through worker prefetching.
2. **IoT Device Battery Preservation**:
   ESP32 camera traps run on battery packs or small solar cells. Radio transmission (Wi-Fi or LTE) is the primary energy drain. If the device must wait 500ms–5000ms for synchronous model inference, battery depletes rapidly. Enqueuing the capture allows the backend to acknowledge receipt in `< 30ms` (`202 Accepted`), enabling the ESP32 to immediately enter deep sleep.
3. **Polyglot Boundary Decoupling**:
   The backend API is implemented in **TypeScript (NestJS 12)** for rapid, schema-validated web service development. The AI inference service is written in **Python (PyTorch / OpenCV)** to leverage the computer vision ecosystem. A message queue creates a decoupled, language-agnostic contract between these runtimes.
4. **Fault Tolerance and Retry Semantics**:
   If the AI inference service restarts or crashes during a model reload, captures remain buffered in the queue rather than being dropped or requiring the camera trap to hold retries in limited microcontroller RAM.

## Technology Selection: Why RabbitMQ?

Several messaging and queue technologies were evaluated across both **practical architectural fit** and **industry relevance (CV value)**:

| Technology                 | Practical Fit for this Pipeline                                                                                                                                                                                       | Industry & CV Value                                                                                                                                                          | Verdict      |
| :------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------- |
| **RabbitMQ (AMQP)**        | **High**: Native NestJS microservice transport (`@nestjs/microservices`); native Python support (`pika`, `aio-pika`); fine-grained consumer `prefetch_count` to control GPU batch sizes; Dead-Letter Exchanges (DLX). | **High**: Classic enterprise message broker; recognized across backend, cloud, and distributed systems roles. Demonstrates understanding of AMQP and polyglot architectures. | **Selected** |
| **Apache Kafka**           | **Low to Moderate**: Designed for append-only distributed event streaming at high throughput. Lacks ergonomic per-message task acknowledgment, DLQ routing, and dynamic worker prefetching required for task queues.  | **High**: Highly requested in big-tech data engineering job descriptions, but represents architectural over-engineering for single-image task dispatching.                   | Discarded    |
| **Redis + BullMQ**         | **Moderate**: BullMQ is the gold standard for NestJS, but is Node-only. Bridging BullMQ jobs to Python workers requires custom wrappers or raw Redis Streams, breaking framework ergonomics.                          | **Moderate**: Highly regarded in fullstack and TypeScript ecosystems, but less prominent for cross-language enterprise pipelines.                                            | Discarded    |
| **PostgreSQL (`pg-boss`)** | **Moderate**: Pragmatic and reuses existing PostgreSQL infrastructure with zero new containers, but couples job queuing overhead to database I/O.                                                                     | **Low**: Minimal resume visibility; rarely matches recruiter ATS filters for distributed systems roles.                                                                      | Discarded    |

### Architectural Benefits of RabbitMQ in this Stack

- **Backpressure via `prefetch_count`**: The Python AI worker sets `prefetch_count` to match its GPU batching capacity (e.g., 1 to 4 images), ensuring it never pulls more work than it can actively process.
- **Dead-Letter Exchanges (DLX)**: Unreadable image files or repeated inference exceptions are routed to `captures.dlq` after exceeding retry thresholds without blocking the primary ingestion queue.
- **Observable Operations**: RabbitMQ includes a web management console (`:15672`) providing real-time visibility into queue depth, message rates, and consumer health during development and demonstrations.

## Queue Topology and Routing

- **Exchange**: `wildlife.direct` (`direct`, durable)
- **Queues**:
  - `captures.raw`: Bounded worker queue for raw image processing tasks.
  - `detections.classified`: Queue for completed classification results consumed by the backend.
  - `captures.dlq`: Dead-letter queue bound via `wildlife.dlx` for failed or malformed captures.
