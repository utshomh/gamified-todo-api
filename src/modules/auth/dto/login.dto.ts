/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsStrongPassword } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'example@email.com',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password@123',
    minLength: 8,
    maxLength: 64,
    format: 'password',
  })
  @IsStrongPassword({
    minLength: 8,
    minNumbers: 1,
    minSymbols: 1,
    minLowercase: 1,
    minUppercase: 1,
  })
  password!: string;
}

export class LoginResponseDto {
  @ApiProperty({
    example: 'signed&SecureAccessToken',
  })
  accessToken!: string;

  @ApiProperty({
    example: 'signed&SecureRefreshToken',
  })
  refreshToken!: string;
}
