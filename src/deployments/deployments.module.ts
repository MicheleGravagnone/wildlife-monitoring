import { Module } from '@nestjs/common';
import { DeploymentsController } from './deployments.controller.js';
import { DeploymentsService } from './deployments.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  controllers: [DeploymentsController],
  providers: [DeploymentsService],
  exports: [DeploymentsService],
  imports: [PrismaModule],
})
export class DeploymentsModule {}
