import { Module } from '@nestjs/common';
import { SensorsModule } from './sensors/sensors.module.js';
import { DeploymentsModule } from './deployments/deployments.module.js';
import { DetectionsModule } from './detections/detections.module.js';

@Module({
  imports: [SensorsModule, DeploymentsModule, DetectionsModule],
})
export class AppModule {}
