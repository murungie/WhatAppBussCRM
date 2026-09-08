import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AutoRepliesService } from './auto-replies.service';
import { CreateAutoReplyDto } from './dto/create-auto-reply.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('auto-replies')
@UseGuards(JwtAuthGuard)
export class AutoRepliesController {
  constructor(
    private readonly autoRepliesService: AutoRepliesService,
  ) {}

  @Post()
  create(
    @Req() req: any,
    @Body() dto: CreateAutoReplyDto,
  ) {
    return this.autoRepliesService.create(
      req.user.businessId,
      dto,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.autoRepliesService.findAll(
      req.user.businessId,
    );
  }

  @Get(':id')
  findOne(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.autoRepliesService.findOne(
      req.user.businessId,
      id,
    );
  }

  @Delete(':id')
  remove(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    return this.autoRepliesService.remove(
      req.user.businessId,
      id,
    );
  }
}