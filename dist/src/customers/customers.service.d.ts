import { PrismaService } from '../prisma/prisma.service';
import { UpsertCustomerDto } from './dto/upsert-customer.dto';
import { ConversationService } from '../conversation/conversation.service';
export declare class CustomersService {
    private readonly prisma;
    private readonly conversationService;
    constructor(prisma: PrismaService, conversationService: ConversationService);
    private normalizePhoneNumber;
    findOrCreate(businessId: string, dto: UpsertCustomerDto): Promise<{
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
    findAll(businessId: string): Promise<{
        id: string;
        businessId: string;
        phoneNumber: string;
        name: string | null;
        lastOrderAt: Date | null;
        lastInboundAt: Date | null;
        totalSpent: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(businessId: string, id: string): Promise<{
        messages: {
            id: string;
            businessId: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            content: string;
            direction: import(".prisma/client").$Enums.Direction;
            waMessageId: string | null;
            status: import(".prisma/client").$Enums.MessageStatus;
        }[];
        orders: ({
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
        })[];
    } & {
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
    findInactive(businessId: string, days: number): Promise<{
        id: string;
        businessId: string;
        phoneNumber: string;
        name: string | null;
        lastOrderAt: Date | null;
        lastInboundAt: Date | null;
        totalSpent: import("@prisma/client/runtime/library").Decimal;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getConversationStatus(businessId: string, customerId: string): Promise<{
        customer: {
            id: string;
            phoneNumber: string;
            name: string | null;
        };
        conversation: {
            isOpen: boolean;
            lastInboundAt: Date | null;
            expiresAt: Date | null;
            remainingMs: number;
        };
    }>;
}
