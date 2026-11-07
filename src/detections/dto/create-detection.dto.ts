import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import type { UUID } from 'node:crypto';
import { ClassificationStatus } from '../../generated/prisma/client.js';

export class CreateDetectionDto {
  @IsUUID()
  eventId: UUID;

  @IsUUID()
  deploymentId: UUID;

  @IsString()
  capturedAt: string;

  @IsEnum(ClassificationStatus)
  classificationStatus: ClassificationStatus;

  @IsString()
  speciesLabel: string | null;

  @IsNumber()
  confidence: number | null;

  @IsString()
  @IsOptional()
  imageKey?: string | null;

  @IsString()
  modelVersion: string;

  @IsString()
  classifiedAt: string;
}