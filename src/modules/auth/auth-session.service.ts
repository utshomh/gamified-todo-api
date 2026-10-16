import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';

import { AppError } from '../../common/errors/app-error';

import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';

import type { TokenIdentity } from './auth.types';

type NewSession = TokenIdentity & { tokenHash: string; expiresAt: Date };

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appConfig: AppConfigService,
  ) {}

  createSession(data: NewSession) {
    return this.prisma.authSession.create({ data: this.sessionData(data) });
  }

  findSessionById(id: string) {
    return this.prisma.authSession.findUnique({ where: { id } });
  }

  async requireActiveSession(identity: TokenIdentity) {
    const session = await this.findSessionById(identity.sessionId);
    if (
      !session ||
      session.userId !== identity.userId ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now()
    ) {
      throw new AppError(
        'UNAUTHORIZED',
        'The authentication session is no longer valid.',
      );
    }
    return session;
  }

  async rotateSession(
    previous: TokenIdentity & { tokenHash: string },
    next: NewSession,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();
      // PostgreSQL rechecks this predicate after waiting for a concurrent update.
      const consumed = await tx.authSession.updateMany({
        where: {
          id: previous.sessionId,
          userId: previous.userId,
          tokenHash: previous.tokenHash,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { revokedAt: now, lastUsedAt: now, replacedById: next.sessionId },
      });

      if (consumed.count !== 1) {
        throw new AppError(
          'UNAUTHORIZED',
          'The refresh token has already been used or expired.',
        );
      }

      return tx.authSession.create({ data: this.sessionData(next) });
    });
  }

  private sessionData(
    data: NewSession,
  ): Prisma.AuthSessionUncheckedCreateInput {
    return {
      id: data.sessionId,
      userId: data.userId,
      tokenHash: data.tokenHash,
      // Never let the stored session outlive the signed JWT.
      expiresAt: new Date(
        Math.min(
          data.expiresAt.getTime(),
          Date.now() + this.appConfig.jwtRefreshTtl * 1000,
        ),
      ),
    };
  }
}
