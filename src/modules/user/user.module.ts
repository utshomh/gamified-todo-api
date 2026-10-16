import { Module } from '@nestjs/common';

import { AuthSecurityModule } from '../auth/auth-security.module';

import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [AuthSecurityModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
