import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID, type UUID } from 'node:crypto';
import { SensorsService } from '../sensors/sensors.service.js';
import type { CreateDeploymentDto } from './dto/create-deployment.dto.js';
import type { Deployment } from './types/deployment.type.js';

@Injectable()
export class DeploymentsService {
  constructor(private readonly sensorsService: SensorsService) {}

  private readonly deployments: Deployment[] = [
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      sensorId: 'c3d972e5-4886-4c41-8583-529e288bd285',
      name: 'Test deployment 1',
      parkName: 'Demo park',
      latitude: 51.7592,
      longitude: 19.456,
      installedAt: '2026-10-01T08:00:00.000Z',
      createdAt: '2026-10-01T08:00:00.000Z',
    },
    {
      id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      sensorId: 'f576207b-8d06-497a-97da-f4958a96908d',
      name: 'Test deployment 2',
      parkName: 'Demo park',
      latitude: 51.76,
      longitude: 19.46,
      installedAt: '2026-10-02T08:00:00.000Z',
      createdAt: '2026-10-02T08:00:00.000Z',
    },
  ];

  getAll(): Deployment[] {
    return this.deployments.map((deployment) => ({ ...deployment }));
  }

  getOne(id: UUID): Deployment | undefined {
    const deployment = this.deployments.find(
      (deployment) => deployment.id === id,
    );
    return deployment ? { ...deployment } : undefined;
  }

  create(dto: CreateDeploymentDto): Deployment {
    if (!this.sensorsService.getOne(dto.sensorId)) {
      throw new NotFoundException('Sensor not found');
    }
    const deployment = {
      sensorId: dto.sensorId,
      name: dto.name,
      parkName: dto.parkName,
      latitude: dto.latitude,
      longitude: dto.longitude,
      installedAt: dto.installedAt,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    this.deployments.push(deployment);
    return { ...deployment };
  }
}