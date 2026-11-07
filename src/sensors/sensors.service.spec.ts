import { ConflictException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SensorsService } from './sensors.service.js';
import { sensor, sensorInput, recordId } from '../../test/support/fixtures.js';

describe('SensorsService', () => {
  const delegate = { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() };
  let service: SensorsService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new SensorsService({
      sensor: delegate,
    } as unknown as PrismaService);
  });

  it('returns database records', async () => {
    delegate.findMany.mockResolvedValue([sensor]);
    await expect(service.getAll()).resolves.toEqual([sensor]);
  });

  it('looks up the requested ID and preserves a missing result', async () => {
    delegate.findUnique.mockResolvedValue(null);
    await expect(service.getOne(recordId)).resolves.toBeNull();
    expect(delegate.findUnique).toHaveBeenCalledWith({
      where: { id: recordId },
    });
  });

  it('returns the persisted record including database-generated fields', async () => {
    delegate.create.mockResolvedValue(sensor);
    await expect(service.create(sensorInput)).resolves.toEqual(sensor);
    expect(delegate.create).toHaveBeenCalledWith({ data: sensorInput });
  });

  it('translates unique constraint violations to HTTP conflicts', async () => {
    delegate.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
        code: 'P2002',
        clientVersion: '7.10.1',
      }),
    );
    await expect(service.create(sensorInput)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('preserves other database errors', async () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Database request failed',
      { code: 'P2003', clientVersion: '7.10.1' },
    );
    delegate.create.mockRejectedValue(error);
    await expect(service.create(sensorInput)).rejects.toBe(error);
  });
});
