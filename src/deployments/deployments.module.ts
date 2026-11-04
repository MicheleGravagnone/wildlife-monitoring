import { Module } from '@nestjs/common';
import { SensorsModule } from '../sensors/sensors.module.js';
import { DeploymentsController } from './deployments.controller.js';
import { DeploymentsService } from './deployments.service.js';

@Module({
  imports: [SensorsModule],
  controllers: [DeploymentsController],
  providers: [DeploymentsService],
  exports: [DeploymentsService],
})
export class DeploymentsModule {}