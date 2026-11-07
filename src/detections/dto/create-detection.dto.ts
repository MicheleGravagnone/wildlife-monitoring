import {
  Allow,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Validate,
} from 'class-validator';
import type { UUID } from 'node:crypto';
import { ClassificationStatus } from '../../generated/prisma/client.js';
import { ValidClassificationConstraint } from '../validators/valid-classification.constraint.js';
import { z } from 'zod';

export const createDetectionSchema = z.object({
  eventId: z.uuid().min(0),
  deploymentId: z.uuid().min(0),
  capturedAt: z.iso.datetime(),
  classificationStatus: z.enum(ClassificationStatus),
  speciesLabel: z.string().nullable(),
  confidence: z.number().nullable(),
  imageKey: z.string().min(1).optional(),
  modelVersion: z.string().min(1),
  classifiedAt: z.iso.datetime(),
});

export type CreateDetectionDto = z.infer<typeof createDetectionSchema>;
