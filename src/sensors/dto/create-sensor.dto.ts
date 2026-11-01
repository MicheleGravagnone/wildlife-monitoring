import { IsString, IsUUID, IsNumber, MinLength, IsISO8601 } from 'class-validator';
import type { UUID } from 'crypto';

export class CreateSensorDto {

    @IsUUID()
    public readonly id: UUID;

    @IsString()
    public readonly deviceId: string;

    @IsString()
    @MinLength(2)
    public readonly name: string;

    @IsString()
    @MinLength(2)
    public readonly parkName: string;

    @IsNumber()
    public readonly latitude: number;

    @IsNumber()
    public readonly longitude: number;

    @IsISO8601()
    public readonly installedAt: string;

}