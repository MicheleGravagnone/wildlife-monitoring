import { IsString, IsUUID, IsNumber, MinLength, IsISO8601, Min, Max } from 'class-validator';

export class CreateSensorDto {

    @IsString()
    @MinLength(1)
    public readonly deviceId: string;

    @IsString()
    @MinLength(2)
    public readonly name: string;

    @IsString()
    @MinLength(2)
    public readonly parkName: string;

    @IsNumber()
    @Min(-90)
    @Max(90)
    public readonly latitude: number;

    @IsNumber()
    @Min(-180)
    @Max(180)
    public readonly longitude: number;

    @IsISO8601()
    public readonly installedAt: string;

}