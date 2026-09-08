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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CustomersModule,
    MessagesModule,
    OrdersModule,
    BroadcastsModule,
    AutoRepliesModule,
    ConversationModule,
  ],
})
export class AppModule {}
