import { Module } from '@nestjs/common';

import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { WebhookController } from './webhook.controller';

import { CustomersModule } from '../customers/customers.module';
import { WhatsappClientService } from '../whatsapp/whatsapp-client.service';
import { BroadcastsModule } from '../broadcasts/broadcasts.module';
import { ConversationModule } from '../conversation/conversation.module';

@Module({
  imports: [
    CustomersModule,
    ConversationModule,
    BroadcastsModule,
  ],

  providers: [
    MessagesService,
    WhatsappClientService,
  ],

  controllers: [
    MessagesController,
    WebhookController,
  ],

  exports: [
    MessagesService,
    WhatsappClientService,
  ],
})
export class MessagesModule {}