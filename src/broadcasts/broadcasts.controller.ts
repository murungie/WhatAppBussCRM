import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { AddRecipientsDto } from './dto/add-recipients.dto';
import { BroadcastsService } from './broadcasts.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';

@Controller('broadcasts')
@UseGuards(JwtAuthGuard)
export class BroadcastsController {
  constructor(
    private readonly broadcastsService: BroadcastsService,
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

  @Get()
  findAll(
    @CurrentBusiness()
    business: { businessId: string },
  ) {
    return this.broadcastsService.findAll(
      business.businessId,
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
sendBroadcast(
  @CurrentBusiness()
  business: { businessId: string },

  @Param('id')
  id: string,
) {
  return this.broadcastsService.sendBroadcast(
    business.businessId,
    id,
  );
}
}