import { Module } from '@nestjs/common';
import { SensorsController } from './sensors.controller.js';
import { SensorsService } from './sensors.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  controllers: [SensorsController],
  providers: [SensorsService],
  exports: [SensorsService],
  imports: [PrismaModule],
})
export class SensorsModule {}