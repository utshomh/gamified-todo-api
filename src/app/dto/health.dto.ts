import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({
    example: true,
    description: 'Returns server status',
  })
  up!: boolean;

  @ApiProperty({
    example: true,
    description: 'Returns database health status',
  })
  databaseIsReady!: boolean;
}
