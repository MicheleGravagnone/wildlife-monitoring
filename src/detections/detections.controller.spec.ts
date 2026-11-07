import { NotFoundException } from '@nestjs/common';
import { DetectionsController } from './detections.controller.js';
import { DetectionsService } from './detections.service.js';
import {
  detection,
  detectionInput,
  recordId,
} from '../../test/support/fixtures.js';

describe('DetectionsController', () => {
  let controller: DetectionsController;
  const service = { getAll: vi.fn(), getOne: vi.fn(), create: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    controller = new DetectionsController(
      service as unknown as DetectionsService,
    );
  });

  it('returns the service list', async () => {
    service.getAll.mockResolvedValue([detection]);
    await expect(controller.getAll()).resolves.toEqual([detection]);
  });

  it('looks up the requested record', async () => {
    service.getOne.mockResolvedValue(detection);
    await expect(controller.getOne(recordId)).resolves.toEqual(detection);
    expect(service.getOne).toHaveBeenCalledExactlyOnceWith(recordId);
  });

  it('returns 404 for a missing record', async () => {
    service.getOne.mockResolvedValue(null);
    await expect(controller.getOne(recordId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('passes creation input to the service', async () => {
    service.create.mockResolvedValue(detection);
    await expect(controller.create(detectionInput)).resolves.toEqual(detection);
    expect(service.create).toHaveBeenCalledExactlyOnceWith(detectionInput);
  });
});