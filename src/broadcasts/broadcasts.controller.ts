import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { AddRecipientsDto } from './dto/add-recipients.dto';
import { BroadcastsService } from './broadcasts.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { BroadcastQueueService } from './broadcast-queue.service';


@Controller('broadcasts')
@UseGuards(JwtAuthGuard)
export class BroadcastsController {
  constructor(
    private readonly broadcastsService: BroadcastsService,
    private readonly broadcastQueueService:
  BroadcastQueueService
  ) {}

  // ============================================================
  // CREATE
  // POST /broadcasts
  // ============================================================

  @Post()
  create(
    @CurrentBusiness()
    business: { businessId: string },

    @Body()
    dto: CreateBroadcastDto,
  ) {
    return this.broadcastsService.create(
      business.businessId,
      dto,
    );
  }

  // ============================================================
  // GET ALL
  // GET /broadcasts
  // ============================================================

    // ============================================================
  // GET BROADCASTS
  // GET /broadcasts?page=1&limit=20&status=COMPLETED
  // ============================================================

  @Get()
  findAll(
    @CurrentBusiness()
    business: { businessId: string },

    @Query('page')
    page?: string,

    @Query('limit')
    limit?: string,

    @Query('status')
    status?: string,
  ) {
    return this.broadcastsService.findAll(
      business.businessId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      status,
    );
  }

  // ============================================================
  // GET ONE
  // GET /broadcasts/:id
  // ============================================================

  @Get(':id')
  findOne(
    @CurrentBusiness()
    business: { businessId: string },

    @Param('id')
    id: string,
  ) {
    return this.broadcastsService.findOne(
      business.businessId,
      id,
    );
  }

    // ============================================================
  // GET ANALYTICS
  // GET /broadcasts/:id/analytics
  // ============================================================

  @Get(':id/analytics')
  getAnalytics(
    @CurrentBusiness()
    business: { businessId: string },

    @Param('id')
    id: string,
  ) {
    return this.broadcastsService.getAnalytics(
      business.businessId,
      id,
    );
  }
  // ============================================================
  // ADD RECIPIENTS
  // POST /broadcasts/:id/recipients
  // ============================================================

  @Post(':id/recipients')
addRecipients(
  @CurrentBusiness()
  business: { businessId: string },

  @Param('id')
  id: string,

  @Body()
  dto: AddRecipientsDto,
) {
  return this.broadcastsService.addRecipients(
    business.businessId,
    id,
    dto.customerIds,
  );
}

  // ============================================================
  // SEND BROADCAST
  // POST /broadcasts/:id/send
  // ============================================================

 @Post(':id/send')
async sendBroadcast(
  @CurrentBusiness() business: { businessId: string },
  @Param('id') id: string,
) {
  const broadcast =
    await this.broadcastsService.claimForQueue(
      business.businessId,
      id,
    );

  try {
    const job =
      await this.broadcastQueueService.enqueueBroadcast(
        broadcast.id,
        broadcast.scheduledAt,
      );

    await this.broadcastsService.saveQueueJobId(
      business.businessId,
      broadcast.id,
      job.id!,
    );

    return {
      broadcastId: broadcast.id,
      status: 'QUEUED',
      jobId: job.id,
      scheduledAt: broadcast.scheduledAt,
    };
  } catch (error) {
    await this.broadcastsService.markFailedToQueue(
      business.businessId,
      broadcast.id,
      error instanceof Error
        ? error.message
        : 'Failed to enqueue broadcast',
    );

    throw error;
  }
}

@Patch(':id/cancel')
async cancelBroadcast(
  @CurrentBusiness()
  business: { businessId: string },

  @Param('id')
  id: string,
) {
  const broadcast =
    await this.broadcastsService.cancelBroadcast(
      business.businessId,
      id,
    );

  let jobRemoved = false;

  if (
    broadcast.status === 'QUEUED' &&
    broadcast.queueJobId
  ) {
    jobRemoved =
      await this.broadcastQueueService.removeBroadcastJob(
        broadcast.queueJobId,
      );
  }

  const updated =
    await this.broadcastsService.markCancelled(
      business.businessId,
      broadcast.id,
    );

  return {
    broadcastId: updated.id,
    status: updated.status,
    jobId: broadcast.queueJobId,
    jobRemoved,
  };
}

@Post(':id/retry')
async retryBroadcast(
  @CurrentBusiness()
  business: { businessId: string },

  @Param('id')
  id: string,
) {
  await this.broadcastsService.prepareBroadcastRetry(
    business.businessId,
    id,
  );

  const broadcast =
    await this.broadcastsService.claimForQueue(
      business.businessId,
      id,
    );

  try {
    const job =
      await this.broadcastQueueService.enqueueBroadcast(
        broadcast.id,
        broadcast.scheduledAt,
      );

    await this.broadcastsService.saveQueueJobId(
      business.businessId,
      broadcast.id,
      job.id!,
    );

    return {
      broadcastId: broadcast.id,
      status: 'QUEUED',
      jobId: job.id,
      scheduledAt: broadcast.scheduledAt,
    };
  } catch (error) {
    await this.broadcastsService.markFailedToQueue(
      business.businessId,
      broadcast.id,
      error instanceof Error
        ? error.message
        : 'Failed to enqueue broadcast retry',
    );

    throw error;
  }
}
}