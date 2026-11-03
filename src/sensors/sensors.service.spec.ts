import { Test, TestingModule } from '@nestjs/testing';
import { SensorsService } from './sensors.service.js';
import type { Sensor } from './types/sensor.type.js';

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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return all sensors', () => {
    const result = service.getAll();
    expect(result).toEqual(expectedSensors);
  });

  it('should return the specified sensor', () => {
    const index = Math.floor(Math.random() * expectedSensors.length - 1);
    const result = service.getOne(expectedSensors[index].id);

    expect(result).toEqual(expectedSensors[index]);
  });
});
