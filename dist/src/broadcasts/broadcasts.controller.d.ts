import { AddRecipientsDto } from './dto/add-recipients.dto';
import { BroadcastsService } from './broadcasts.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
export declare class BroadcastsController {
    private readonly broadcastsService;
    constructor(broadcastsService: BroadcastsService);
    create(business: {
        businessId: string;
    }, dto: CreateBroadcastDto): Promise<{
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
    findAll(business: {
        businessId: string;
    }): Promise<({
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
    findOne(business: {
        businessId: string;
    }, id: string): Promise<{
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
    addRecipients(business: {
        businessId: string;
    }, id: string, dto: AddRecipientsDto): Promise<{
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
    sendBroadcast(business: {
        businessId: string;
    }, id: string): Promise<{
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
}
