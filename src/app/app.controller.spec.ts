import { Test, TestingModule } from '@nestjs/testing';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const frozenDate = new Date(Date.UTC(2011, 0, 1, 0, 0, 0));

    jest.useFakeTimers();
    jest.setSystemTime(frozenDate);

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('status', () => {
    it('should return server status', () => {
      expect(appController.getStatus()).toEqual({
        status: 'ok',
        version: '1',
        timestamp: '2011-01-01T00:00:00.000Z',
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
});
