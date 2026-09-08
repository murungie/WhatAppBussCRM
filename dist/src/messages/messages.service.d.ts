import { PrismaService } from '../prisma/prisma.service';
import { CustomersService } from '../customers/customers.service';
import { WhatsappClientService } from '../whatsapp/whatsapp-client.service';
import { SendMessageDto } from './dto/send-message.dto';
export declare class MessagesService {
    private readonly prisma;
    private readonly customersService;
    private readonly whatsappClient;
    constructor(prisma: PrismaService, customersService: CustomersService, whatsappClient: WhatsappClientService);
    recordInbound(params: {
        businessId: string;
        fromPhoneNumber: string;
        content: string;
        waMessageId?: string;
        contactName?: string;
    }): Promise<{
        inboundMessage: {
            id: string;
            businessId: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            content: string;
            direction: import(".prisma/client").$Enums.Direction;
            waMessageId: string | null;
            status: import(".prisma/client").$Enums.MessageStatus;
        };
        autoReply: null;
        autoReplyError?: undefined;
    } | {
        inboundMessage: {
            id: string;
            businessId: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            content: string;
            direction: import(".prisma/client").$Enums.Direction;
            waMessageId: string | null;
            status: import(".prisma/client").$Enums.MessageStatus;
        };
        autoReply: null;
        autoReplyError: string;
    } | {
        inboundMessage: {
            id: string;
            businessId: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            content: string;
            direction: import(".prisma/client").$Enums.Direction;
            waMessageId: string | null;
            status: import(".prisma/client").$Enums.MessageStatus;
        };
        autoReply: {
            ruleId: string;
            keyword: string;
            message: {
                id: string;
                businessId: string;
                createdAt: Date;
                updatedAt: Date;
                customerId: string;
                content: string;
                direction: import(".prisma/client").$Enums.Direction;
                waMessageId: string | null;
                status: import(".prisma/client").$Enums.MessageStatus;
            };
        };
        autoReplyError?: undefined;
    }>;
    updateMessageStatus(params: {
        businessId: string;
        waMessageId: string;
        status: string;
    }): Promise<{
        id: string;
        businessId: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        content: string;
        direction: import(".prisma/client").$Enums.Direction;
        waMessageId: string | null;
        status: import(".prisma/client").$Enums.MessageStatus;
    } | null>;
    sendReply(businessId: string, dto: SendMessageDto): Promise<{
        id: string;
        businessId: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        content: string;
        direction: import(".prisma/client").$Enums.Direction;
        waMessageId: string | null;
        status: import(".prisma/client").$Enums.MessageStatus;
    }>;
    getInbox(businessId: string): Promise<({
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
    })[]>;
    sendTemplateTest(businessId: string, customerId: string): Promise<{
        message: {
            id: string;
            businessId: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            content: string;
            direction: import(".prisma/client").$Enums.Direction;
            waMessageId: string | null;
            status: import(".prisma/client").$Enums.MessageStatus;
        };
        whatsappResponse: any;
    }>;
}
