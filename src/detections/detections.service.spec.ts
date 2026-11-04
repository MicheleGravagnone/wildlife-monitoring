import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DeploymentsService } from '../deployments/deployments.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import { DetectionsService } from './detections.service.js';
import type { Detection } from './types/detection.type.js';
import { ClassificationStatus } from './enums/classification-status.enum.js';
import type { CreateDetectionDto } from './dto/create-detection.dto.js';

const expectedDetections: Array<Detection> = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    eventId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    deploymentId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
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
    deploymentId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    capturedAt: '2026-11-01T06:15:00.000Z',
    classificationStatus: ClassificationStatus.IDENTIFIED,
    speciesLabel: 'Wild boar',
    confidence: 0.89,
    imageKey: 'detections/test/wild-boar.jpg',
    modelVersion: 'test-v1',
    classifiedAt: '2026-11-01T06:15:02.000Z',
    createdAt: '2026-11-01T06:15:03.000Z',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    eventId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
    deploymentId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    capturedAt: '2026-11-01T18:45:00.000Z',
    classificationStatus: ClassificationStatus.UNKNOWN,
    speciesLabel: null,
    confidence: null,
    imageKey: 'detections/test/unknown.jpg',
    modelVersion: 'test-v1',
    classifiedAt: '2026-11-01T18:45:02.000Z',
    createdAt: '2026-11-01T18:45:03.000Z',
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    eventId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
    deploymentId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    capturedAt: '2026-11-01T19:10:00.000Z',
    classificationStatus: ClassificationStatus.NO_ANIMAL,
    speciesLabel: null,
    confidence: 0.99,
    imageKey: null,
    modelVersion: 'test-v1',
    classifiedAt: '2026-11-01T19:10:02.000Z',
    createdAt: '2026-11-01T19:10:03.000Z',
  },
];

import { DeploymentsModule } from '../deployments/deployments.module.js';

describe('DetectionsService', () => {
  let service: DetectionsService;
  let deployments: DeploymentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [DeploymentsModule],
      providers: [DetectionsService],
    }).compile();

    service = module.get<DetectionsService>(DetectionsService);
    deployments = module.get<DeploymentsService>(DeploymentsService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return all detections', () => {
    const result = service.getAll();
    expect(result).toEqual(expectedDetections);
  });

  it.each(expectedDetections)('should return detection $id', (sensor) => {
    expect(service.getOne(sensor.id)).toEqual(sensor);
  });

  it('should return undefined for an unknown id', () => {
    expect(
      service.getOne('00000000-0000-4000-8000-000000000000'),
    ).toBeUndefined();
  });

  it('should protect stored detections from changes to the returned list', () => {
    const sensors = service.getAll();
    Object.assign(sensors[0], { speciesLabel: 'Changed species' });
    sensors.pop();

    expect(service.getAll()).toEqual(expectedDetections);
  });

  it('should protect a stored detection from changes to a lookup result', () => {
    const sensor = service.getOne(expectedDetections[0].id);
    expect(sensor).toBeDefined();
    if (!sensor) throw new Error('Expected seeded detection');
    Object.assign(sensor, { speciesLabel: 'Changed species' });

    expect(service.getOne(expectedDetections[0].id)).toEqual(
      expectedDetections[0],
    );
  });

  it('should create a new detection', () => {
    const now = new Date('2026-11-03T10:00:00.000Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const createDetectionDto = {
      eventId: 'aaabbaaa-abba-4aaa-8aaa-bbaaaaaaaaa1',
      deploymentId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      capturedAt: '2026-11-01T06:15:00.000Z',
      classificationStatus: ClassificationStatus.IDENTIFIED,
      speciesLabel: 'Wild squirrel',
      confidence: 0.98,
      imageKey: 'detections/test/wild-squirrel.jpg',
      modelVersion: 'test-v1',
      classifiedAt: '2026-11-01T06:15:02.000Z',
    } satisfies CreateDetectionDto;

    const result = service.create(createDetectionDto);
    expect(result).toEqual({
      ...createDetectionDto,
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
      createdAt: now.toISOString(),
    });
    expect(expectedDetections.map((sensor) => sensor.id)).not.toContain(
      result.id,
    );
    expect(service.getAll()).toEqual([...expectedDetections, result]);
    expect(service.getOne(result.id)).toEqual(result);
  });

  it('keeps historical detections attached to their original deployment when a sensor moves', () => {
    const previous = service.getAll();
    const deployment = deployments.getOne(previous[0].deploymentId);
    if (!deployment) throw new Error('Expected seeded deployment');
    deployments.create({
      sensorId: deployment.sensorId,
      name: 'Moved deployment',
      parkName: 'Another park',
      latitude: 52,
      longitude: 20,
      installedAt: '2026-11-04T08:00:00.000Z',
    });
    expect(service.getAll()).toEqual(previous);
    expect(deployments.getOne(previous[0].deploymentId)).toEqual(deployment);
  });

  it('rejects detections for an unknown deployment without storing them', () => {
    const { id: _id, createdAt: _createdAt, ...dto } = expectedDetections[0];
    expect(() =>
      service.create({
        ...dto,
        deploymentId: '00000000-0000-4000-8000-000000000000',
      }),
    ).toThrow(NotFoundException);
    expect(service.getAll()).toEqual(expectedDetections);
  });

  it('rejects captures before deployment installation', () => {
    const { id: _id, createdAt: _createdAt, ...dto } = expectedDetections[0];
    expect(() =>
      service.create({ ...dto, capturedAt: '2026-09-01T00:00:00.000Z' }),
    ).toThrow(BadRequestException);
    expect(service.getAll()).toEqual(expectedDetections);
  });
});