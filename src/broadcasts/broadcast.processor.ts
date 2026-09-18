import {
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';

import { Job } from 'bullmq';

import { BroadcastsService } from './broadcasts.service';

@Processor('broadcasts')
export class BroadcastProcessor extends WorkerHost {
  constructor(
    private readonly broadcastsService: BroadcastsService,
  ) {
    super();
  }

  async process(
    job: Job<{
      broadcastId: string;
    }>,
  ) {
    switch (job.name) {
      case 'send-broadcast':
        return this.broadcastsService.processQueuedBroadcast(
          job.data.broadcastId,
        );

      default:
        throw new Error(
          `Unknown broadcast job: ${job.name}`,
        );
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    console.log(
      `[BroadcastWorker] Job ${job.id} completed`,
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(
    job: Job | undefined,
    error: Error,
  ) {
    console.error(
      `[BroadcastWorker] Job ${job?.id} failed:`,
      error.message,
    );

    if (job?.data?.broadcastId) {
      await this.broadcastsService.markQueueProcessingFailed(
        job.data.broadcastId,
        error.message,
      );
    }
  }
}