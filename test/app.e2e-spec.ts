import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from '../src/app/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/v1/app/status (GET)', () => {
    return request(app.getHttpServer()).get('/app/status').expect(200);
  });
  it('/api/v1/app/ping (POST)', () => {
    return request(app.getHttpServer())
      .post('/app/ping')
      .send({ message: 'ping' })
      .expect(201);
  });
  it('/api/v1/app/health (GET)', () => {
    return request(app.getHttpServer()).get('/app/health').expect(200);
  });

  afterEach(async () => {
    await app.close();
  });
});
