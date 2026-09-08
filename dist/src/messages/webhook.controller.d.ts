import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from './messages.service';
export declare class WebhookController {
    private readonly config;
    private readonly prisma;
    private readonly messagesService;
    private readonly logger;
    constructor(config: ConfigService, prisma: PrismaService, messagesService: MessagesService);
    verify(mode: string, token: string, challenge: string, res: Response): Response<any, Record<string, any>>;
    receive(payload: any, res: Response): Promise<void>;
    private processInboundMessage;
    private processMessageStatus;
}
