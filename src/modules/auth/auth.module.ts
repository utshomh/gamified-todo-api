import { Module } from '@nestjs/common';

import { UserModule } from '../user/user.module';
import { AuthSecurityModule } from './auth-security.module';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [AuthSecurityModule, UserModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
