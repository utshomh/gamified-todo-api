import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthTokenGuard } from './access-token.guard';

import { PrismaModule } from '../../prisma/prisma.module';
import { AppConfigModule } from '../../config/app-config.module';

import { JwtTokenService } from './jwt/jwt-token.service';
import { AuthSessionService } from './auth-session.service';

@Module({
  imports: [AppConfigModule, PrismaModule, JwtModule.register({})],
  providers: [JwtTokenService, AuthSessionService, AuthTokenGuard],
  exports: [JwtTokenService, AuthSessionService, AuthTokenGuard],
})
export class AuthSecurityModule {}
