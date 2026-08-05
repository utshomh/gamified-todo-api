import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus(): { name: string; status: 'ok' } {
    return { name: 'gamified-todo-api', status: 'ok' };
  }
}
