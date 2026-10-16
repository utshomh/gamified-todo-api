import type { Request } from 'express';

import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';

import { AppError } from '../../common/errors/app-error';

import { JwtTokenService } from './jwt/jwt-token.service';
import { AuthSessionService } from './auth-session.service';

import type { AccessTokenPayload, AuthenticatedRequest } from './auth.types';

@Injectable()
export class AuthTokenGuard implements CanActivate {
  constructor(
    private readonly jwtTokenService: JwtTokenService,
    private readonly authSessionService: AuthSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = this.extractJwtToken(request);

    if (!token)
      throw new AppError(
        'UNAUTHORIZED',
        'Please provide a valid bearer access token.',
      );

    let payload: AccessTokenPayload;

    try {
      payload = await this.jwtTokenService.verifyAccessToken(token);
    } catch {
      throw new AppError(
        'UNAUTHORIZED',
        'The access token is invalid or expired.',
      );
    }

    // Database failures remain server errors, rather than being hidden as 401s.
    await this.authSessionService.requireActiveSession(payload);

    request.authPayload = payload;

    return true;
  }

  extractJwtToken(request: Request) {
    return /^Bearer ([^\s]+)$/i.exec(request.headers.authorization ?? '')?.[1];
  }
}
