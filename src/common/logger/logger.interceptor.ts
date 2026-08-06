import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { tap, type Observable } from 'rxjs';

@Injectable()
export class LoggerInterceptor<T = unknown> implements NestInterceptor<T, T> {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const startedAt = performance.now();

    return next.handle().pipe(
      tap({
        complete: () => {
          this.writeLog(request, response.statusCode, startedAt);
        },

        error: (error: unknown) => {
          this.writeLog(request, this.getErrorStatus(error), startedAt);
        },
      }),
    );
  }

  private writeLog(
    request: Request,
    statusCode: number,
    startedAt: number,
  ): void {
    const message = this.formatMessage(request, statusCode, startedAt);

    if (statusCode >= 500) {
      this.logger.error(message);
      return;
    }

    if (statusCode >= 400) {
      this.logger.warn(message);
      return;
    }

    this.logger.log(message);
  }

  private formatMessage(
    request: Request,
    statusCode: number,
    startedAt: number,
  ): string {
    const durationMs = performance.now() - startedAt;
    const method = request.method.toUpperCase().padEnd(7);
    const statusLabel = this.getStatusLabel(statusCode);

    return [
      method,
      request.originalUrl,
      '►',
      `${statusCode} ${statusLabel}`,
      '·',
      `${durationMs.toFixed(2)} ms`,
    ].join(' ');
  }

  private getStatusLabel(statusCode: number): string {
    const statusName = HttpStatus[statusCode];

    if (typeof statusName !== 'string') {
      return 'Unknown';
    }

    return statusName
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  private getErrorStatus(error: unknown): number {
    if (
      typeof error === 'object' &&
      error !== null &&
      'getStatus' in error &&
      typeof error.getStatus === 'function'
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
      const statusCode = error.getStatus();

      if (typeof statusCode === 'number') {
        return statusCode;
      }
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
