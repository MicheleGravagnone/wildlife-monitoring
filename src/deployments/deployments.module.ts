import { Module } from '@nestjs/common';
import { SensorsModule } from '../sensors/sensors.module.js';
import { DeploymentsController } from './deployments.controller.js';
import { DeploymentsService } from './deployments.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  controllers: [DeploymentsController],
  providers: [DeploymentsService],
  exports: [DeploymentsService],
  imports: [SensorsModule, PrismaModule]
})
export class DeploymentsModule {}