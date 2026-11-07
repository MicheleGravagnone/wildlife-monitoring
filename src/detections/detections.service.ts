import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, type Detection } from '../generated/prisma/client.js';
import type { UUID } from 'node:crypto';
import type { CreateDetectionDto } from './dto/create-detection.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DetectionsService {
  constructor(private readonly prisma: PrismaService) {}

  getAll(): Promise<Detection[]> {
    return this.prisma.detection.findMany();
  }

  getOne(id: UUID): Promise<Detection | null> {
    return this.prisma.detection.findUnique({ where: { id } });
  }

  async create(dto: CreateDetectionDto): Promise<Detection> {
    try {
      return await this.prisma.detection.create({
        data: {
          eventId: dto.eventId,
          deploymentId: dto.deploymentId,
          capturedAt: dto.capturedAt,
          classificationStatus: dto.classificationStatus,
          speciesLabel: dto.speciesLabel,
          confidence: dto.confidence,
          imageKey: dto.imageKey ?? null,
          modelVersion: dto.modelVersion,
          classifiedAt: dto.classifiedAt,
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
