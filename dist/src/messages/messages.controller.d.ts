import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    getInbox(business: {
        businessId: string;
    }): Promise<({
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
    sendReply(business: {
        businessId: string;
    }, dto: SendMessageDto): Promise<{
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
}
