import { NotFoundException } from '@nestjs/common';
import { SensorsController } from './sensors.controller.js';
import { SensorsService } from './sensors.service.js';

describe('SensorsController', () => {
  const sensor = new SensorsService().getAll()[0];
  let controller: SensorsController;
  let service: Pick<SensorsService, 'getAll' | 'getOne' | 'create'>;

  beforeEach(() => {
    service = {
      getAll: vi.fn().mockReturnValue([sensor]),
      getOne: vi.fn().mockReturnValue(sensor),
      create: vi.fn().mockReturnValue(sensor),
    };
    controller = new SensorsController(service as SensorsService);
  });

  it('returns the service list', () => {
    expect(controller.getAll()).toEqual([sensor]);
    expect(service.getAll).toHaveBeenCalledExactlyOnceWith();
  });

  it('passes the requested ID to the service', () => {
    expect(controller.getOne(sensor.id)).toEqual(sensor);
    expect(service.getOne).toHaveBeenCalledExactlyOnceWith(sensor.id);
  });

  it('throws NotFoundException for an unknown sensor', () => {
    vi.mocked(service.getOne).mockReturnValue(undefined);
    expect(() => controller.getOne(sensor.id)).toThrow(NotFoundException);
  });

  it('passes creation data to the service', () => {
    const { id: _id, createdAt: _createdAt, ...dto } = sensor;
    expect(controller.create(dto)).toEqual(sensor);
    expect(service.create).toHaveBeenCalledExactlyOnceWith(dto);
  });
});
