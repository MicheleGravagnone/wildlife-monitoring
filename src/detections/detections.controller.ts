import {
  Controller,
  Get,
  Post,
  Body,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { DetectionsService } from './detections.service.js';
import type { Detection } from '../generated/prisma/client.js';
import type { UUID } from 'node:crypto';
import type { CreateDetectionDto } from './dto/create-detection.dto.js';
import { createDetectionSchema } from './dto/create-detection.dto.js';
import z from 'zod';

@Controller('detections')
export class DetectionsController {
  constructor(private readonly detectionsService: DetectionsService) {}

  @Get()
  getAll(): Promise<Detection[]> {
    return this.detectionsService.getAll();
  }

  @Get(':id')
  async getOne(
    @Param('id', { schema: z.uuid() }) id: UUID,
  ): Promise<Detection> {
    const detection = await this.detectionsService.getOne(id);
    if (detection == null) {
      throw new NotFoundException();
    }
    return detection;
  }

  @Post()
  create(
    @Body({ schema: createDetectionSchema }) dto: CreateDetectionDto,
  ): Promise<Detection> {
    return this.detectionsService.create(dto);
  }
}
