import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiSuccessResponseDto<T> {
  @ApiProperty({ example: true })
  success!: true;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
  })
  data!: T;

  @ApiProperty({
    format: 'date-time',
    example: '2004-07-09T00:00:00.000Z',
  })
  timestamp!: string;

  @ApiProperty({ example: '/api/v1/foo-bar' })
  path!: string;
}
