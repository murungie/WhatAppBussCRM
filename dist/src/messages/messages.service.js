"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const customers_service_1 = require("../customers/customers.service");
const whatsapp_client_service_1 = require("../whatsapp/whatsapp-client.service");
let MessagesService = class MessagesService {
    prisma;
    customersService;
    whatsappClient;
    constructor(prisma, customersService, whatsappClient) {
        this.prisma = prisma;
        this.customersService = customersService;
        this.whatsappClient = whatsappClient;
    }
    async recordInbound(params) {
        const customer = await this.customersService.findOrCreate(params.businessId, {
            phoneNumber: params.fromPhoneNumber,
            name: params.contactName,
        });
        await this.prisma.customer.update({
            where: {
                id: customer.id,
            },
            data: {
                lastInboundAt: new Date(),
            },
        });
        const inboundMessage = await this.prisma.message.create({
            data: {
                businessId: params.businessId,
                customerId: customer.id,
                direction: client_1.Direction.INBOUND,
                content: params.content,
                waMessageId: params.waMessageId,
                status: client_1.MessageStatus.SENT,
            },
        });
        const incomingText = params.content.trim().toLowerCase();
        const autoReplyRules = await this.prisma.autoReplyRule.findMany({
            where: {
                businessId: params.businessId,
                isActive: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        const matchedRule = autoReplyRules.find((rule) => {
            const keyword = rule.keyword.trim().toLowerCase();
            return (keyword.length > 0 &&
                incomingText.includes(keyword));
        });
        if (!matchedRule) {
            return {
                inboundMessage,
                autoReply: null,
            };
        }
        const business = await this.prisma.business.findUnique({
            where: {
                id: params.businessId,
            },
            select: {
                id: true,
                whatsappPhoneId: true,
                whatsappToken: true,
            },
        });
        if (!business ||
            !business.whatsappPhoneId ||
            !business.whatsappToken) {
            return {
                inboundMessage,
                autoReply: null,
                autoReplyError: 'WhatsApp is not connected for this business',
            };
        }
        let replyResult;
        const phoneNumber = customer.phoneNumber.replace(/\D/g, '');
        if (!phoneNumber) {
            return {
                inboundMessage,
                autoReply: null,
                autoReplyError: 'Customer does not have a valid WhatsApp phone number',
            };
        }
        try {
            replyResult =
                await this.whatsappClient.sendTextMessage({
                    phoneNumberId: business.whatsappPhoneId,
                    accessToken: business.whatsappToken,
                    to: phoneNumber,
                    body: matchedRule.response,
                });
        }
        catch (error) {
            return {
                inboundMessage,
                autoReply: null,
                autoReplyError: error instanceof Error
                    ? error.message
                    : 'Failed to send auto-reply',
            };
        }
        const waMessageId = replyResult?.messages?.[0]?.id ?? null;
        if (!waMessageId) {
            return {
                inboundMessage,
                autoReply: null,
                autoReplyError: 'WhatsApp accepted the request but did not return a message ID',
            };
        }
        const outboundMessage = await this.prisma.message.create({
            data: {
                businessId: params.businessId,
                customerId: customer.id,
                direction: client_1.Direction.OUTBOUND,
                content: matchedRule.response,
                waMessageId,
                status: client_1.MessageStatus.SENT,
            },
        });
        return {
            inboundMessage,
            autoReply: {
                ruleId: matchedRule.id,
                keyword: matchedRule.keyword,
                message: outboundMessage,
            },
        };
    }
    async updateMessageStatus(params) {
        const normalizedStatus = params.status.trim().toUpperCase();
        const allowedStatuses = [
            'SENT',
            'DELIVERED',
            'READ',
            'FAILED',
        ];
        if (!allowedStatuses.includes(normalizedStatus)) {
            return null;
        }
        const message = await this.prisma.message.findFirst({
            where: {
                waMessageId: params.waMessageId,
                businessId: params.businessId,
            },
        });
        if (!message) {
            return null;
        }
        return this.prisma.message.update({
            where: {
                id: message.id,
            },
            data: {
                status: normalizedStatus,
            },
        });
    }
    async sendReply(businessId, dto) {
        const content = dto.content?.trim();
        if (!content) {
            throw new common_1.NotFoundException('Message content cannot be empty');
        }
        const business = await this.prisma.business.findUnique({
            where: {
                id: businessId,
            },
            select: {
                id: true,
                whatsappPhoneId: true,
                whatsappToken: true,
            },
        });
        if (!business ||
            !business.whatsappPhoneId ||
            !business.whatsappToken) {
            throw new common_1.NotFoundException('WhatsApp is not connected for this business yet. Complete WhatsApp setup first.');
        }
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: dto.customerId,
                businessId,
            },
            select: {
                id: true,
                phoneNumber: true,
                name: true,
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        const phoneNumber = customer.phoneNumber.replace(/\D/g, '');
        if (!phoneNumber) {
            throw new common_1.NotFoundException('Customer does not have a valid WhatsApp phone number');
        }
        const result = await this.whatsappClient.sendTextMessage({
            phoneNumberId: business.whatsappPhoneId,
            accessToken: business.whatsappToken,
            to: phoneNumber,
            body: content,
        });
        const waMessageId = result?.messages?.[0]?.id ?? null;
        if (!waMessageId) {
            throw new Error('WhatsApp accepted the request but did not return a message ID');
        }
        return this.prisma.message.create({
            data: {
                businessId,
                customerId: customer.id,
                direction: client_1.Direction.OUTBOUND,
                content,
                waMessageId,
                status: client_1.MessageStatus.SENT,
            },
        });
    }
    async getInbox(businessId) {
        const customers = await this.prisma.customer.findMany({
            where: {
                businessId,
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    take: 1,
                },
            },
        });
        return customers
            .filter((customer) => customer.messages.length > 0)
            .sort((a, b) => b.messages[0].createdAt.getTime() -
            a.messages[0].createdAt.getTime());
    }
    async sendTemplateTest(businessId, customerId) {
        const business = await this.prisma.business.findUnique({
            where: {
                id: businessId,
            },
            select: {
                whatsappPhoneId: true,
                whatsappToken: true,
            },
        });
        if (!business?.whatsappPhoneId ||
            !business.whatsappToken) {
            throw new common_1.NotFoundException('WhatsApp is not connected');
        }
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: customerId,
                businessId,
            },
            select: {
                id: true,
                phoneNumber: true,
                name: true,
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        const result = await this.whatsappClient.sendTemplateMessage({
            phoneNumberId: business.whatsappPhoneId,
            accessToken: business.whatsappToken,
            to: customer.phoneNumber,
            templateName: 'jaspers_market_order_confirmation_v1',
            languageCode: 'en_US',
            parameters: [
                customer.name ?? 'Customer',
                '123456',
                'Sep 7, 2026',
            ],
        });
        const waMessageId = result?.messages?.[0]?.id ?? null;
        if (!waMessageId) {
            throw new Error('WhatsApp accepted the template request but returned no message ID');
        }
        const message = await this.prisma.message.create({
            data: {
                businessId,
                customerId: customer.id,
                direction: 'OUTBOUND',
                content: `[Template: jaspers_market_order_confirmation_v1]`,
                waMessageId,
                status: 'SENT',
            },
        });
        return {
            message,
            whatsappResponse: result,
        };
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        customers_service_1.CustomersService,
        whatsapp_client_service_1.WhatsappClientService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map