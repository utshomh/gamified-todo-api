import { ERROR_CATALOG, type ErrorCode } from './error-catalog';

export class AppError<C extends ErrorCode> extends Error {
  readonly status: (typeof ERROR_CATALOG)[C]['status'];

  constructor(
    readonly code: C,
    message: string = ERROR_CATALOG[code].message,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);

    this.name = 'AppError';
    this.status = ERROR_CATALOG[code].status;
  }
}
