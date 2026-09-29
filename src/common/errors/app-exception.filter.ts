/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AppError } from './app-error';
import { ERROR_CATALOG, ErrorCode } from './error-catalog';
import { genericCodeForStatus, isRecord } from './error.utils';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: ErrorCode = 'INTERNAL_ERROR';
    let message = ERROR_CATALOG.INTERNAL_ERROR.message as string;
    let details: Record<string, unknown> | undefined;

    if (exception instanceof AppError) {
      status = exception.status;
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = genericCodeForStatus(status);

      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else if (isRecord(body)) {
        const bodyMessage = body.message;

        if (Array.isArray(bodyMessage)) {
          // class-validator / ValidationPipe errors
          message = ERROR_CATALOG[code].message;
          details = {
            errors: bodyMessage,
          };
        } else if (typeof bodyMessage === 'string') {
          message = bodyMessage;
        }
      }
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      code,
      message,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    });
  }
}
