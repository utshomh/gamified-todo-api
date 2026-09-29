import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RotateTokenDto {
  @ApiProperty({
    example: 'signed&SecureRefreshToken',
  })
  @IsString()
  refreshToken!: string;
}

export class RotateTokenResponseDto {
  @ApiProperty({
    example: 'signed&SecureAccessToken',
  })
  accessToken!: string;

  @ApiProperty({
    example: 'signed&SecureRefreshToken',
  })
  refreshToken!: string;
}
