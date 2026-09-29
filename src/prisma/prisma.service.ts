import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client/extension';

import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(appConfig: AppConfigService) {
    const adapter = new PrismaPg({
      connectionString: appConfig.databaseUrl,
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({ adapter });
  }
}
