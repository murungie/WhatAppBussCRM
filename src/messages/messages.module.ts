import { Module } from '@nestjs/common';

import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { WebhookController } from './webhook.controller';

import { CustomersModule } from '../customers/customers.module';
import { WhatsappClientService } from '../whatsapp/whatsapp-client.service';

import { ConversationModule } from '../conversation/conversation.module';
import { ConversationService } from './conversation.service';

@Module({
  imports: [
    CustomersModule,
    ConversationModule,
  ],

  providers: [
    MessagesService,
    WhatsappClientService,
    ConversationService,
  ],

  controllers: [
    MessagesController,
    WebhookController,
  ],

  exports: [
    MessagesService,
    WhatsappClientService,
    ConversationService,
  ],
})
export class MessagesModule {}