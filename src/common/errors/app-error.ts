import { ERROR_CATALOG, type ErrorCode } from './error-catalog';

export class AppError<C extends ErrorCode> extends Error {
  readonly status: (typeof ERROR_CATALOG)[C]['status'];

  constructor(
    readonly code: C,
    readonly details?: Record<string, unknown>,
    message: string = ERROR_CATALOG[code].message,
  ) {
    super(message);

    this.name = 'AppError';
    this.status = ERROR_CATALOG[code].status;
  }
}
