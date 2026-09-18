import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { UpsertCustomerDto } from './dto/upsert-customer.dto';
import { ConversationService } from '../conversation/conversation.service';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationService: ConversationService,
  ) {}

  // ==========================================================
  // NORMALIZE PHONE NUMBER
  // ==========================================================

  private normalizePhoneNumber(
    phoneNumber: string,
  ): string {
    return phoneNumber
      .trim()
      .replace(/\D/g, '');
  }

  // ==========================================================
  // FIND OR CREATE CUSTOMER
  // ==========================================================

  async findOrCreate(
    businessId: string,
    dto: UpsertCustomerDto,
  ) {
    const phoneNumber =
      this.normalizePhoneNumber(
        dto.phoneNumber,
      );

    if (!phoneNumber) {
      throw new Error(
        'Phone number cannot be empty',
      );
    }

    const existing =
      await this.prisma.customer.findUnique({
        where: {
          businessId_phoneNumber: {
            businessId,
            phoneNumber,
          },
        },
      });

    if (existing) {
      // Update name when WhatsApp/manual input
      // provides a better or newer name.
      if (
        dto.name &&
        dto.name !== existing.name
      ) {
        return this.prisma.customer.update({
          where: {
            id: existing.id,
          },
          data: {
            name: dto.name,
          },
        });
      }

      return existing;
    }

    return this.prisma.customer.create({
      data: {
        businessId,
        phoneNumber,
        name: dto.name,
      },
    });
  }

  // ==========================================================
  // GET ALL CUSTOMERS
  // ==========================================================

   // ==========================================================
  // GET PAGINATED / SEARCHABLE CUSTOMERS
  // ==========================================================

  async findAll(
    businessId: string,
    page = 1,
    limit = 20,
    search?: string,
  ) {
    const safePage =
      Number.isFinite(page) && page > 0
        ? Math.floor(page)
        : 1;

    const safeLimit =
      Number.isFinite(limit) && limit > 0
        ? Math.min(Math.floor(limit), 100)
        : 20;

    const normalizedSearch =
      search?.trim();

    const where = {
      businessId,
      ...(normalizedSearch
        ? {
            OR: [
              {
                name: {
                  contains: normalizedSearch,
                  mode: 'insensitive' as const,
                },
              },
              {
                phoneNumber: {
                  contains: normalizedSearch,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };

    const skip =
      (safePage - 1) * safeLimit;

    const [total, customers] =
      await Promise.all([
        this.prisma.customer.count({
          where,
        }),

        this.prisma.customer.findMany({
          where,
          orderBy: [
            {
              updatedAt: 'desc',
            },
            {
              createdAt: 'desc',
            },
          ],
          skip,
          take: safeLimit,
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            lastOrderAt: true,
            lastInboundAt: true,
            totalSpent: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                messages: true,
                orders: true,
              },
            },
          },
        }),
      ]);

    const totalPages =
      Math.ceil(total / safeLimit);

    return {
      data: customers,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNextPage:
          safePage < totalPages,
        hasPreviousPage:
          safePage > 1,
      },
    };
  }

  // ==========================================================
  // GET CUSTOMER BY ID
  // ==========================================================

  async findOne(
    businessId: string,
    id: string,
  ) {
    const customer =
      await this.prisma.customer.findFirst({
        where: {
          id,
          businessId,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          orders: {
            orderBy: {
              createdAt: 'desc',
            },
            include: {
              payment: true,
            },
          },
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    return customer;
  }

  // ==========================================================
  // FIND INACTIVE CUSTOMERS
  // ==========================================================

  async findInactive(
    businessId: string,
    days: number,
  ) {
    const cutoff = new Date();

    cutoff.setDate(
      cutoff.getDate() - days,
    );

    return this.prisma.customer.findMany({
      where: {
        businessId,
        OR: [
          {
            lastOrderAt: null,
          },
          {
            lastOrderAt: {
              lt: cutoff,
            },
          },
        ],
      },
    });
  }

  async getConversationStatus(
  businessId: string,
  customerId: string,
) {
  const customer =
    await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        businessId,
      },
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        lastInboundAt: true,
      },
    });

  if (!customer) {
    throw new NotFoundException(
      'Customer not found',
    );
  }

  return {
    customer: {
      id: customer.id,
      phoneNumber: customer.phoneNumber,
      name: customer.name,
    },

    conversation:
      this.conversationService.getConversationStatus(
        customer.lastInboundAt,
      ),
  };
}
}