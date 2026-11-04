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
import type { Deployment } from './types/deployment.type.js';

@Controller('deployments')
export class DeploymentsController {
  constructor(private readonly deploymentsService: DeploymentsService) {}

  @Get()
  getAll(): Deployment[] {
    return this.deploymentsService.getAll();
  }

  @Get(':id')
  getOne(@Param('id', new ParseUUIDPipe()) id: UUID): Deployment {
    const deployment = this.deploymentsService.getOne(id);
    if (!deployment) throw new NotFoundException('Deployment not found');
    return deployment;
  }

  @Post()
  create(@Body() dto: CreateDeploymentDto): Deployment {
    return this.deploymentsService.create(dto);
  }
}