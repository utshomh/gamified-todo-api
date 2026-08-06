/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  IsTimeZone,
  Length,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'Example',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(3, 18)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Display name may only contain letters, numbers, and underscores.',
  })
  displayName!: string;

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
  @IsString()
  @Length(8, 64)
  @Matches(/[a-z]/, {
    message: 'password must contain at least one lowercase letter.',
  })
  @Matches(/[A-Z]/, {
    message: 'password must contain at least one uppercase letter.',
  })
  @Matches(/\d/, {
    message: 'password must contain at least one number.',
  })
  @Matches(/[!@#$%^&*()_\-+=[\]{};':"\\|,.<>/?`~]/, {
    message: 'password must contain at least one special character.',
  })
  password!: string;

  @ApiProperty({
    example: 'Asia/Dhaka',
  })
  @IsTimeZone()
  timezone!: string;
}

export class RegisterResponseDto {
  @ApiProperty({
    example: 'userIdInCuid',
  })
  id!: string;

  @ApiProperty({
    example: 'Example',
  })
  displayName!: string;

  @ApiProperty({
    example: 'example@email.com',
  })
  email!: string;

  @ApiProperty({
    example: 'Asia/Dhaka',
  })
  timezone!: string;
}
