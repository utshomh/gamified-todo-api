import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from './prisma.service';
import { AppConfigService } from '../config/app-config.service';

describe('PrismaService', () => {
  let service: PrismaService;

  const getMock = jest.fn();

  beforeEach(async () => {
    getMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: getMock,
          },
        },
      ],
    }).compile();

    service = module.get(AppConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
