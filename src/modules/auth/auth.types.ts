import type { Request } from 'express';
import { z } from 'zod';

export const tokenIdentitySchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1),
});

const tokenClaimsSchema = tokenIdentitySchema.extend({
  iat: z.number().int().nonnegative(),
  exp: z.number().int().positive(),
});

export const accessTokenSchema = tokenClaimsSchema.extend({
  tokenType: z.literal('access'),
});

export const refreshTokenSchema = tokenClaimsSchema.extend({
  tokenType: z.literal('refresh'),
});

export type TokenIdentity = z.infer<typeof tokenIdentitySchema>;
export type AccessTokenPayload = z.infer<typeof accessTokenSchema>;
export type RefreshTokenPayload = z.infer<typeof refreshTokenSchema>;
export type AuthenticatedRequest = Request & {
  authPayload?: AccessTokenPayload;
};
