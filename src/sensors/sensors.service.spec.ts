import { Test, TestingModule } from '@nestjs/testing';
import { SensorsService } from './sensors.service.js';
import type { Sensor } from './types/sensor.type.js';
import type { CreateSensorDto } from './dto/create-sensor.dto.js';

const expectedSensors: Sensor[] = [
  {
    id: 'c3d972e5-4886-4c41-8583-529e288bd285',
    deviceId: 'esp32-test-001',
    name: 'Test deployment 1',
    parkName: 'Demo park',
    latitude: 51.7592,
    longitude: 19.456,
    installedAt: '2026-10-01T08:00:00.000Z',
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 'f576207b-8d06-497a-97da-f4958a96908d',
    deviceId: 'esp32-test-002',
    name: 'Test deployment 2',
    parkName: 'Demo park',
    latitude: 51.76,
    longitude: 19.46,
    installedAt: '2026-10-02T08:00:00.000Z',
    createdAt: '2026-10-02T08:00:00.000Z',
  },
];

describe('SensorsService', () => {
  let service: SensorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SensorsService],
    }).compile();

    service = module.get<SensorsService>(SensorsService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return all sensors', () => {
    const result = service.getAll();
    expect(result).toEqual(expectedSensors);
  });

  it.each(expectedSensors)('should return sensor $deviceId', (sensor) => {
    expect(service.getOne(sensor.id)).toEqual(sensor);
  });

  it('should return undefined for an unknown sensor', () => {
    expect(service.getOne('00000000-0000-4000-8000-000000000000')).toBeUndefined();
  });

  it('should protect stored sensors from changes to the returned list', () => {
    const sensors = service.getAll();
    Object.assign(sensors[0], { name: 'Changed name' });
    sensors.pop();

    expect(service.getAll()).toEqual(expectedSensors);
  });

  it('should protect a stored sensor from changes to a lookup result', () => {
    const sensor = service.getOne(expectedSensors[0].id);
    expect(sensor).toBeDefined();
    Object.assign(sensor!, { name: 'Changed name' });

    expect(service.getOne(expectedSensors[0].id)).toEqual(expectedSensors[0]);
  });

  it('should create a new sensor', () => {
    const now = new Date('2026-11-03T10:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const createSensorDto: CreateSensorDto = {
      deviceId: 'esp-test-003',
      name: 'Test deployment 3',
      parkName: 'Demo park 1',
      latitude: 50.234,
      longitude: 1.254,
      installedAt: '2026-10-02T08:00:00.000Z',
    };

    const result = service.create(createSensorDto);
    expect(result).toEqual({
      ...createSensorDto,
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
      createdAt: now.toISOString(),
    });
    expect(expectedSensors.map((sensor) => sensor.id)).not.toContain(result.id);
    expect(service.getAll()).toEqual([...expectedSensors, result]);
    expect(service.getOne(result.id)).toEqual(result);
  });

});
