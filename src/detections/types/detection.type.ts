import { UUID } from "node:crypto"

export enum ClassificationStatus {
    IDENTIFIED  = 'identified',
    UNKNOWN = 'unknown',
    NO_ANIMAL = 'no animal',
}

export type Detection = Readonly<{
    id: UUID;
    eventId: UUID;
    sensorId: UUID;
    capturedAt: string;
    classificationStatus: ClassificationStatus;
    speciesLabel: string | null;
    confidence: number | null;
    imageKey?: string | null;
    modelVersion: string;
    classifiedAt: string;
    createdAt: string;
}>;