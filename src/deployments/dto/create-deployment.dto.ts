import {
  IsISO8601,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import type { UUID } from 'node:crypto';

export class CreateDeploymentDto {
  @IsUUID()
  readonly sensorId: UUID;

  @IsString()
  @MinLength(2)
  readonly name: string;

  @IsString()
  @MinLength(2)
  readonly parkName: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  readonly latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  readonly longitude: number;

  @IsISO8601()
  readonly installedAt: string;
}
