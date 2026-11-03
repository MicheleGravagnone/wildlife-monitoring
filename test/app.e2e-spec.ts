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
    parkName: 'Test park',
    latitude: 51.7592,
    longitude: 19.456,
    installedAt: '2026-10-01T08:00:00.000Z',
  };

  it.each(['sensors', 'detections'])(
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

  it.each(['sensors', 'detections'])(
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
    ['invalid latitude', { ...sensorDto, latitude: 91 }],
    ['invalid longitude', { ...sensorDto, longitude: -181 }],
    ['non-numeric latitude', { ...sensorDto, latitude: '51' }],
    ['invalid date', { ...sensorDto, installedAt: 'invalid' }],
    ['empty device ID', { ...sensorDto, deviceId: '' }],
    ['short name', { ...sensorDto, name: 'A' }],
    ['short park name', { ...sensorDto, parkName: 'A' }],
    ['extra fields', { ...sensorDto, extra: true }],
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

  afterEach(async () => {
    await app.close();
  });
  
});