import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';

import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
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
}
