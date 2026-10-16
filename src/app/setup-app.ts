import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  type INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';

import { AppExceptionFilter } from '../common/errors/app-exception.filter';
import { ApiSuccessInterceptor } from '../common/responses/api-success.interceptor';

/** Shared by production, HTTP tests, and OpenAPI generation. */
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');

  app.enableVersioning({ type: VersioningType.URI });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new ApiSuccessInterceptor<unknown>());

  app.useGlobalFilters(new AppExceptionFilter());

  app.enableShutdownHooks();
}

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Gamified Todo API')
    .setDescription('Todo, progression, leaderboard, and notifications API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  return SwaggerModule.createDocument(app, config);
}
