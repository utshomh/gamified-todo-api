import { Injectable } from '@nestjs/common';

import { AppError } from '../../common/errors/app-error';

import { PrismaService } from '../../prisma/prisma.service';

import { MeResponseDto } from './dto/me.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string): Promise<MeResponseDto> {
    const user = await this.getUserById(userId);

    if (!user) {
      throw new AppError('NOT_FOUND', 'User not found.');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUser } = user;

    return safeUser;
  }

  getUserById(id: string) {
    return this.prisma.user.findFirst({ where: { id } });
  }

  getUserByEmail(email: string) {
    return this.prisma.user.findFirst({ where: { email } });
  }

  createUser(
    displayName: string,
    email: string,
    passwordHash: string,
    timezone: string,
  ) {
    return this.prisma.user.create({
      data: {
        displayName,
        email,
        passwordHash,
        timezone,
      },
      omit: {
        passwordHash: true,
      },
    });
  }
}
