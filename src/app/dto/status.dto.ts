import { ApiProperty } from '@nestjs/swagger';

export class StatusResponseDto {
  @ApiProperty({
    example: 'ok',
    description: 'Current server status',
  })
  status!: string;

  @ApiProperty({
    example: '1.0.0',
    description: 'API version',
  })
  version!: string;

  @ApiProperty({
    example: '2026-08-05T17:50:00.000Z',
    description: 'Current server time',
  })
  timestamp!: string;
}
