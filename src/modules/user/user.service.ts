import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

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
