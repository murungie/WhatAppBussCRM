import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    businessId: string,
    dto: CreateOrderDto,
  ) {
    const customer =
      await this.prisma.customer.findFirst({
        where: {
          id: dto.customerId,
          businessId,
        },
      });

    if (!customer) {
      throw new NotFoundException(
        'Customer not found',
      );
    }

    return this.prisma.order.create({
      data: {
        businessId,
        customerId: dto.customerId,
        description: dto.description.trim(),
        amount: dto.amount,
      },
      include: {
        customer: true,
        payment: true,
      },
    });
  }

  async findAll(businessId: string) {
    return this.prisma.order.findMany({
      where: {
        businessId,
      },
      include: {
        customer: true,
        payment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async markPaid(
    businessId: string,
    orderId: string,
    dto: MarkPaidDto,
  ) {
    const order =
      await this.prisma.order.findFirst({
        where: {
          id: orderId,
          businessId,
        },
        include: {
          payment: true,
        },
      });

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    if (order.status === OrderStatus.PAID) {
      throw new ConflictException(
        'Order is already paid',
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new ConflictException(
        'A cancelled order cannot be marked as paid',
      );
    }

    if (order.payment) {
      throw new ConflictException(
        'A payment already exists for this order',
      );
    }

    await this.prisma.$transaction([
      this.prisma.order.update({
        where: {
          id: orderId,
        },
        data: {
          status: OrderStatus.PAID,
        },
      }),

      this.prisma.payment.create({
        data: {
          orderId,
          method: dto.method?.trim() || 'mpesa',
          reference: dto.reference?.trim() || undefined,
        },
      }),

      this.prisma.customer.update({
        where: {
          id: order.customerId,
        },
        data: {
          lastOrderAt: new Date(),
          totalSpent: {
            increment: order.amount,
          },
        },
      }),
    ]);

    return this.prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        customer: true,
        payment: true,
      },
    });
  }

  async cancel(
    businessId: string,
    orderId: string,
  ) {
    const order =
      await this.prisma.order.findFirst({
        where: {
          id: orderId,
          businessId,
        },
      });

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    if (order.status === OrderStatus.PAID) {
      throw new ConflictException(
        'A paid order cannot be cancelled',
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new ConflictException(
        'Order is already cancelled',
      );
    }

    return this.prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: OrderStatus.CANCELLED,
      },
      include: {
        customer: true,
        payment: true,
      },
    });
  }
}
