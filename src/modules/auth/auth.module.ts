import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AppConfigService } from '../../config/app-config.service';

import { UserModule } from '../user/user.module';

import { AuthController } from './auth.controller';

import { AuthService } from './auth.service';
import { JwtTokenService } from './jwt/jwt-token.service';
import { AuthSessionService } from './auth-session.service';
import { AuthTokenGuard } from './access-token.guard';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [AppConfigService],
      global: true,
      useFactory: (appConfig: AppConfigService) => ({
        secret: appConfig.jwtAccessSecret,
      }),
    }),
    forwardRef(() => UserModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtTokenService, AuthSessionService, AuthTokenGuard],
  exports: [AuthService, JwtTokenService, AuthSessionService, AuthTokenGuard],
})
export class AuthModule {}
