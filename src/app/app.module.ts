import { Module } from '@nestjs/common';

import { AppConfigModule } from '../config/app-config.module';

import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';

import { AppService } from './app.service';
import { AppController } from './app.controller';

@Module({
  imports: [AppConfigModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
