import { NotFoundException } from '@nestjs/common';
import { DeploymentsController } from './deployments.controller.js';
import { DeploymentsService } from './deployments.service.js';
import {
  deployment,
  deploymentInput,
  recordId,
} from '../../test/support/fixtures.js';

describe('DeploymentsController', () => {
  let controller: DeploymentsController;
  const service = { getAll: vi.fn(), getOne: vi.fn(), create: vi.fn() };

  beforeEach(() => {
    vi.resetAllMocks();
    controller = new DeploymentsController(
      service as unknown as DeploymentsService,
    );
  });

  it('returns the service list', async () => {
    service.getAll.mockResolvedValue([deployment]);
    await expect(controller.getAll()).resolves.toEqual([deployment]);
  });

  it('looks up the requested record', async () => {
    service.getOne.mockResolvedValue(deployment);
    await expect(controller.getOne(recordId)).resolves.toEqual(deployment);
    expect(service.getOne).toHaveBeenCalledExactlyOnceWith(recordId);
  });

  it('returns 404 for a missing record', async () => {
    service.getOne.mockResolvedValue(null);
    await expect(controller.getOne(recordId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('passes creation input to the service', async () => {
    service.create.mockResolvedValue(deployment);
    await expect(controller.create(deploymentInput)).resolves.toEqual(
      deployment,
    );
    expect(service.create).toHaveBeenCalledExactlyOnceWith(deploymentInput);
  });
});