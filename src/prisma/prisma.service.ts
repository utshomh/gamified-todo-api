import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(appConfig: AppConfigService) {
    const adapter = new PrismaPg({
      connectionString: appConfig.databaseUrl,
    });

    super({ adapter });
  }
}
