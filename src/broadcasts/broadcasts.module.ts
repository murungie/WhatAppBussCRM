import { Module } from '@nestjs/common';

import { BroadcastsController } from './broadcasts.controller';
import { BroadcastsService } from './broadcasts.service';
import { BroadcastQueueService } from './broadcast-queue.service';
import { BroadcastProcessor } from './broadcast.processor';

import { WhatsappClientService } from '../whatsapp/whatsapp-client.service';
import { ConversationModule } from '../conversation/conversation.module';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [
    ConversationModule,
    QueuesModule,
  ],

  controllers: [
    BroadcastsController,
  ],

  providers: [
    BroadcastsService,
    BroadcastQueueService,
    BroadcastProcessor,
    WhatsappClientService,
  ],

  exports: [
    BroadcastsService,
  ],
})
export class BroadcastsModule {}