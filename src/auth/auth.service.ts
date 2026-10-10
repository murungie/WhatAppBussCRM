import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.business.findUnique({
      where: { ownerEmail: dto.email },
    });

    if (existing) {
      throw new ConflictException(
        'An account with this email already exists',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const business = await this.prisma.business.create({
      data: {
        name: dto.businessName,
        ownerEmail: dto.email,
        passwordHash,
        onboardingStatus: 'PROFILE_PENDING',
        accountStatus: 'ACTIVE',
      },
    });

    return this.buildToken(
      business.id,
      business.ownerEmail,
      business.onboardingStatus,
    );
  }

  async login(dto: LoginDto) {
    const business = await this.prisma.business.findUnique({
      where: { ownerEmail: dto.email },
    });

    if (!business) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      business.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildToken(
      business.id,
      business.ownerEmail,
      business.onboardingStatus,
    );
  }

  async me(businessId: string) {
  const business = await this.prisma.business.findUnique({
    where: {
      id: businessId,
    },
    select: {
      id: true,
      name: true,
      ownerEmail: true,
      businessPhone: true,
      industry: true,
      whatsappPhoneId: true,
      onboardingStatus: true,
      accountStatus: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!business) {
    throw new UnauthorizedException('Business account not found');
  }

  return business;
}


async completeProfile(
  businessId: string,
  dto: CompleteProfileDto,
) {
  const business = await this.prisma.business.findUnique({
    where: {
      id: businessId,
    },
  });

  if (!business) {
    throw new UnauthorizedException('Business account not found');
  }

  const updatedBusiness = await this.prisma.business.update({
    where: {
      id: businessId,
    },
    data: {
      ...(dto.businessName !== undefined && {
        name: dto.businessName,
      }),
      businessPhone: dto.businessPhone,
      industry: dto.industry,
      onboardingStatus: 'WHATSAPP_PENDING',
    },
    select: {
      id: true,
      name: true,
      ownerEmail: true,
      businessPhone: true,
      industry: true,
      whatsappPhoneId: true,
      onboardingStatus: true,
      accountStatus: true,
    },
  });

  return updatedBusiness;
}
  private buildToken(
    businessId: string,
    email: string,
    onboardingStatus: string,
  ) {
    const payload = {
      sub: businessId,
      email,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      onboardingStatus,
    };
  }
}