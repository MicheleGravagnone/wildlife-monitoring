import { NotFoundException } from '@nestjs/common';
import { SensorsService } from '../sensors/sensors.service.js';
import { DeploymentsService } from './deployments.service.js';
import type { CreateDeploymentDto } from './dto/create-deployment.dto.js';

const dto = {
  sensorId: 'c3d972e5-4886-4c41-8583-529e288bd285',
  name: 'Moved deployment',
  parkName: 'Another park',
  latitude: 51.8,
  longitude: 19.5,
  installedAt: '2026-11-04T08:00:00.000Z',
} satisfies CreateDeploymentDto;

describe('DeploymentsService', () => {
  let service: DeploymentsService;

  beforeEach(() => {
    service = new DeploymentsService(new SensorsService());
  });

  afterEach(() => vi.useRealTimers());

  it('returns deployments linked to registered sensors', () => {
    const sensors = new SensorsService();
    expect(service.getAll()).toHaveLength(2);
    for (const deployment of service.getAll()) {
      expect(sensors.getOne(deployment.sensorId)).toBeDefined();
      expect(service.getOne(deployment.id)).toEqual(deployment);
    }
  });

  it('returns undefined for an unknown deployment', () => {
    expect(
      service.getOne('00000000-0000-4000-8000-000000000000'),
    ).toBeUndefined();
  });

  it('creates another deployment for the same sensor without changing its history', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-04T09:00:00.000Z'));
    const previous = service.getAll();
    const result = service.create(dto);
    expect(result).toEqual({
      ...dto,
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
      createdAt: '2026-11-04T09:00:00.000Z',
    });
    expect(previous.map((deployment) => deployment.id)).not.toContain(
      result.id,
    );
    expect(service.getAll()).toEqual([...previous, result]);
    expect(service.getOne(result.id)).toEqual(result);
    expect(service.getOne(previous[0].id)).toEqual(previous[0]);
  });

  it('rejects a deployment for an unknown sensor without storing it', () => {
    const previous = service.getAll();
    expect(() =>
      service.create({
        ...dto,
        sensorId: '00000000-0000-4000-8000-000000000000',
      }),
    ).toThrow(NotFoundException);
    expect(service.getAll()).toEqual(previous);
  });

  it('protects stored data from changes to returned lists and lookup results', () => {
    const previous = service.getAll();
    const list = service.getAll();
    Object.assign(list[0], { latitude: 0 });
    list.pop();
    const deployment = service.getOne(previous[0].id);
    if (!deployment) throw new Error('Expected seeded deployment');
    Object.assign(deployment, { parkName: 'Changed park' });
    expect(service.getAll()).toEqual(previous);
  });

  it('protects stored data from changes to creation input and output', () => {
    const input = { ...dto };
    const result = service.create(input);
    const expected = { ...result };
    input.latitude = 0;
    Object.assign(result, { parkName: 'Changed park' });
    expect(service.getOne(result.id)).toEqual(expected);
  });
});