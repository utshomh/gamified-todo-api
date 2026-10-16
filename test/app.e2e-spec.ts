import { z } from 'zod';
import request from 'supertest';
import type { App } from 'supertest/types';

import { Test } from '@nestjs/testing';
import { type INestApplication } from '@nestjs/common';

import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { configureApp, createOpenApiDocument } from '../src/app/setup-app';

describe('HTTP bootstrap and contracts', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({ $queryRaw: () => Promise.resolve([{ ready: 1 }]) })
      .compile();
    app = module.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('serves versioned status with the success envelope', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/app/status')
      .expect(200)
      .expect(({ body }: { body: unknown }) => {
        const envelope = z
          .object({ timestamp: z.iso.datetime() })
          .passthrough()
          .parse(body);

        const { timestamp, ...rest } = envelope;

        expect(timestamp).toBeDefined();

        expect(rest).toEqual({
          success: true,
          path: '/api/v1/app/status',
          data: { service: 'gamified-todo-api', status: 'ok', version: '1' },
        });
      });
  });

  it('rejects unversioned routes', async () => {
    await request(app.getHttpServer()).get('/app/status').expect(404);
  });

  it('validates request bodies and rejects unknown fields', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/app/ping')
      .send({ message: 'bad' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/app/ping')
      .send({ message: 'ping', extra: true })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/app/ping')
      .send({ message: 'ping' })
      .expect(201);
  });

  it('serves health', async () => {
    await request(app.getHttpServer()).get('/api/v1/app/health').expect(200);
  });

  it('returns 401 for malformed refresh tokens', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/rotate-token')
      .send({ refreshToken: 'invalid' })
      .expect(401)
      .expect(({ body }: { body: unknown }) => {
        expect(body).toMatchObject({ success: false, code: 'UNAUTHORIZED' });
      });
  });

  it('documents actual success statuses and user errors', () => {
    const doc = createOpenApiDocument(app);

    expect(
      Object.keys(doc.paths['/api/v1/auth/register']?.post?.responses ?? {}),
    ).toContain('201');

    expect(
      Object.keys(doc.paths['/api/v1/auth/login']?.post?.responses ?? {}),
    ).toContain('200');

    expect(
      Object.keys(
        doc.paths['/api/v1/auth/rotate-token']?.post?.responses ?? {},
      ),
    ).toContain('200');

    expect(
      Object.keys(doc.paths['/api/v1/user/me']?.get?.responses ?? {}),
    ).toContain('404');
  });
});
