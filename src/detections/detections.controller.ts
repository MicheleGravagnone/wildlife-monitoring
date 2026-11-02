import { Controller, Get, Post, Param, ValidationPipe, ParseUUIDPipe } from '@nestjs/common';
import { DetectionsService } from './detections.service.js';
import type { Detection } from './types/detection.type.js';
import type { UUID } from 'node:crypto';

@Controller('detections')
export class DetectionsController {
    constructor(private readonly detectionsService: DetectionsService) {}

    @Get()
    getAll(): Array<Detection> {
        return this.detectionsService.getAll();
    }

    @Get(':id')
    getOne(@Param('id', new ParseUUIDPipe()) id: UUID) {
        return this.detectionsService.getOne(id);
    }
}
