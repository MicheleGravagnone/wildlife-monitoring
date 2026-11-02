import { isString, IsString, IsUUID } from "class-validator";
import type { UUID } from "node:crypto";
import { ClassificationStatus } from "../enums/classification-status.enum.js";

export class CreateDetectionDto {
    
    @IsUUID()
    eventId: UUID;

    @IsUUID()
    sensorId: UUID;

    @IsString()
    capturedAt: string;


    classificationStatus: ClassificationStatus;
    speciesLabel: string | null;
    confidence: number | null;
    imageKey?: string | null;
    modelVersion: string;
    classifiedAt: string;
}