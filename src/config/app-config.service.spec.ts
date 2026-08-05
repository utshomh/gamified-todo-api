import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { AppConfigService } from './app-config.service';

describe('AppConfigService', () => {
  let service: AppConfigService;

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

  describe('port', () => {
    it('should return the configured port', () => {
      getMock.mockReturnValue(3000);

      expect(service.port).toBe(3000);
      expect(getMock).toHaveBeenCalledWith('PORT', { infer: true });
    });
  });

  describe('databaseUrl', () => {
    it('should return the database url', () => {
      getMock.mockReturnValue('postgres://localhost:5432/app');

      expect(service.databaseUrl).toBe('postgres://localhost:5432/app');
      expect(getMock).toHaveBeenCalledWith('DATABASE_URL', {
        infer: true,
      });
    });
  });

  describe('isProduction', () => {
    it('should return true when NODE_ENV is production', () => {
      getMock.mockReturnValue('production');

      expect(service.isProduction).toBe(true);
    });

    it('should return false when NODE_ENV is development', () => {
      getMock.mockReturnValue('development');

      expect(service.isProduction).toBe(false);
    });
  });
});
