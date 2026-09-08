import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
  ) {}

  @Get('inbox')
  getInbox(
    @CurrentBusiness() business: { businessId: string },
  ) {
    return this.messagesService.getInbox(
      business.businessId,
    );
  }

  @Post('send')
  sendReply(
    @CurrentBusiness() business: { businessId: string },
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendReply(
      business.businessId,
      dto,
    );
  }

  
}