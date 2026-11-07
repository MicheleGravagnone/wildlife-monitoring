import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import type { UUID } from 'node:crypto';
import { DeploymentsService } from './deployments.service.js';
import { CreateDeploymentDto } from './dto/create-deployment.dto.js';
import type { Deployment } from '../generated/prisma/client.js';

@Controller('deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Get()
  getAll(): Promise<Deployment[]> {
    return this.deploymentsService.getAll();
  }

  @Get(':id')
  async getOne(@Param('id', new ParseUUIDPipe()) id: UUID): Promise<Deployment> {
    const deployment = await this.deploymentsService.getOne(id);
    if (deployment == null) {
      throw new NotFoundException('Deployment not found');
    }
    return deployment;
  }

  @Post()
  create(@Body() dto: CreateDeploymentDto): Promise<Deployment> {
    return this.deploymentsService.create(dto);
  }
}