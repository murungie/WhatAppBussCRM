import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, dto: CreateOrderDto) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, businessId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    return this.prisma.order.create({
      data: {
        businessId,
        customerId: dto.customerId,
        description: dto.description,
        amount: dto.amount,
      },
    });
  }

  async findAll(businessId: string) {
    return this.prisma.order.findMany({
      where: { businessId },
      include: { customer: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markPaid(businessId: string, orderId: string, dto: MarkPaidDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, businessId },
    });
    if (!order) throw new NotFoundException('Order not found');

    const [, , updatedCustomer] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PAID },
      }),
      this.prisma.payment.create({
        data: {
          orderId,
          method: dto.method ?? 'mpesa',
          reference: dto.reference,
        },
      }),
      this.prisma.customer.update({
        where: { id: order.customerId },
        data: {
          lastOrderAt: new Date(),
          totalSpent: { increment: order.amount },
        },
      }),
    ]);

    return updatedCustomer;
  }

  async cancel(businessId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, businessId },
    });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });
  }
}
