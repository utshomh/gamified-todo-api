import { ApiProperty } from '@nestjs/swagger';

export class MeResponseDto {
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
