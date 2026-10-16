import { z } from 'zod';
import request from 'supertest';
import type { App } from 'supertest/types';

import { Test } from '@nestjs/testing';
import { type INestApplication, Logger } from '@nestjs/common';

import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { configureApp, createOpenApiDocument } from '../src/app/setup-app';

describe('HTTP bootstrap and contracts', () => {
  let app: INestApplication<App>;
  const databaseFailure = new Error('Database connection refused', {
    cause: new Error('Socket closed'),
  });

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: () => Promise.resolve([{ ready: 1 }]),
        user: { findUnique: () => Promise.reject(databaseFailure) },
      })
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

  const badRequestSchema = z
    .object({
      success: z.literal(false),
      statusCode: z.literal(400),
      code: z.literal('BAD_REQUEST'),
      message: z.string(),
      details: z.object({ errors: z.array(z.string()) }).strict(),
      timestamp: z.iso.datetime(),
      path: z.string(),
    })
    .strict();

  it('returns the exact typed validation error payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/app/ping')
      .send({ message: 'bad' })
      .expect(400);

    const error = badRequestSchema.parse(response.body as unknown);

    expect(error.details.errors).toEqual(['message must be equal to ping']);

    expect(response.headers['x-request-id']).toEqual(expect.any(String));
  });

  it('returns typed details for malformed JSON too', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/app/ping')
      .set('Content-Type', 'application/json')
      .send('{invalid')
      .expect(400);

    expect(
      badRequestSchema.parse(response.body as unknown).details.errors.length,
    ).toBeGreaterThan(0);

    expect(response.headers['x-request-id']).toEqual(expect.any(String));
  });

  it('logs server error diagnostics with the response request ID', async () => {
    const log = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    try {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'test@example.com', password: 'Password@123' })
        .expect(500);

      const body: unknown = response.body;

      expect(body).toMatchObject({
        success: false,
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      });

      expect(body).not.toHaveProperty('details');

      const requestId: unknown = response.headers['x-request-id'];

      expect(typeof requestId).toBe('string');

      expect(log).toHaveBeenCalledWith(
        `[${String(requestId)}] POST /api/v1/auth/login 500 INTERNAL_ERROR`,
        expect.stringContaining('Database connection refused'),
      );

      const output = JSON.stringify(log.mock.calls);

      expect(output).toContain('Socket closed');
      expect(output).toContain('app.e2e-spec.ts');
      expect(output).not.toContain('Password@123');
    } finally {
      log.mockRestore();
    }
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

    const badRequest = doc.components?.schemas?.ApiBadRequestErrorResponseDto;

    expect(badRequest).toHaveProperty(
      'properties.details.$ref',
      '#/components/schemas/ValidationErrorDetailsDto',
    );

    expect(badRequest).toHaveProperty(
      'required',
      expect.arrayContaining(['details']),
    );

    expect(doc.components?.schemas?.ValidationErrorDetailsDto).toHaveProperty(
      'properties.errors',
      {
        type: 'array',
        items: { type: 'string' },
        example: ['message must be equal to ping'],
      },
    );

    expect(doc.components?.schemas?.ApiErrorResponseDto).not.toHaveProperty(
      'properties.details',
    );

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
