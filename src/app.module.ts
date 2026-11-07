import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SensorsModule } from './sensors/sensors.module.js';
import { DetectionsModule } from './detections/detections.module.js';

import { DeploymentsModule } from './deployments/deployments.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [SensorsModule, DeploymentsModule, DetectionsModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}