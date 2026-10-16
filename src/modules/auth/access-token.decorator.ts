import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AppError } from '../../common/errors/app-error';

import type { AccessTokenPayload, AuthenticatedRequest } from './auth.types';

export const AccessToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessTokenPayload => {
    const payload = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>().authPayload;
    if (!payload) throw new AppError('UNAUTHORIZED');
    return payload;
  },
);
