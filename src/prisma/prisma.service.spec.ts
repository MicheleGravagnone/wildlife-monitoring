import { PrismaService } from './prisma.service.js';

describe('PrismaService', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('requires a database URL', () => {
    vi.stubEnv('DATABASE_URL', '');
    expect(() => new PrismaService()).toThrow('DATABASE_URL is required');
  });

  it('connects and disconnects with the application lifecycle', async () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://test:test@localhost:5432/test');
    const service = new PrismaService();
    const connect = vi.spyOn(service, '$connect').mockResolvedValue();
    const disconnect = vi.spyOn(service, '$disconnect').mockResolvedValue();
    await service.onModuleInit();
    await service.onModuleDestroy();
    expect(connect).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});