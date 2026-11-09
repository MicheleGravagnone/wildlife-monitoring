import { randomUUID } from 'node:crypto';
import {
  StandardSchemaValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { sensorInput, deploymentInput, detectionInput } from './fixtures.js';

export function useTestApp() {
  let app: INestApplication;
  let prisma: PrismaService;
  const deviceIds: string[] = [];

  beforeEach(async () => {
    const databaseUrl = process.env.TEST_DATABASE_URL;
    if (!databaseUrl)
      throw new Error(
        'TEST_DATABASE_URL must point to a separate, migrated test database',
      );
    vi.stubEnv('DATABASE_URL', databaseUrl);
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    prisma = module.get(PrismaService);
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
  });

  afterEach(async () => {
    try {
      if (prisma && deviceIds.length) {
        await prisma.$transaction([
          prisma.detection.deleteMany({
            where: { deployment: { sensor: { deviceId: { in: deviceIds } } } },
          }),
          prisma.deployment.deleteMany({
            where: { sensor: { deviceId: { in: deviceIds } } },
          }),
          prisma.sensor.deleteMany({ where: { deviceId: { in: deviceIds } } }),
        ]);
      }
    } finally {
      deviceIds.length = 0;
      if (app) await app.close();
      vi.unstubAllEnvs();
    }
  });

  function newSensorInput() {
    const deviceId = `e2e-${randomUUID()}`;
    deviceIds.push(deviceId);
    return { ...sensorInput, deviceId };
  }

  async function createSensor() {
    return (
      await request(app.getHttpServer())
        .post('/sensors')
        .send(newSensorInput())
        .expect(201)
    ).body;
  }

  async function createDeployment(sensorId?: string) {
    const id = sensorId ?? (await createSensor()).id;
    return (
      await request(app.getHttpServer())
        .post('/deployments')
        .send({ ...deploymentInput, sensorId: id })
        .expect(201)
    ).body;
  }

  async function createDetection() {
    const deployment = await createDeployment();
    return (
      await request(app.getHttpServer())
        .post('/detections')
        .send({
          ...detectionInput,
          eventId: randomUUID(),
          deploymentId: deployment.id,
        })
        .expect(201)
    ).body;
  }

  return {
    http: () => request(app.getHttpServer()),
    newSensorInput,
    createSensor,
    createDeployment,
    createDetection,
  };
}
