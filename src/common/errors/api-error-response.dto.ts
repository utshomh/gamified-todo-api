import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ERROR_CATALOG, type ErrorCode } from './error-catalog';

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
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

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
  })
  details?: Record<string, unknown>;

  @ApiProperty({
    format: 'date-time',
    example: '2026-08-06T00:00:00.000Z',
  })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/foo-bar' })
  path!: string;
}
