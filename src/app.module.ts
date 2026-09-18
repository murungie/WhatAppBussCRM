import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { MessagesModule } from './messages/messages.module';
import { OrdersModule } from './orders/orders.module';
import { BroadcastsModule } from './broadcasts/broadcasts.module';
import { AutoRepliesModule } from './auto-replies/auto-replies.module';
import { ConversationModule } from './conversation/conversation.module';
import { QueuesModule } from './queues/queues.module';
import { SettingsModule } from './settings/settings.module';
import {
  ThrottlerGuard,
  ThrottlerModule,
} from '@nestjs/throttler';

@Module({
  imports: [
  ConfigModule.forRoot({
    isGlobal: true,
  }),

  ThrottlerModule.forRoot({
    throttlers: [
      {
        name: 'default',
        ttl: 60_000,
        limit: 10,
      },
    ],
  }),

  PrismaModule,
  AuthModule,
  CustomersModule,
  MessagesModule,
  OrdersModule,
  BroadcastsModule,
  AutoRepliesModule,
  ConversationModule,
  QueuesModule,
  SettingsModule,
],
  
})
export class AppModule {}


