import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID, type UUID } from 'node:crypto';
import type { CreateDeploymentDto } from './dto/create-deployment.dto.js';
import type { Deployment } from '../generated/prisma/client.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DeploymentsService {
  constructor(private readonly prisma: PrismaService) {}

  getAll(): Promise<Deployment[]> {
    return this.prisma.deployment.findMany();
  }

  getOne(id: UUID): Promise<Deployment | null> {
    return this.prisma.deployment.findUnique({ where: { id }});
  }

  async create(dto: CreateDeploymentDto): Promise<Deployment> {
    try {
      return await this.prisma.deployment.create({
        data: {
          sensorId: dto.sensorId,
          name: dto.name,
          parkName: dto.parkName,
          latitude: dto.latitude,
          longitude: dto.longitude,
          installedAt: dto.installedAt
        },
      });
    } catch(err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException();
      }
      throw err;
    }
  }
}