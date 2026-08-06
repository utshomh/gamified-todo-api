import { JwtModule } from '@nestjs/jwt';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { RequestLoggerMiddleware } from '../common/middlewares/logger.middleware';

import { AppConfigModule } from '../config/app-config.module';

import { PrismaModule } from '../prisma/prisma.module';

import { AuthModule } from '../modules/auth/auth.module';
import { UserModule } from '../modules/user/user.module';

import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [AppConfigModule, PrismaModule, JwtModule, AuthModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*path');
  }
}
