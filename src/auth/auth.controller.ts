import {
  Body,
  Controller,
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
}