import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
  ) {}

  createSession(userId: string, tokenHash: string) {
    return this.prisma.authSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + this.appConfig.jwtRefreshTtl),
      },
    });
  }
}
