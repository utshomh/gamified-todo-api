import { envSchema } from './env.schema';

describe('environment validation', () => {
  const base = {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_HOST: 'localhost',
    JWT_ACCESS_SECRET: 'a'.repeat(32),
    JWT_REFRESH_SECRET: 'b'.repeat(32),
  };

  it('defaults both TTLs in seconds', () => {
    expect(envSchema.parse(base)).toMatchObject({
      JWT_ACCESS_TTL: 900,
      JWT_REFRESH_TTL: 604800,
    });
  });

  it.each([0, -1, 1.5, 'invalid'])('rejects invalid TTL %s', (value) => {
    expect(
      envSchema.safeParse({ ...base, JWT_ACCESS_TTL: value }).success,
    ).toBe(false);

    expect(
      envSchema.safeParse({ ...base, JWT_REFRESH_TTL: value }).success,
    ).toBe(false);
  });
});
