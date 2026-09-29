import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
  ) {}

  createSession(data: {
    sessionId: string;
    userId: string;
    tokenHash: string;
  }) {
    return this.prisma.authSession.create({
      data: {
        id: data.sessionId,
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: new Date(Date.now() + this.appConfig.jwtRefreshTtl),
      },
    });
  }

  findSessionById(id: string) {
    return this.prisma.authSession.findFirst({
      where: {
        id,
      },
    });
  }

  async revokeSession(id: string) {
    await this.prisma.authSession.update({
      where: { id },
      data: { revokedAt: new Date(Date.now()) },
    });
  }
}
