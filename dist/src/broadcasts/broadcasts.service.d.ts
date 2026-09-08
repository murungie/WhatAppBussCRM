import { PrismaService } from '../prisma/prisma.service';
import { ConversationService } from '../conversation/conversation.service';
import { WhatsappClientService } from '../whatsapp/whatsapp-client.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
export declare class BroadcastsService {
    private readonly prisma;
    private readonly whatsappClient;
    private readonly conversationService;
    constructor(prisma: PrismaService, whatsappClient: WhatsappClientService, conversationService: ConversationService);
    create(businessId: string, dto: CreateBroadcastDto): Promise<{
        id: string;
        businessId: string;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        templateName: string | null;
        status: import(".prisma/client").$Enums.BroadcastStatus;
        type: import(".prisma/client").$Enums.BroadcastType;
        templateLanguage: string | null;
        templateParameters: import("@prisma/client/runtime/library").JsonValue | null;
        segment: string;
        totalRecipients: number;
        sentCount: number;
        failedCount: number;
        scheduledAt: Date | null;
        sentAt: Date | null;
    }>;
    findAll(businessId: string): Promise<({
        _count: {
            recipients: number;
        };
    } & {
        id: string;
        businessId: string;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        templateName: string | null;
        status: import(".prisma/client").$Enums.BroadcastStatus;
        type: import(".prisma/client").$Enums.BroadcastType;
        templateLanguage: string | null;
        templateParameters: import("@prisma/client/runtime/library").JsonValue | null;
        segment: string;
        totalRecipients: number;
        sentCount: number;
        failedCount: number;
        scheduledAt: Date | null;
        sentAt: Date | null;
    })[]>;
    findOne(businessId: string, broadcastId: string): Promise<{
        recipients: ({
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
        } & {
            error: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            waMessageId: string | null;
            status: import(".prisma/client").$Enums.BroadcastRecipientStatus;
            sentAt: Date | null;
            broadcastId: string;
        })[];
    } & {
        id: string;
        businessId: string;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        templateName: string | null;
        status: import(".prisma/client").$Enums.BroadcastStatus;
        type: import(".prisma/client").$Enums.BroadcastType;
        templateLanguage: string | null;
        templateParameters: import("@prisma/client/runtime/library").JsonValue | null;
        segment: string;
        totalRecipients: number;
        sentCount: number;
        failedCount: number;
        scheduledAt: Date | null;
        sentAt: Date | null;
    }>;
    addRecipients(businessId: string, broadcastId: string, customerIds: string[]): Promise<{
        recipients: ({
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
        } & {
            error: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            waMessageId: string | null;
            status: import(".prisma/client").$Enums.BroadcastRecipientStatus;
            sentAt: Date | null;
            broadcastId: string;
        })[];
    } & {
        id: string;
        businessId: string;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        templateName: string | null;
        status: import(".prisma/client").$Enums.BroadcastStatus;
        type: import(".prisma/client").$Enums.BroadcastType;
        templateLanguage: string | null;
        templateParameters: import("@prisma/client/runtime/library").JsonValue | null;
        segment: string;
        totalRecipients: number;
        sentCount: number;
        failedCount: number;
        scheduledAt: Date | null;
        sentAt: Date | null;
    }>;
    private resolveTemplateParameters;
    sendBroadcast(businessId: string, broadcastId: string): Promise<{
        recipients: ({
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
        } & {
            error: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string;
            waMessageId: string | null;
            status: import(".prisma/client").$Enums.BroadcastRecipientStatus;
            sentAt: Date | null;
            broadcastId: string;
        })[];
    } & {
        id: string;
        businessId: string;
        createdAt: Date;
        updatedAt: Date;
        message: string | null;
        templateName: string | null;
        status: import(".prisma/client").$Enums.BroadcastStatus;
        type: import(".prisma/client").$Enums.BroadcastType;
        templateLanguage: string | null;
        templateParameters: import("@prisma/client/runtime/library").JsonValue | null;
        segment: string;
        totalRecipients: number;
        sentCount: number;
        failedCount: number;
        scheduledAt: Date | null;
        sentAt: Date | null;
    }>;
    updateRecipientStatus(businessId: string, waMessageId: string, status: 'SENT' | 'FAILED', error?: string): Promise<{
        error: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string;
        waMessageId: string | null;
        status: import(".prisma/client").$Enums.BroadcastRecipientStatus;
        sentAt: Date | null;
        broadcastId: string;
    } | null>;
}
