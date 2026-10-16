import { z } from 'zod';
import { hash } from 'argon2';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import type { App } from 'supertest/types';

import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { type INestApplication } from '@nestjs/common';

import { AppModule } from '../src/app/app.module';
import { configureApp } from '../src/app/setup-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthSessionService } from '../src/modules/auth/auth-session.service';
import { JwtTokenService } from '../src/modules/auth/jwt/jwt-token.service';
import { AppConfigService } from '../src/config/app-config.service';

const publicUserSchema = z
  .object({
    id: z.string(),
    email: z.string(),
    displayName: z.string(),
    timezone: z.string(),
  })
  .strict();

const pairSchema = z
  .object({ accessToken: z.string(), refreshToken: z.string() })
  .strict();

const successSchema = z
  .object({
    success: z.literal(true),
    timestamp: z.iso.datetime(),
    path: z.string(),
    data: z.unknown(),
  })
  .strict();

describe('Authentication against PostgreSQL', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let tokens: JwtTokenService;
  let sessions: AuthSessionService;

  const emails: string[] = [];

  const registration = () => {
    const email = `test-${randomUUID()}@example.test`;
    emails.push(email);
    return {
      email,
      displayName: 'TestUser',
      password: 'Password@123',
      timezone: 'Asia/Dhaka',
    };
  };

  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL)
      throw new Error(
        'Set TEST_DATABASE_URL to a dedicated, migrated test database.',
      );

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication({ logger: false });

    configureApp(app);

    await app.init();

    prisma = app.get(PrismaService);
    tokens = app.get(JwtTokenService);
    sessions = app.get(AuthSessionService);
  });

  afterAll(async () => {
    try {
      if (prisma)
        await prisma.user.deleteMany({ where: { email: { in: emails } } });
    } finally {
      await app?.close();
    }
  });

  async function registerAndLogin() {
    const dto = registration();

    const registered = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(dto)
      .expect(201);

    const user = publicUserSchema.parse(
      successSchema.parse(registered.body as unknown).data,
    );

    const loggedIn = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: dto.email, password: dto.password })
      .expect(200);

    const pair = pairSchema.parse(
      successSchema.parse(loggedIn.body as unknown).data,
    );

    return { ...pair, user, dto };
  }

  it('returns only documented user fields, including /me', async () => {
    const { accessToken, user } = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .get('/api/v1/user/me')
      .auth(accessToken, { type: 'bearer' })
      .expect(200);

    expect(
      publicUserSchema.parse(
        successSchema.parse(response.body as unknown).data,
      ),
    ).toEqual(user);
  });

  it('rejects wrong passwords and unknown accounts', async () => {
    const { dto } = await registerAndLogin();

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: dto.email, password: 'Wrong@123' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'missing@example.test', password: 'Wrong@123' })
      .expect(401);
  });

  it('returns one 201 and one 409 for concurrent registration', async () => {
    const dto = registration();

    const responses = await Promise.all(
      [0, 1].map(() =>
        request(app.getHttpServer()).post('/api/v1/auth/register').send(dto),
      ),
    );

    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
  });

  it('rejects token cross-use through HTTP', async () => {
    const pair = await registerAndLogin();

    await request(app.getHttpServer())
      .get('/api/v1/user/me')
      .auth(pair.refreshToken, { type: 'bearer' })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/v1/auth/rotate-token')
      .send({ refreshToken: pair.accessToken })
      .expect(401);
  });

  it('rotates once, rejects replay and invalidates the old access session', async () => {
    const pair = await registerAndLogin();

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/rotate-token')
      .send({ refreshToken: pair.refreshToken })
      .expect(200);

    const next = pairSchema.parse(
      successSchema.parse(response.body as unknown).data,
    );

    await request(app.getHttpServer())
      .post('/api/v1/auth/rotate-token')
      .send({ refreshToken: pair.refreshToken })
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/v1/user/me')
      .auth(pair.accessToken, { type: 'bearer' })
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/v1/user/me')
      .auth(next.accessToken, { type: 'bearer' })
      .expect(200);

    const oldClaims = await tokens.verifyRefreshToken(pair.refreshToken);
    const newClaims = await tokens.verifyRefreshToken(next.refreshToken);

    const old = await prisma.authSession.findUniqueOrThrow({
      where: { id: oldClaims.sessionId },
    });

    const current = await prisma.authSession.findUniqueOrThrow({
      where: { id: newClaims.sessionId },
    });

    expect(old.replacedById).toBe(current.id);
    expect(old.revokedAt).not.toBeNull();
    expect(current.expiresAt.getTime()).toBe(newClaims.exp * 1000);
    expect(newClaims.exp - newClaims.iat).toBe(604800);
  });

  it('allows only one concurrent refresh and creates only one replacement', async () => {
    const pair = await registerAndLogin();

    const responses = await Promise.all(
      [0, 1].map(() =>
        request(app.getHttpServer())
          .post('/api/v1/auth/rotate-token')
          .send({ refreshToken: pair.refreshToken }),
      ),
    );

    expect(responses.map((r) => r.status).sort()).toEqual([200, 401]);

    expect(
      await prisma.authSession.count({ where: { userId: pair.user.id } }),
    ).toBe(2);
  });

  it.each(['revoked', 'expired', 'hash mismatch', 'missing'] as const)(
    'rejects a %s session',

    async (state) => {
      const pair = await registerAndLogin();
      const claims = await tokens.verifyRefreshToken(pair.refreshToken);
      const where = { id: claims.sessionId };

      if (state === 'missing') await prisma.authSession.delete({ where });
      else
        await prisma.authSession.update({
          where,
          data:
            state === 'revoked'
              ? { revokedAt: new Date() }
              : state === 'expired'
                ? { expiresAt: new Date(0) }
                : { tokenHash: await hash('different-token') },
        });

      await request(app.getHttpServer())
        .post('/api/v1/auth/rotate-token')
        .send({ refreshToken: pair.refreshToken })
        .expect(401);

      if (state !== 'hash mismatch')
        await request(app.getHttpServer())
          .get('/api/v1/user/me')
          .auth(pair.accessToken, { type: 'bearer' })
          .expect(401);
    },
  );

  it('rejects correctly signed tokens with a different session owner', async () => {
    const pair = await registerAndLogin();
    const claims = await tokens.verifyRefreshToken(pair.refreshToken);

    const forged = await tokens.generateTokenPair({
      userId: 'another-user',
      sessionId: claims.sessionId,
    });

    await request(app.getHttpServer())
      .post('/api/v1/auth/rotate-token')
      .send({ refreshToken: forged.refreshToken })
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/v1/user/me')
      .auth(forged.accessToken, { type: 'bearer' })
      .expect(401);
  });

  it('rejects signed access tokens with missing identity fields', async () => {
    const config = app.get(AppConfigService);

    const invalid = await new JwtService().signAsync(
      { tokenType: 'access', sessionId: 'session' },
      { secret: config.jwtAccessSecret, expiresIn: 900 },
    );

    await request(app.getHttpServer())
      .get('/api/v1/user/me')
      .auth(invalid, { type: 'bearer' })
      .expect(401);
  });

  it('rolls back consumption if replacement creation fails', async () => {
    const pair = await registerAndLogin();
    const claims = await tokens.verifyRefreshToken(pair.refreshToken);
    const old = await sessions.requireActiveSession(claims);

    await expect(
      sessions.rotateSession(
        { ...claims, tokenHash: old.tokenHash },
        {
          userId: 'nonexistent-user',
          sessionId: randomUUID(),
          tokenHash: old.tokenHash,
          expiresAt: old.expiresAt,
        },
      ),
    ).rejects.toThrow();

    const unchanged = await sessions.requireActiveSession(claims);

    expect(unchanged.replacedById).toBeNull();

    await request(app.getHttpServer())
      .post('/api/v1/auth/rotate-token')
      .send({ refreshToken: pair.refreshToken })
      .expect(200);
  });
});
