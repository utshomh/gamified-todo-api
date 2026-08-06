import { ApiProperty } from '@nestjs/swagger';

export class StatusResponseDto {
  @ApiProperty({
    example: 'foo-bar-api',
    description: 'Current service name',
  })
  service!: string;

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
}
