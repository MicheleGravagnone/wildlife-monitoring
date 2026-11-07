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

export class CreateDetectionDto {
  @IsUUID()
  eventId: UUID;

  @IsUUID()
  deploymentId: UUID;

  @IsString()
  capturedAt: string;

  @IsEnum(ClassificationStatus)
  @Validate(ValidClassificationConstraint)
  classificationStatus: ClassificationStatus;

  @Allow()
  speciesLabel: string | null;

  @Allow()
  confidence: number | null;

  @IsString()
  @IsOptional()
  imageKey?: string | null;

  @IsString()
  modelVersion: string;

  @IsString()
  classifiedAt: string;
}
