const { mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

require('reflect-metadata');

// Schema generation never connects to a database or needs application secrets.
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://schema:schema@localhost:1/unused',
  REDIS_HOST: 'localhost',
  JWT_ACCESS_SECRET: 'schema-access-'.repeat(4),
  JWT_REFRESH_SECRET: 'schema-refresh-'.repeat(4),
  JWT_ACCESS_TTL: '900',
  JWT_REFRESH_TTL: '604800',
});

const { NestFactory } = require('@nestjs/core');

const { AppModule } = require('../dist/src/app/app.module');

const {
  configureApp,
  createOpenApiDocument,
} = require('../dist/src/app/setup-app');

(async () => {
  const app = await NestFactory.create(AppModule, {
    logger: false,
    abortOnError: false,
  });

  try {
    configureApp(app);

    const output = JSON.stringify(createOpenApiDocument(app), null, 2) + '\n';
    const file = resolve(__dirname, '../api/openapi.json');

    if (process.argv.includes('--check')) {
      if (readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== output)
        throw new Error('OpenAPI contract is stale. Run pnpm api:generate.');
    } else {
      mkdirSync(resolve(__dirname, '../api'), { recursive: true });
      writeFileSync(file, output);
    }
  } finally {
    await app.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
