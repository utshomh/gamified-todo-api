import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
  type ArgumentsHost,
} from '@nestjs/common';
import type { RequestWithMeta } from '../http/request-context';
import type { Response } from 'express';
import { AppError } from './app-error';
import { AppExceptionFilter } from './app-exception.filter';

describe('AppExceptionFilter', () => {
  const status = jest.fn();
  const json = jest.fn<void, [unknown]>();
  const setHeader = jest.fn();
  let log: jest.SpyInstance;
  let host: ArgumentsHost;
  const filter = new AppExceptionFilter();

  beforeEach(() => {
    jest.clearAllMocks();
    log = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const response = { status, json, setHeader };
    status.mockReturnValue(response);
    const request = {
      method: 'POST',
      originalUrl: '/api/v1/auth/login?secret=hidden',
      requestId: 'request-123',
      body: { password: 'not-for-logs' },
      headers: { authorization: 'Bearer hidden-token' },
    };
    // Nest's generic HTTP host cannot be constructed without an adapter.
    host = {
      switchToHttp: () => ({
        getRequest: () => request as RequestWithMeta,
        getResponse: () => response as unknown as Response,
      }),
    } as unknown as ArgumentsHost;
  });
  afterEach(() => {
    log.mockRestore();
  });

  it('preserves the validation shape and a string array', () => {
    filter.catch(
      new BadRequestException(['message must be equal to ping']),
      host,
    );
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 400,
        code: 'BAD_REQUEST',
        message: 'Request validation failed',
        details: { errors: ['message must be equal to ping'] },
      }),
    );
    expect(log).not.toHaveBeenCalled();
  });

  it.each([
    new BadRequestException('Malformed request'),
    new AppError('BAD_REQUEST', 'Malformed request'),
  ])('includes typed details on every bad request: %s', (exception) => {
    filter.catch(exception, host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'BAD_REQUEST',
        details: { errors: ['Malformed request'] },
      }),
    );
  });

  it('accepts explicitly typed application validation details', () => {
    filter.catch(
      new AppError('BAD_REQUEST', 'Invalid input', {
        errors: ['email is invalid'],
      }),
      host,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ details: { errors: ['email is invalid'] } }),
    );
  });

  it('does not emit non-string validation details from arbitrary HTTP exceptions', () => {
    filter.catch(
      new BadRequestException({ message: [{ private: 'value' }] }),
      host,
    );
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        details: { errors: ['Request validation failed'] },
      }),
    );
  });

  it.each([
    new Error('Database connection refused', {
      cause: new Error('Socket closed'),
    }),
    new InternalServerErrorException('private database error'),
    new AppError('INTERNAL_ERROR', 'private application error'),
  ])('logs the cause but sanitizes server-error responses: %s', (exception) => {
    filter.catch(exception, host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      }),
    );
    const publicBody: unknown = json.mock.calls[0]?.[0];
    expect(publicBody).not.toHaveProperty('details');
    expect(log).toHaveBeenCalledWith(
      '[request-123] POST /api/v1/auth/login 500 INTERNAL_ERROR',
      expect.stringContaining(exception.message),
    );
    const output = JSON.stringify(log.mock.calls);
    expect(output).toContain('app-exception.filter.spec.ts');
    expect(output).not.toContain('not-for-logs');
    expect(output).not.toContain('hidden-token');
    expect(output).not.toContain('secret=hidden');
    expect(setHeader).toHaveBeenCalledWith('X-Request-ID', 'request-123');
    if (exception.cause instanceof Error)
      expect(output).toContain('Socket closed');
  });

  it('handles exceptions that are not Error instances', () => {
    filter.catch('unexpected failure', host);
    expect(log).toHaveBeenCalledWith(
      expect.any(String),
      'Non-Error exception: unexpected failure',
    );
    expect(status).toHaveBeenCalledWith(500);
  });

  it('does not dump request data attached to exceptions', () => {
    const exception = Object.assign(new Error('Upstream failed'), {
      request: {
        headers: { authorization: 'private-token' },
        body: { password: 'private-password' },
      },
    });
    filter.catch(exception, host);
    const output = JSON.stringify(log.mock.calls);
    expect(output).toContain('Upstream failed');
    expect(output).not.toContain('private-token');
    expect(output).not.toContain('private-password');
  });

  it('handles circular error causes without failing the response', () => {
    const exception = new Error('Circular cause');
    exception.cause = exception;
    filter.catch(exception, host);
    expect(log).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('[Circular error cause]'),
    );
    expect(status).toHaveBeenCalledWith(500);
  });
});
