import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'example@email.com',
  })
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({
    example: 'Password@123',
    minLength: 8,
    maxLength: 64,
    format: 'password',
  })
  @IsString()
  @Length(8, 64)
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
