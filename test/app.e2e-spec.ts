import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  const sensorDto = {
    deviceId: 'esp32-e2e-001',
    name: 'E2E sensor',
  };

  it.each(['sensors', 'deployments', 'detections'])(
    'GET /%s returns retrievable records',
    async (resource) => {
      const list = await request(app.getHttpServer())
        .get(`/${resource}`)
        .expect(200);
      expect(Array.isArray(list.body)).toBe(true);
      expect(list.body.length).toBeGreaterThan(0);
      for (const record of list.body) {
        const response = await request(app.getHttpServer())
          .get(`/${resource}/${record.id}`)
          .expect(200);
        expect(response.body).toEqual(record);
      }
    },
  );

  it.each(['sensors', 'deployments', 'detections'])(
    'GET /%s rejects invalid UUIDs',
    async (resource) => {
      await request(app.getHttpServer())
        .get(`/${resource}/invalid-id`)
        .expect(400);
    },
  );

  it('GET /sensors/:id returns 404 for a missing sensor', async () => {
    await request(app.getHttpServer())
      .get('/sensors/00000000-0000-4000-8000-000000000000')
      .expect(404);
  });

  it('POST /sensors creates a retrievable sensor', async () => {
    const response = await request(app.getHttpServer())
      .post('/sensors')
      .send(sensorDto)
      .expect(201);
    expect(response.body).toEqual({
      ...sensorDto,
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
      createdAt: expect.any(String),
    });
    expect(new Date(response.body.createdAt).toISOString()).toBe(
      response.body.createdAt,
    );
    const lookup = await request(app.getHttpServer())
      .get(`/sensors/${response.body.id}`)
      .expect(200);
    expect(lookup.body).toEqual(response.body);
  });

  it.each([
    ['missing fields', {}],
    ['empty device ID', { ...sensorDto, deviceId: '' }],
    ['short name', { ...sensorDto, name: 'A' }],
    ['extra fields', { ...sensorDto, extra: true }],
    ['deployment fields', { ...sensorDto, latitude: 51, longitude: 19 }],
  ])(
    'POST /sensors rejects %s without storing a sensor',
    async (_label, payload) => {
      const before = await request(app.getHttpServer())
        .get('/sensors')
        .expect(200);
      await request(app.getHttpServer())
        .post('/sensors')
        .send(payload)
        .expect(400);
      const after = await request(app.getHttpServer())
        .get('/sensors')
        .expect(200);
      expect(after.body).toEqual(before.body);
    },
  );

  const deploymentDto = {
    sensorId: 'c3d972e5-4886-4c41-8583-529e288bd285',
    name: 'E2E deployment',
    parkName: 'Test park',
    latitude: 51.7592,
    longitude: 19.456,
    installedAt: '2026-11-04T08:00:00.000Z',
  };

  it('POST /deployments registers a new location while preserving existing detections', async () => {
    const detections = await request(app.getHttpServer())
      .get('/detections')
      .expect(200);
    const sensor = await request(app.getHttpServer())
      .post('/sensors')
      .send(sensorDto)
      .expect(201);
    const dto = { ...deploymentDto, sensorId: sensor.body.id };
    const first = await request(app.getHttpServer())
      .post('/deployments')
      .send(dto)
      .expect(201);
    const second = await request(app.getHttpServer())
      .post('/deployments')
      .send({ ...dto, latitude: 52, longitude: 20 })
      .expect(201);
    expect(second.body.id).not.toBe(first.body.id);
    expect(second.body.sensorId).toBe(first.body.sensorId);
    expect(first.body).toMatchObject(dto);
    const lookup = await request(app.getHttpServer())
      .get(`/deployments/${first.body.id}`)
      .expect(200);
    expect(lookup.body).toEqual(first.body);
    const after = await request(app.getHttpServer())
      .get('/detections')
      .expect(200);
    expect(after.body).toEqual(detections.body);
  });

  it('resolves every detection location through its deployment and sensor', async () => {
    const detections = await request(app.getHttpServer())
      .get('/detections')
      .expect(200);
    for (const detection of detections.body) {
      expect(detection).not.toHaveProperty('sensorId');
      const deployment = await request(app.getHttpServer())
        .get(`/deployments/${detection.deploymentId}`)
        .expect(200);
      const sensor = await request(app.getHttpServer())
        .get(`/sensors/${deployment.body.sensorId}`)
        .expect(200);
      expect(sensor.body).not.toHaveProperty('latitude');
      expect(sensor.body).not.toHaveProperty('installedAt');
      expect(deployment.body.latitude).toEqual(expect.any(Number));
    }
  });

  it('POST /sensors rejects duplicate device IDs', async () => {
    await request(app.getHttpServer())
      .post('/sensors')
      .send(sensorDto)
      .expect(201);
    await request(app.getHttpServer())
      .post('/sensors')
      .send(sensorDto)
      .expect(409);
  });

  it('GET /deployments/:id returns 404 for a missing deployment', async () => {
    await request(app.getHttpServer())
      .get('/deployments/00000000-0000-4000-8000-000000000000')
      .expect(404);
  });

  it('POST /deployments rejects an unknown sensor', async () => {
    const before = await request(app.getHttpServer())
      .get('/deployments')
      .expect(200);
    await request(app.getHttpServer())
      .post('/deployments')
      .send({
        ...deploymentDto,
        sensorId: '00000000-0000-4000-8000-000000000000',
      })
      .expect(404);
    const after = await request(app.getHttpServer())
      .get('/deployments')
      .expect(200);
    expect(after.body).toEqual(before.body);
  });

  it.each([
    ['missing fields', {}],
    ['invalid sensor ID', { ...deploymentDto, sensorId: 'invalid' }],
    ['invalid latitude', { ...deploymentDto, latitude: 91 }],
    ['invalid longitude', { ...deploymentDto, longitude: -181 }],
    ['non-numeric latitude', { ...deploymentDto, latitude: '51' }],
    ['invalid date', { ...deploymentDto, installedAt: 'invalid' }],
    ['short name', { ...deploymentDto, name: 'A' }],
    ['short park name', { ...deploymentDto, parkName: 'A' }],
    ['extra fields', { ...deploymentDto, extra: true }],
  ])(
    'POST /deployments rejects %s without storing a deployment',
    async (_label, payload) => {
      const before = await request(app.getHttpServer())
        .get('/deployments')
        .expect(200);
      await request(app.getHttpServer())
        .post('/deployments')
        .send(payload)
        .expect(400);
      const after = await request(app.getHttpServer())
        .get('/deployments')
        .expect(200);
      expect(after.body).toEqual(before.body);
    },
  );

  afterEach(async () => {
    await app.close();
  });
});