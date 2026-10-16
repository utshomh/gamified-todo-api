import { Test } from '@nestjs/testing';

import { PrismaService } from './prisma.service';
import { AppConfigService } from '../config/app-config.service';

describe('PrismaService', () => {
  it('constructs the actual Prisma provider and disconnects on shutdown', async () => {
    const module = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: AppConfigService,
          useValue: {
            databaseUrl: 'postgresql://test:test@localhost:5432/test',
          },
        },
      ],
    }).compile();

    const service = module.get(PrismaService);

    // Prisma returns a proxy, so instanceof is not a reliable provider check.
    expect(typeof service.onModuleDestroy).toBe('function');

    const disconnect = jest.spyOn(service, '$disconnect').mockResolvedValue();

    await module.close();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
