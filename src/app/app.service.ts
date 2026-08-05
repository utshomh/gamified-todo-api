import { Injectable } from '@nestjs/common';

import { StatusResponseDto } from './dto/status.dto';
import { PongResponseDto } from './dto/ping.dto';

@Injectable()
export class AppService {
  getStatus(): StatusResponseDto {
    return { status: 'ok', version: '1', timestamp: new Date().toISOString() };
  }

  pong(): PongResponseDto {
    return { message: 'pong' };
  }
}
