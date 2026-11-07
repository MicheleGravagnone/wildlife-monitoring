import { NotFoundException } from '@nestjs/common';
import { SensorsController } from './sensors.controller.js';
import { SensorsService } from './sensors.service.js';
import { sensor, sensorInput, recordId } from '../../test/support/fixtures.js';

describe('SensorsController', () => {
  let controller: SensorsController;
  const service = { getAll: vi.fn(), getOne: vi.fn(), create: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    controller = new SensorsController(service as unknown as SensorsService);
  });

  it('returns the service list', async () => {
    service.getAll.mockResolvedValue([sensor]);
    await expect(controller.getAll()).resolves.toEqual([sensor]);
  });

  it('looks up the requested record', async () => {
    service.getOne.mockResolvedValue(sensor);
    await expect(controller.getOne(recordId)).resolves.toEqual(sensor);
    expect(service.getOne).toHaveBeenCalledExactlyOnceWith(recordId);
  });

  it('returns 404 for a missing record', async () => {
    service.getOne.mockResolvedValue(null);
    await expect(controller.getOne(recordId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('passes creation input to the service', async () => {
    service.create.mockResolvedValue(sensor);
    await expect(controller.create(sensorInput)).resolves.toEqual(sensor);
    expect(service.create).toHaveBeenCalledExactlyOnceWith(sensorInput);
  });
});
