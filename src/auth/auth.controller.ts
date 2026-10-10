import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  Throttle,
  ThrottlerGuard,
} from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';

import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentBusiness } from '../common/decorators/current-business.decorator';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  register(
    @Body() dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({
    default: {
      limit: 5,
      ttl: 60_000,
    },
  })
  login(
    @Body() dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(
    @CurrentBusiness()
    business: { businessId: string; email: string },
  ) {
    return this.authService.me(business.businessId);
  }

  @Post('onboarding/profile')
  @UseGuards(JwtAuthGuard)
  completeProfile(
    @CurrentBusiness()
    business: { businessId: string; email: string },

    @Body()
    dto: CompleteProfileDto,
  ) {
    return this.authService.completeProfile(
      business.businessId,
      dto,
    );
  }
}