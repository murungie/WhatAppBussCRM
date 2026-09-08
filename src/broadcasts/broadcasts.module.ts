import { Module } from '@nestjs/common';

import { BroadcastsController } from './broadcasts.controller';
import { BroadcastsService } from './broadcasts.service';
import { ConversationModule } from '../conversation/conversation.module';
import { WhatsappClientService } from '../whatsapp/whatsapp-client.service';
@Module({
  controllers: [BroadcastsController],
  imports: [
  ConversationModule,
],
  providers: [
    BroadcastsService,
    WhatsappClientService,
  ],
  exports: [BroadcastsService],
})
export class BroadcastsModule {}