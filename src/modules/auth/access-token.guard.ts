import { Request } from 'express';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

import { AppError } from '../../common/errors/app-error';

import { JwtTokenService } from './jwt/jwt-token.service';

@Injectable()
export class AuthTokenGuard implements CanActivate {
  constructor(private readonly jwtTokenService: JwtTokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractJwtToken(request);
    if (!token) {
      throw new AppError(
        'UNAUTHORIZED',
        'No access token found. Please provide a valid access token in order to access this route.',
      );
    }

    try {
      const payload = await this.jwtTokenService.verifyAccessToken(token);

      request['authPayload'] = payload;
    } catch {
      throw new AppError(
        'UNAUTHORIZED',
        'Invalid or Expired token. Please provide a valid access token in order to access this route.',
      );
    }

    return true;
  }

  extractJwtToken(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
