import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';
import { ConnectWhatsAppDto } from './dto/connect-whatsapp.dto';
import { WhatsAppConnectionService } from './whatsapp-connection.service';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly whatsappConnectionService: WhatsAppConnectionService,
  ) {}

  @Get()
  getSettings(
    @CurrentBusiness()
    business: { businessId: string },
  ) {
    return this.settingsService.getSettings(
      business.businessId,
    );
  }

  
  @Patch()
  updateSettings(
    @CurrentBusiness()
    business: { businessId: string },
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(
      business.businessId,
      dto,
    );
  }

  @Post('whatsapp/connect')
connectWhatsApp(
  @CurrentBusiness()
  business: { businessId: string },
  @Body() dto: ConnectWhatsAppDto,
) {
  return this.whatsappConnectionService.connect(
    business.businessId,
    dto,
  );
}

}
