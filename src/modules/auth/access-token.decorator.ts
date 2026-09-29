import { Request } from 'express';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { AccessTokenPayload } from './auth.types';

type AuthenticatedRequest = Request & { authPayload: AccessTokenPayload };

export const AccessToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessTokenPayload =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().authPayload,
);
