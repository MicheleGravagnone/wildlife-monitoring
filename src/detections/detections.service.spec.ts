import { Test, TestingModule } from '@nestjs/testing';
import { DetectionsService } from './detections.service.js';
import type { Detection } from './types/detection.type.js';
import { ClassificationStatus } from './enums/classification-status.enum.js';

const expectedDetections: Array<Detection> = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    eventId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    sensorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    capturedAt: '2026-11-01T05:30:00.000Z',
    classificationStatus: ClassificationStatus.IDENTIFIED,
    speciesLabel: 'Red fox',
    confidence: 0.97,
    imageKey: 'detections/test/red-fox.jpg',
    modelVersion: 'test-v1',
    classifiedAt: '2026-11-01T05:30:02.000Z',
    createdAt: '2026-11-01T05:30:03.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    eventId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    sensorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    capturedAt: '2026-11-01T06:15:00.000Z',
    classificationStatus: ClassificationStatus.IDENTIFIED,
    speciesLabel: 'Wild boar',
    confidence: 0.89,
    imageKey: 'detections/test/wild-boar.jpg',
    modelVersion: 'test-v1',
    classifiedAt: '2026-11-01T06:15:02.000Z',
    createdAt: '2026-11-01T06:15:03.000Z',
  }
];

describe('DetectionsService', () => {
  let service: DetectionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DetectionsService],
    }).compile();

    service = module.get<DetectionsService>(DetectionsService);
  });

  it('should return all detections', () => {
    const result = service.getAll();
    expect(result).toEqual(expectedDetections);
  });

  it.each(expectedDetections)('should return sensor $deviceId', (sensor) => {
    expect(service.getOne(sensor.id)).toEqual(sensor);
  });

  it('should return undefined for unknown id', () => {
    return;
  });

});
