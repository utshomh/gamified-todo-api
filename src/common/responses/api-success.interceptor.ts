import type { Request } from 'express';
import { map, type Observable } from 'rxjs';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { ApiSuccessResponseDto } from './api-success-response.dto';

@Injectable()
export class ApiSuccessInterceptor<T> implements NestInterceptor<
  T,
  ApiSuccessResponseDto<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiSuccessResponseDto<T>> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data): ApiSuccessResponseDto<T> => ({
        success: true,
        data,
        path: request.originalUrl,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
