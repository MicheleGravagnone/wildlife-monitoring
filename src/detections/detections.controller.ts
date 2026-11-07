import { Controller, Get, Post, Body, NotFoundException, Param, ParseUUIDPipe } from '@nestjs/common';
import { DetectionsService } from './detections.service.js';
import type { Detection } from '../generated/prisma/client.js';
import type { UUID } from 'node:crypto';
import { CreateDetectionDto } from './dto/create-detection.dto.js';

@Controller('detections')
export class DetectionsController {
  constructor(private readonly detectionsService: DetectionsService) {}

  @Get()
  getAll(): Promise<Detection[]> {
    return this.detectionsService.getAll();
  }

  @Get(':id')
  async getOne(@Param('id', new ParseUUIDPipe()) id: UUID): Promise<Detection> {
    const detection = await this.detectionsService.getOne(id);
    if(detection == null) {
      throw new NotFoundException();
    }
    return detection;
  }

  @Post()
  create(@Body() dto: CreateDetectionDto): Promise<Detection> {
    return this.detectionsService.create(dto);
  }
}