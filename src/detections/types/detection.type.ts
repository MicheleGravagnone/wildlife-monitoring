import { UUID } from 'node:crypto';
import { ClassificationStatus } from '../enums/classification-status.enum.js';

export type Detection = Readonly<{
  id: UUID;
  eventId: UUID;
  deploymentId: UUID;
  capturedAt: string;
  classificationStatus: ClassificationStatus;
  speciesLabel: string | null;
  confidence: number | null;
  imageKey?: string | null;
  modelVersion: string;
  classifiedAt: string;
  createdAt: string;
}>;