
import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { WhatsAppConnectionService } from './whatsapp-connection.service';

@Module({
  imports: [PrismaModule],
  controllers: [SettingsController],
  providers: [
    SettingsService,
    WhatsAppConnectionService,
  ],
})
export class SettingsModule {}
