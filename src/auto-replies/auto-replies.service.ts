import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateAutoReplyDto } from './dto/create-auto-reply.dto';

@Injectable()
export class AutoRepliesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    businessId: string,
    dto: CreateAutoReplyDto,
  ) {
    const keyword = dto.keyword.trim().toLowerCase();

    const existing =
      await this.prisma.autoReplyRule.findFirst({
        where: {
          businessId,
          keyword,
        },
      });

    if (existing) {
      throw new ConflictException(
        'An auto-reply rule with this keyword already exists',
      );
    }

    return this.prisma.autoReplyRule.create({
      data: {
        businessId,
        keyword,
        response: dto.response.trim(),
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(businessId: string) {
    return this.prisma.autoReplyRule.findMany({
      where: {
        businessId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(
    businessId: string,
    id: string,
  ) {
    const rule =
      await this.prisma.autoReplyRule.findFirst({
        where: {
          id,
          businessId,
        },
      });

    if (!rule) {
      throw new NotFoundException(
        'Auto-reply rule not found',
      );
    }

    return rule;
  }

  async remove(
    businessId: string,
    id: string,
  ) {
    await this.findOne(businessId, id);

    return this.prisma.autoReplyRule.delete({
      where: {
        id,
      },
    });
  }
}