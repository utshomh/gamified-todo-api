import { ApiProperty } from '@nestjs/swagger';

import { ERROR_CATALOG, type ErrorCode } from './error-catalog';

export class ApiErrorResponseDto {
  @ApiProperty({ type: Boolean, enum: [false], example: false })
  success!: false;

  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({
    enum: Object.keys(ERROR_CATALOG),
    example: 'NOT_FOUND',
  })
  code!: ErrorCode;

  @ApiProperty({ example: 'Resource not found' })
  message!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-08-06T00:00:00.000Z',
  })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/foo-bar' })
  path!: string;
}

export class ValidationErrorDetailsDto {
  @ApiProperty({ type: [String], example: ['message must be equal to ping'] })
  errors!: string[];
}

export class ApiBadRequestErrorResponseDto extends ApiErrorResponseDto {
  @ApiProperty({ type: Number, enum: [400], example: 400 })
  override statusCode = 400 as const;

  @ApiProperty({ enum: ['BAD_REQUEST'], example: 'BAD_REQUEST' })
  override code = 'BAD_REQUEST' as const;

  @ApiProperty({ type: ValidationErrorDetailsDto })
  details!: ValidationErrorDetailsDto;
}

/** Only BAD_REQUEST currently defines a public details payload. */
export type ErrorDetails<C extends ErrorCode> = C extends 'BAD_REQUEST'
  ? ValidationErrorDetailsDto
  : never;

export type ApiErrorResponse =
  | ApiBadRequestErrorResponseDto
  | (Omit<ApiErrorResponseDto, 'code'> & {
      code: Exclude<ErrorCode, 'BAD_REQUEST'>;
      details?: never;
    });
