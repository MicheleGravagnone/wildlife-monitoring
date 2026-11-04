import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SensorsModule } from './sensors/sensors.module.js';
import { DetectionsModule } from './detections/detections.module.js';

import { DeploymentsModule } from './deployments/deployments.module.js';

@Module({
  imports: [SensorsModule, DeploymentsModule, DetectionsModule],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}