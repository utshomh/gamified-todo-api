import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app/app.module';
import { AppConfigService } from './config/app-config.service';

import { AppExceptionFilter } from './common/errors/app-exception.filter';
import { ApiSuccessInterceptor } from './common/responses/api-success.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const appConfig = app.get(AppConfigService);

  // Add Global Prefix and Enable Versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });

  // Validation Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Interceptors
  app.useGlobalInterceptors(new ApiSuccessInterceptor());

  // Exception Filters
  app.useGlobalFilters(new AppExceptionFilter());

  // Build OpenAPI interactive docs with Swagger
  const config = new DocumentBuilder()
    .setTitle('Gamified Todo API')
    .setDescription('Todo, progression, leaderboard, and notifications API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/openapi.json',
  });

  // Start the application
  await app.listen(appConfig.port);
}

void bootstrap();
