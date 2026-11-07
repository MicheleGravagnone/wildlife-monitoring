import { useTestApp } from '../support/test-app.js';

describe('Detection HTTP API', () => {
  const api = useTestApp();

  it('creates, retrieves, and lists a persisted record', async () => {
    const record = await api.createDetection();
    const lookup = await api.http().get(`/detections/${record.id}`).expect(200);
    expect(lookup.body).toEqual(record);
    const list = await api.http().get('/detections').expect(200);
    expect(list.body).toContainEqual(record);
    expect(new Date(record.createdAt).toISOString()).toBe(record.createdAt);
  });

  it('rejects malformed IDs', async () => {
    await api.http().get('/detections/invalid-id').expect(400);
  });

  it('returns 404 for missing records', async () => {
    await api
      .http()
      .get('/detections/00000000-0000-4000-8000-000000000000')
      .expect(404);
  });

  it('returns conflicts for repeated capture event IDs', async () => {
    const detection = await api.createDetection();
    const { id: _id, createdAt: _createdAt, ...input } = detection;
    await api.http().post('/detections').send(input).expect(409);
  });
});
