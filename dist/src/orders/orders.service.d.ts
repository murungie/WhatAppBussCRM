import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { MarkPaidDto } from './dto/mark-paid.dto';
export declare class OrdersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(businessId: string, dto: CreateOrderDto): Promise<{
        id: string;
        businessId: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        description: string;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAll(businessId: string): Promise<({
        customer: {
            id: string;
            businessId: string;
            phoneNumber: string;
            name: string | null;
            lastOrderAt: Date | null;
            lastInboundAt: Date | null;
            totalSpent: import("@prisma/client/runtime/library").Decimal;
            createdAt: Date;
            updatedAt: Date;
        };
        payment: {
            id: string;
            method: string;
            reference: string | null;
            paidAt: Date;
            orderId: string;
        } | null;
    } & {
        id: string;
        businessId: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        description: string;
        amount: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    markPaid(businessId: string, orderId: string, dto: MarkPaidDto): Promise<{
        id: string;
        businessId: string;
        phoneNumber: string;
        name: string | null;
        lastOrderAt: Date | null;
        lastInboundAt: Date | null;
        totalSpent: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }>;
    cancel(businessId: string, orderId: string): Promise<{
        id: string;
        businessId: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        description: string;
        amount: import("@prisma/client/runtime/library").Decimal;
    }>;
}
