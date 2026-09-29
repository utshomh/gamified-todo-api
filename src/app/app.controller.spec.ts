import { Test, TestingModule } from '@nestjs/testing';

import { AppService } from './app.service';
import { AppController } from './app.controller';

import { PrismaService } from '../prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;

  const prismaMock = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const frozenDate = new Date(Date.UTC(2004, 6, 9, 0, 0, 0));

    jest.useFakeTimers();
    jest.setSystemTime(frozenDate);

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: PrismaService, useValue: prismaMock }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('status', () => {
    it('should return server status', () => {
      expect(appController.getStatus()).toEqual({
        service: 'gamified-todo-api',
        status: 'ok',
        version: '1',
      });
    });
  });

  describe('ping', () => {
    it('should return pong', () => {
      expect(appController.pong({ message: 'ping' })).toEqual({
        message: 'pong',
      });
    });
  });

  describe('health', () => {
    it('should be all ok', async () => {
      prismaMock.$queryRaw.mockResolvedValue([{ ready: 1 }]);

      await expect(appController.health()).resolves.toEqual({
        up: true,
        databaseIsReady: true,
      });
    });
  });
});
