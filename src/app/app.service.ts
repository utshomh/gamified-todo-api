import { Injectable } from '@nestjs/common';

import { PongResponseDto } from './dto/ping.dto';
import { HealthResponseDto } from './dto/health.dto';
import { StatusResponseDto } from './dto/status.dto';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getStatus(): StatusResponseDto {
    return { service: 'gamified-todo-api', status: 'ok', version: '1' };
  }

  pong(): PongResponseDto {
    return { message: 'pong' };
  }

  async health(): Promise<HealthResponseDto> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        up: true,
        databaseIsReady: true,
      };
    } catch {
      return {
        up: false,
        databaseIsReady: false,
      };
    }
  }
}
