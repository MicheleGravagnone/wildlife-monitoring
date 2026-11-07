import { ConflictException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DetectionsService } from './detections.service.js';
import {
  detection,
  detectionInput,
  recordId,
} from '../../test/support/fixtures.js';

describe('DetectionsService', () => {
  const delegate = { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() };
  let service: DetectionsService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new DetectionsService({
      detection: delegate,
    } as unknown as PrismaService);
  });

  it('returns database records', async () => {
    delegate.findMany.mockResolvedValue([detection]);
    await expect(service.getAll()).resolves.toEqual([detection]);
  });

  it('looks up the requested ID and preserves a missing result', async () => {
    delegate.findUnique.mockResolvedValue(null);
    await expect(service.getOne(recordId)).resolves.toBeNull();
    expect(delegate.findUnique).toHaveBeenCalledWith({
      where: { id: recordId },
    });
  });

  it('returns the persisted record including database-generated fields', async () => {
    delegate.create.mockResolvedValue(detection);
    await expect(service.create(detectionInput)).resolves.toEqual(detection);
    expect(delegate.create).toHaveBeenCalledWith({
      data: { ...detectionInput, imageKey: null },
    });
  });

  it('translates unique constraint violations to HTTP conflicts', async () => {
    delegate.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint violation', {
        code: 'P2002',
        clientVersion: '7.10.1',
      }),
    );
    await expect(service.create(detectionInput)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('preserves other database errors', async () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Database request failed',
      { code: 'P2003', clientVersion: '7.10.1' },
    );
    delegate.create.mockRejectedValue(error);
    await expect(service.create(detectionInput)).rejects.toBe(error);
  });
});