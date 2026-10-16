import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app/app.module';

import { AppConfigService } from './config/app-config.service';

import { configureApp, createOpenApiDocument } from './app/setup-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  SwaggerModule.setup('docs', app, createOpenApiDocument(app), {
    jsonDocumentUrl: 'docs/openapi.json',
  });

  const appConfig = app.get(AppConfigService);

  await app.listen(appConfig.port);

  const url = appConfig.appUrl ?? (await app.getUrl());

  const logger = new Logger('Bootstrap');

  logger.log(`Starting the server at: ${url}`);
  logger.log(`API doc is available at: ${url}/docs`);
}

bootstrap().catch((error: unknown) => {
  new Logger('Bootstrap').error(
    'Failed to start the API',
    error instanceof Error ? error.stack : String(error),
  );
  process.exitCode = 1;
});
