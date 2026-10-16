import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Injectable, type OnModuleDestroy } from '@nestjs/common';

import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(private readonly appConfig: AppConfigService) {
    const adapter = new PrismaPg({
      connectionString: appConfig.databaseUrl,
    });

    super({ adapter });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
