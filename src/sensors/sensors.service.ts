import { ConflictException, Injectable } from '@nestjs/common';
import type { Sensor } from './types/sensor.type.js';
import { randomUUID, type UUID } from 'node:crypto';
import type { CreateSensorDto } from './dto/create-sensor.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SensorsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly sensors: Sensor[] = [
    {
      id: 'c3d972e5-4886-4c41-8583-529e288bd285',
      deviceId: 'esp32-test-001',
      name: 'Test sensor 1',
      createdAt: '2026-10-01T08:00:00.000Z',
    },
    {
      id: 'f576207b-8d06-497a-97da-f4958a96908d',
      deviceId: 'esp32-test-002',
      name: 'Test sensor 2',
      createdAt: '2026-10-02T08:00:00.000Z',
    },
  ];

  getAll() {
    return this.prisma.sensor.findMany();
  }

  getOne(id: UUID)  {
    return this.prisma.sensor.findUnique({ where: { id } });
  }

  async create(dto: CreateSensorDto) {
    try {
      return await this.prisma.sensor.create({
        data: {
          deviceId: dto.deviceId,
          name: dto.name
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err as Prisma.PrismaClientKnownRequestError).code === 'P2002'
      ) {
        throw new ConflictException();
      }

      throw err;
    }
  }
}