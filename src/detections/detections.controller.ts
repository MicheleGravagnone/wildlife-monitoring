import { Controller, Get, Post, Param, ValidationPipe } from '@nestjs/common';
import { DetectionsService } from './detections.service.js';
import type { Detection } from './types/detection.type.js';

@Controller('detections')
export class DetectionsController {
    constructor(private readonly detectionsService: DetectionsService) {}

    @Get()
    getAll(): Array<Detection> {
        return this.detectionsService.getAll();
    }
}
