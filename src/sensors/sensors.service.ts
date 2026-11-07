import { ConflictException, Injectable } from '@nestjs/common';
import type { Sensor } from '../generated/prisma/client.js';
import type { UUID } from 'node:crypto';
import type { CreateSensorDto } from './dto/create-sensor.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';

@Injectable()
export class SensorsService {
  constructor(private readonly prisma: PrismaService) {}

  getAll(): Promise<Sensor[]> {
    return this.prisma.sensor.findMany();
  }

  getOne(id: UUID): Promise<Sensor | null> {
    return this.prisma.sensor.findUnique({ where: { id } });
  }

  async create(dto: CreateSensorDto): Promise<Sensor> {
    try {
      return await this.prisma.sensor.create({
        data: {
          deviceId: dto.deviceId,
          name: dto.name,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException();
      }

      throw err;
    }
  }
}