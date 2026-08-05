import { ApiProperty } from '@nestjs/swagger';
import { Equals } from 'class-validator';

export class PingRequestDto {
  @ApiProperty({
    description: 'The string `ping`',
    example: 'ping',
  })
  @Equals('ping')
  message!: 'ping';
}

export class PongResponseDto {
  @ApiProperty({
    description: 'The string `pong`',
    example: 'pong',
  })
  message!: 'pong';
}
