-- CreateEnum
CREATE TYPE "ClassificationStatus" AS ENUM ('identified', 'unknown', 'no_animal');

-- CreateTable
CREATE TABLE "Sensor" (
    "id" UUID NOT NULL,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deployment" (
    "id" UUID NOT NULL,
    "sensorId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "parkName" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "installedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Detection" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "deploymentId" UUID NOT NULL,
    "capturedAt" TIMESTAMPTZ(3) NOT NULL,
    "classificationStatus" "ClassificationStatus" NOT NULL,
    "speciesLabel" TEXT,
    "confidence" DOUBLE PRECISION,
    "imageKey" TEXT,
    "modelVersion" TEXT NOT NULL,
    "classifiedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Detection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sensor_deviceId_key" ON "Sensor"("deviceId");

-- CreateIndex
CREATE INDEX "Deployment_sensorId_installedAt_idx" ON "Deployment"("sensorId", "installedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Detection_eventId_key" ON "Detection"("eventId");

-- CreateIndex
CREATE INDEX "Detection_deploymentId_capturedAt_idx" ON "Detection"("deploymentId", "capturedAt");

-- CreateIndex
CREATE INDEX "Detection_classificationStatus_capturedAt_idx" ON "Detection"("classificationStatus", "capturedAt");

-- AddForeignKey
ALTER TABLE "Deployment" ADD CONSTRAINT "Deployment_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "Sensor"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Detection" ADD CONSTRAINT "Detection_deploymentId_fkey" FOREIGN KEY ("deploymentId") REFERENCES "Deployment"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;
