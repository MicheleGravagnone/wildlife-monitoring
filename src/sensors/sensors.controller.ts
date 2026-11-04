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
import type { Sensor } from './types/sensor.type.js';
import { SensorsService } from './sensors.service.js';
import { CreateSensorDto } from './dto/create-sensor.dto.js';

@Controller('sensors')
export class SensorsController {
  constructor(private readonly sensorService: SensorsService) {}

  @Get()
  getAll(): Array<Sensor> {
    return this.sensorService.getAll();
  }

  @Get(':id')
  getOne(@Param('id', new ParseUUIDPipe()) id: UUID): Sensor {
    const sensor = this.sensorService.getOne(id);

    if (!sensor) {
      throw new NotFoundException('Sensor not found');
    }

    return sensor;
  }

  @Post()
  create(@Body() createSensorDto: CreateSensorDto): Sensor {
    return this.sensorService.create(createSensorDto);
  }
}