import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { UUID } from 'node:crypto';
import type { Sensor } from '../generated/prisma/client.js';
import { SensorsService } from './sensors.service.js';
import { CreateSensorDto } from './dto/create-sensor.dto.js';

@Controller('sensors')
export class SensorsController {
  constructor(private readonly sensorService: SensorsService) {}

  @Get()
  getAll(): Promise<Sensor[]> {
    return this.sensorService.getAll();
  }

  @Get(':id')
  async getOne(@Param('id', new ParseUUIDPipe()) id: UUID): Promise<Sensor> {
    const sensor = await this.sensorService.getOne(id);
    if (sensor == null) {
      throw new NotFoundException('Sensor not found');
    }
    return sensor;
  }

  @Post()
  create(@Body() dto: CreateSensorDto): Promise<Sensor> {
    return this.sensorService.create(dto);
  }
}
