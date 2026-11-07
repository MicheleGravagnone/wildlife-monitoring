import { Module } from '@nestjs/common';
import { DetectionsController } from './detections.controller.js';
import { DetectionsService } from './detections.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  controllers: [DetectionsController],
  providers: [DetectionsService],
  imports: [PrismaModule],
})
export class DetectionsModule {}