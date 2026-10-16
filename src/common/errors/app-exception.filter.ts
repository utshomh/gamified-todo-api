import type { Response } from 'express';
import { randomUUID } from 'node:crypto';

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

import { isAppError } from './app-error';
import { ERROR_CATALOG, ErrorCode } from './error-catalog';
import { genericCodeForStatus, isRecord } from './error.utils';
import type { RequestWithMeta } from '../http/request-context';

import {
  ApiBadRequestErrorResponseDto,
  ApiErrorResponseDto,
  type ApiErrorResponse,
} from './api-error-response.dto';

function describeException(
  exception: unknown,
  seen = new Set<Error>(),
): string {
  if (!(exception instanceof Error)) {
    return `Non-Error exception: ${typeof exception === 'string' ? exception : typeof exception}`;
  }
  if (seen.has(exception)) return '[Circular error cause]';
  if (seen.size >= 5) return '[Error cause chain truncated]';
  seen.add(exception);
  const stack = exception.stack ?? `${exception.name}: ${exception.message}`;
  // Avoid dumping arbitrary exception properties such as request headers/body.
  return exception.cause === undefined
    ? stack
    : `${stack}\nCaused by: ${describeException(exception.cause, seen)}`;
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response<ApiErrorResponse>>();
    const request = http.getRequest<RequestWithMeta>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ErrorCode = 'INTERNAL_ERROR';
    let message = ERROR_CATALOG.INTERNAL_ERROR.message as string;
    let validationErrors: string[] | undefined;

    if (isAppError(exception)) {
      status = exception.status;
      code = exception.code;
      message = exception.message;
      validationErrors = exception.details?.errors;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = genericCodeForStatus(status);
      message = ERROR_CATALOG[code].message;

      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else if (isRecord(body)) {
        const bodyMessage = body.message;

        if (
          Array.isArray(bodyMessage) &&
          bodyMessage.every((item: unknown) => typeof item === 'string')
        ) {
          // class-validator / ValidationPipe errors
          message = ERROR_CATALOG[code].message;
          validationErrors = bodyMessage;
        } else if (typeof bodyMessage === 'string') {
          message = bodyMessage;
        }
      }
    }

    const requestId = request.requestId ?? randomUUID();
    request.requestId = requestId;
    response.setHeader('X-Request-ID', requestId);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${requestId}] ${request.method} ${request.originalUrl.split('?')[0]} ${status} ${code}`,
        describeException(exception),
      );
      // Operational diagnostics belong in server logs, never in the public API.
      message = ERROR_CATALOG.INTERNAL_ERROR.message;
    }

    const common = {
      success: false,
      statusCode: status,
      code,
      message,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    } satisfies ApiErrorResponseDto;

    const body: ApiErrorResponse =
      code === 'BAD_REQUEST'
        ? ({
            ...common,
            statusCode: 400,
            code,
            details: { errors: validationErrors ?? [message] },
          } satisfies ApiBadRequestErrorResponseDto)
        : { ...common, code };
    response.status(status).json(body);
  }
}
