// Explicit test configuration prevents reads or writes against a developer's database.
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL:
    process.env.TEST_DATABASE_URL ??
    'postgresql://test:test@localhost:1/unused',
  REDIS_HOST: 'localhost',
  JWT_ACCESS_SECRET: 'test-access-secret-'.repeat(3),
  JWT_REFRESH_SECRET: 'test-refresh-secret-'.repeat(3),
  JWT_ACCESS_TTL: '900',
  JWT_REFRESH_TTL: '604800',
});
