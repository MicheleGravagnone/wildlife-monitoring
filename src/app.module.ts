import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { SensorsModule } from './sensors/sensors.module.js';

@Module({
  imports: [SensorsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
