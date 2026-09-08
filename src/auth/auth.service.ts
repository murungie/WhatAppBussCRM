import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
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
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const business = await this.prisma.business.create({
      data: {
        name: dto.businessName,
        ownerEmail: dto.email,
        passwordHash,
      },
    });

    return this.buildToken(business.id, business.ownerEmail);
  }

  async login(dto: LoginDto) {
    const business = await this.prisma.business.findUnique({
      where: { ownerEmail: dto.email },
    });
    if (!business) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, business.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.buildToken(business.id, business.ownerEmail);
  }

  private buildToken(businessId: string, email: string) {
    const payload = { sub: businessId, email };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
