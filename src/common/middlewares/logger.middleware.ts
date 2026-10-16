import { randomUUID } from 'node:crypto';
import { NextFunction, Response } from 'express';
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { RequestWithMeta } from '../http/request-context';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: RequestWithMeta, res: Response, next: NextFunction) {
    req.requestId = randomUUID();
    res.setHeader('X-Request-ID', req.requestId);
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      const message = [
        `[${req.requestId}]`,
        req.method,
        req.originalUrl.split('?')[0],
        res.statusCode,
        `${durationMs.toFixed(1)}ms`,
      ].join(' ');

      if (res.statusCode >= 500) {
        this.logger.error(message);
        return;
      }

      if (res.statusCode >= 400) {
        this.logger.warn(message);
        return;
      }

      this.logger.log(message);
    });

    next();
  }
}
