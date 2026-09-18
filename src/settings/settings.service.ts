import {
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getSettings(businessId: string) {
    const business =
      await this.prisma.business.findUnique({
        where: {
          id: businessId,
        },
        select: {
          id: true,
          name: true,
          ownerEmail: true,
          whatsappPhoneId: true,
          whatsappToken: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    if (!business) {
      throw new ConflictException(
        'Business configuration not found',
      );
    }

    return {
      id: business.id,
      businessName: business.name,
      ownerEmail: business.ownerEmail,
      whatsappPhoneId: business.whatsappPhoneId,
      whatsappConfigured:
        Boolean(
          business.whatsappPhoneId &&
          business.whatsappToken,
        ),
      whatsappTokenConfigured:
        Boolean(business.whatsappToken),
      whatsappTokenMasked:
        business.whatsappToken
          ? `••••••••${business.whatsappToken.slice(-4)}`
          : null,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
    };
  }

  async updateSettings(
    businessId: string,
    dto: UpdateSettingsDto,
  ) {
    const existing =
      await this.prisma.business.findUnique({
        where: {
          id: businessId,
        },
      });

    if (!existing) {
      throw new ConflictException(
        'Business configuration not found',
      );
    }

    if (
      dto.ownerEmail &&
      dto.ownerEmail.toLowerCase() !==
        existing.ownerEmail.toLowerCase()
    ) {
      const emailOwner =
        await this.prisma.business.findUnique({
          where: {
            ownerEmail: dto.ownerEmail,
          },
        });

      if (
        emailOwner &&
        emailOwner.id !== businessId
      ) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
    }

    const data: {
      name?: string;
      ownerEmail?: string;
      whatsappPhoneId?: string;
      whatsappToken?: string;
    } = {};

    if (dto.businessName !== undefined) {
      data.name = dto.businessName.trim();
    }

    if (dto.ownerEmail !== undefined) {
      data.ownerEmail =
        dto.ownerEmail.trim().toLowerCase();
    }

    if (dto.whatsappPhoneId !== undefined) {
      data.whatsappPhoneId =
        dto.whatsappPhoneId.trim();
    }

    if (dto.whatsappToken !== undefined) {
      data.whatsappToken =
        dto.whatsappToken.trim();
    }

    await this.prisma.business.update({
      where: {
        id: businessId,
      },
      data,
    });

    return this.getSettings(businessId);
  }
}
