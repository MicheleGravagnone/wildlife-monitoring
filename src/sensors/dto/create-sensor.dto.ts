import { IsString, MinLength } from 'class-validator';

export class CreateSensorDto {
  @IsString()
  @MinLength(1)
  readonly deviceId: string;

  @IsString()
  @MinLength(2)
  readonly name: string;
}
