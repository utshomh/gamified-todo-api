import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';

import { AppError } from '../../common/errors/app-error';

import { PrismaService } from '../../prisma/prisma.service';

import { MeResponseDto } from './dto/me.dto';

const publicUserSelect = {
  id: true,
  displayName: true,
  email: true,
  timezone: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async me(userId: string): Promise<MeResponseDto> {
    const user = await this.getUserById(userId);

    if (!user) throw new AppError('NOT_FOUND', 'User not found.');

    return user;
  }

  getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: publicUserSelect,
    });
  }

  getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });
  }

  async createUser(
    displayName: string,
    email: string,
    passwordHash: string,
    timezone: string,
  ) {
    try {
      return await this.prisma.user.create({
        data: { displayName, email, passwordHash, timezone },
        select: publicUserSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppError(
          'CONFLICT',
          'Email already in use. Choose a different email or login with this email.',
        );
      }
      throw error;
    }
  }
}
