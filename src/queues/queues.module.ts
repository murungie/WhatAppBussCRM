import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { BROADCAST_QUEUE } from '../broadcasts/broadcast.queue';

@Module({
  imports: [
    BullModule.forRoot({
      connection: process.env.REDIS_URL
        ? {
            url: process.env.REDIS_URL,
          }
        : {
            host: process.env.REDIS_HOST ?? 'localhost',
            port: Number(process.env.REDIS_PORT ?? 6379),
          },
    }),

    BullModule.registerQueue({
      name: BROADCAST_QUEUE,
    }),
  ],

  exports: [BullModule],
})
export class QueuesModule {}