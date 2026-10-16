import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class RotateTokenDto {
  @ApiProperty({
    example: 'signed&SecureRefreshToken',
  })
  @IsString()
  @Length(1, 4096)
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
