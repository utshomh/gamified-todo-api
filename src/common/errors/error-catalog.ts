import { HttpStatus } from '@nestjs/common';

type ErrorDefinition = {
  readonly status: HttpStatus;
  readonly message: string;
  readonly description: string;
};

export const ERROR_CATALOG = {
  VALIDATION_ERROR: {
    status: HttpStatus.BAD_REQUEST,
    message: 'Request validation failed',
    description: 'The body, query, or route parameters are invalid.',
  },

  UNAUTHORIZED: {
    status: HttpStatus.UNAUTHORIZED,
    message: 'Authentication is required',
    description: 'The access token is missing or invalid.',
  },

  FORBIDDEN: {
    status: HttpStatus.FORBIDDEN,
    message: 'You do not have permission to perform this action',
    description: 'The authenticated user lacks the required permission.',
  },

  NOT_FOUND: {
    status: HttpStatus.NOT_FOUND,
    message: 'Resource not found',
    description: 'The requested resource does not exist.',
  },

  CONFLICT: {
    status: HttpStatus.CONFLICT,
    message: 'The request conflicts with the current state',
    description: 'The requested operation cannot be performed.',
  },

  INTERNAL_ERROR: {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred',
    description: 'The server encountered an unexpected condition.',
  },
} as const satisfies Record<string, ErrorDefinition>;

export type ErrorCode = keyof typeof ERROR_CATALOG;
