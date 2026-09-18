import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BROADCAST_QUEUE } from './broadcast.queue';

@Injectable()
export class BroadcastQueueService {
  constructor(
    @InjectQueue(BROADCAST_QUEUE)
    private readonly queue: Queue,
  ) {}

  async enqueueBroadcast(
    broadcastId: string,
    scheduledAt?: Date | null,
  ) {
    const delay = scheduledAt
      ? Math.max(
          0,
          scheduledAt.getTime() - Date.now(),
        )
      : 0;

    const jobId = `broadcast-${broadcastId}-${Date.now()}`;

    return this.queue.add(
      'send-broadcast',
      { broadcastId },
      {
        jobId,
        delay,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    );
  }

  async removeBroadcastJob(jobId: string) {
    const job = await this.queue.getJob(jobId);

    if (!job) {
      return false;
    }

    await job.remove();

    return true;
  }
}