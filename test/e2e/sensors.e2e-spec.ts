import { useTestApp } from '../support/test-app.js';

describe('Sensor HTTP API', () => {
  const api = useTestApp();

  it('creates, retrieves, and lists a persisted record', async () => {
    const record = await api.createSensor();
    const lookup = await api.http().get(`/sensors/${record.id}`).expect(200);
    expect(lookup.body).toEqual(record);
    const list = await api.http().get('/sensors').expect(200);
    expect(list.body).toContainEqual(record);
    expect(new Date(record.createdAt).toISOString()).toBe(record.createdAt);
  });

  it('rejects malformed IDs', async () => {
    await api.http().get('/sensors/invalid-id').expect(400);
  });

  it('returns 404 for missing records', async () => {
    await api
      .http()
      .get('/sensors/00000000-0000-4000-8000-000000000000')
      .expect(404);
  });

  it('rejects duplicate device IDs', async () => {
    const dto = api.newSensorInput();
    await api.http().post('/sensors').send(dto).expect(201);
    await api.http().post('/sensors').send(dto).expect(409);
  });

  it.each([
    ['missing fields', {}],
    ['empty device ID', { deviceId: '', name: 'Camera' }],
    ['short name', { deviceId: 'invalid-camera', name: 'A' }],
    [
      'extra fields',
      { deviceId: 'invalid-camera', name: 'Camera', extra: true },
    ],
  ])('rejects %s', async (_label, payload) => {
    await api.http().post('/sensors').send(payload).expect(400);
  });
});
