import { useTestApp } from '../support/test-app.js';

describe('Deployment HTTP API', () => {
  const api = useTestApp();

  it('creates, retrieves, and lists a persisted record', async () => {
    const record = await api.createDeployment();
    const lookup = await api
      .http()
      .get(`/deployments/${record.id}`)
      .expect(200);
    expect(lookup.body).toEqual(record);
    const list = await api.http().get('/deployments').expect(200);
    expect(list.body).toContainEqual(record);
    expect(new Date(record.createdAt).toISOString()).toBe(record.createdAt);
  });

  it('rejects malformed IDs', async () => {
    await api.http().get('/deployments/invalid-id').expect(400);
  });

  it('returns 404 for missing records', async () => {
    await api
      .http()
      .get('/deployments/00000000-0000-4000-8000-000000000000')
      .expect(404);
  });

  it('preserves an installation when its sensor moves', async () => {
    const sensor = await api.createSensor();
    const first = await api.createDeployment(sensor.id);
    const second = await api.createDeployment(sensor.id);
    expect(second.id).not.toBe(first.id);
    const lookup = await api.http().get(`/deployments/${first.id}`).expect(200);
    expect(lookup.body).toEqual(first);
  });

  it.each([
    ['invalid latitude', { latitude: 91 }],
    ['invalid longitude', { longitude: -181 }],
    ['invalid date', { installedAt: 'invalid' }],
    ['extra fields', { extra: true }],
  ])('rejects %s', async (_label, changes) => {
    const deployment = await api.createDeployment();
    const { id: _id, createdAt: _createdAt, ...input } = deployment;
    await api
      .http()
      .post('/deployments')
      .send({ ...input, ...changes })
      .expect(400);
  });
});
