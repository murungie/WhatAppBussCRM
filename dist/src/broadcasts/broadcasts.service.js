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
exports.BroadcastsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const conversation_service_1 = require("../conversation/conversation.service");
const whatsapp_client_service_1 = require("../whatsapp/whatsapp-client.service");
let BroadcastsService = class BroadcastsService {
    prisma;
    whatsappClient;
    conversationService;
    constructor(prisma, whatsappClient, conversationService) {
        this.prisma = prisma;
        this.whatsappClient = whatsappClient;
        this.conversationService = conversationService;
    }
    async create(businessId, dto) {
        const type = dto.type ?? 'TEXT';
        if (type === 'TEXT') {
            if (!dto.message?.trim()) {
                throw new common_1.ConflictException('Text broadcasts require a message');
            }
            return this.prisma.broadcast.create({
                data: {
                    businessId,
                    type: 'TEXT',
                    message: dto.message.trim(),
                    segment: dto.segment?.trim() || 'ALL',
                },
            });
        }
        if (type === 'TEMPLATE') {
            if (!dto.templateName?.trim()) {
                throw new common_1.ConflictException('Template broadcasts require a template name');
            }
            if (!dto.templateLanguage?.trim()) {
                throw new common_1.ConflictException('Template broadcasts require a template language');
            }
            return this.prisma.broadcast.create({
                data: {
                    businessId,
                    type: 'TEMPLATE',
                    templateName: dto.templateName.trim(),
                    templateLanguage: dto.templateLanguage.trim(),
                    templateParameters: dto.templateParameters ?? [],
                    segment: dto.segment?.trim() || 'ALL',
                },
            });
        }
        throw new common_1.ConflictException(`Unsupported broadcast type: ${type}`);
    }
    async findAll(businessId) {
        return this.prisma.broadcast.findMany({
            where: {
                businessId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                _count: {
                    select: {
                        recipients: true,
                    },
                },
            },
        });
    }
    async findOne(businessId, broadcastId) {
        const broadcast = await this.prisma.broadcast.findFirst({
            where: {
                id: broadcastId,
                businessId,
            },
            include: {
                recipients: {
                    include: {
                        customer: true,
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        });
        if (!broadcast) {
            throw new common_1.NotFoundException('Broadcast not found');
        }
        return broadcast;
    }
    async addRecipients(businessId, broadcastId, customerIds) {
        const broadcast = await this.prisma.broadcast.findFirst({
            where: {
                id: broadcastId,
                businessId,
            },
        });
        if (!broadcast) {
            throw new common_1.NotFoundException('Broadcast not found');
        }
        if (broadcast.status !== 'DRAFT') {
            throw new common_1.ConflictException('Recipients can only be added to a draft broadcast');
        }
        if (!customerIds?.length) {
            throw new common_1.ConflictException('At least one customer ID is required');
        }
        const uniqueCustomerIds = [
            ...new Set(customerIds),
        ];
        const customers = await this.prisma.customer.findMany({
            where: {
                id: {
                    in: uniqueCustomerIds,
                },
                businessId,
            },
            select: {
                id: true,
            },
        });
        const validCustomerIds = customers.map((customer) => customer.id);
        if (validCustomerIds.length === 0) {
            throw new common_1.NotFoundException('No valid customers found');
        }
        await this.prisma.broadcastRecipient.createMany({
            data: validCustomerIds.map((customerId) => ({
                broadcastId,
                customerId,
            })),
            skipDuplicates: true,
        });
        const totalRecipients = await this.prisma.broadcastRecipient.count({
            where: {
                broadcastId,
            },
        });
        return this.prisma.broadcast.update({
            where: {
                id: broadcastId,
            },
            data: {
                totalRecipients,
            },
            include: {
                recipients: {
                    include: {
                        customer: true,
                    },
                },
            },
        });
    }
    resolveTemplateParameters(rawParameters, context) {
        if (!Array.isArray(rawParameters)) {
            return [];
        }
        return rawParameters.map((parameter) => {
            if (typeof parameter !== 'string') {
                return '';
            }
            return parameter
                .replace(/\{\{customer\.name\}\}/g, context.customer.name ??
                'Customer')
                .replace(/\{\{customer\.phone\}\}/g, context.customer.phoneNumber)
                .replace(/\{\{customer\.id\}\}/g, context.customer.id)
                .replace(/\{\{broadcast\.id\}\}/g, context.broadcast.id)
                .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }));
        });
    }
    async sendBroadcast(businessId, broadcastId) {
        const broadcast = await this.prisma.broadcast.findFirst({
            where: {
                id: broadcastId,
                businessId,
            },
            include: {
                recipients: {
                    where: {
                        status: {
                            in: [
                                'PENDING',
                                'FAILED',
                            ],
                        },
                    },
                    include: {
                        customer: true,
                    },
                },
            },
        });
        if (!broadcast) {
            throw new common_1.NotFoundException('Broadcast not found');
        }
        if (broadcast.status === 'COMPLETED') {
            throw new common_1.ConflictException('Broadcast has already completed');
        }
        if (broadcast.status !== 'DRAFT' &&
            broadcast.status !== 'FAILED') {
            throw new common_1.ConflictException(`Broadcast cannot be sent while in ${broadcast.status} status`);
        }
        if (broadcast.recipients.length === 0) {
            throw new common_1.ConflictException('Broadcast has no pending or retryable recipients');
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
        if (!business?.whatsappPhoneId ||
            !business.whatsappToken) {
            throw new common_1.NotFoundException('WhatsApp is not connected for this business yet');
        }
        await this.prisma.broadcast.update({
            where: {
                id: broadcastId,
            },
            data: {
                status: 'PROCESSING',
                failedCount: 0,
            },
        });
        let sentCount = 0;
        let failedCount = 0;
        for (const recipient of broadcast.recipients) {
            try {
                const phoneNumber = recipient.customer.phoneNumber
                    .trim()
                    .replace(/\D/g, '');
                if (!phoneNumber) {
                    throw new Error('Customer does not have a valid WhatsApp phone number');
                }
                const eligibility = this.conversationService
                    .getMessagingEligibility(recipient.customer.lastInboundAt);
                let result;
                let messageContent;
                if (broadcast.type === 'TEXT') {
                    if (!eligibility.canSendFreeForm) {
                        await this.prisma.broadcastRecipient.update({
                            where: {
                                id: recipient.id,
                            },
                            data: {
                                status: 'WINDOW_EXPIRED',
                                error: 'Customer conversation window has expired. A WhatsApp template is required.',
                            },
                        });
                        failedCount++;
                        continue;
                    }
                    if (!broadcast.message?.trim()) {
                        throw new Error('Text broadcast has no message');
                    }
                    result =
                        await this.whatsappClient.sendTextMessage({
                            phoneNumberId: business.whatsappPhoneId,
                            accessToken: business.whatsappToken,
                            to: phoneNumber,
                            body: broadcast.message,
                        });
                    messageContent =
                        broadcast.message;
                }
                else if (broadcast.type === 'TEMPLATE') {
                    if (!broadcast.templateName ||
                        !broadcast.templateLanguage) {
                        throw new Error('Template broadcast is missing template configuration');
                    }
                    const parameters = this.resolveTemplateParameters(broadcast.templateParameters, {
                        customer: {
                            id: recipient.customer.id,
                            name: recipient.customer.name,
                            phoneNumber: recipient.customer.phoneNumber,
                        },
                        broadcast: {
                            id: broadcast.id,
                        },
                    });
                    result =
                        await this.whatsappClient.sendTemplateMessage({
                            phoneNumberId: business.whatsappPhoneId,
                            accessToken: business.whatsappToken,
                            to: phoneNumber,
                            templateName: broadcast.templateName,
                            languageCode: broadcast.templateLanguage,
                            parameters,
                        });
                    messageContent =
                        `[Template: ${broadcast.templateName}]`;
                }
                else {
                    throw new Error(`Unsupported broadcast type: ${broadcast.type}`);
                }
                const waMessageId = result?.messages?.[0]?.id ??
                    null;
                if (!waMessageId) {
                    throw new Error('WhatsApp accepted the request but returned no message ID');
                }
                await this.prisma.broadcastRecipient.update({
                    where: {
                        id: recipient.id,
                    },
                    data: {
                        status: 'SENT',
                        waMessageId,
                        sentAt: new Date(),
                        error: null,
                    },
                });
                await this.prisma.message.create({
                    data: {
                        businessId,
                        customerId: recipient.customerId,
                        direction: 'OUTBOUND',
                        content: messageContent,
                        waMessageId,
                        status: 'SENT',
                    },
                });
                sentCount++;
            }
            catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : 'Unknown WhatsApp error';
                await this.prisma.broadcastRecipient.update({
                    where: {
                        id: recipient.id,
                    },
                    data: {
                        status: 'FAILED',
                        error: errorMessage,
                    },
                });
                failedCount++;
            }
        }
        const finalStatus = sentCount > 0
            ? 'COMPLETED'
            : 'FAILED';
        return this.prisma.broadcast.update({
            where: {
                id: broadcastId,
            },
            data: {
                sentCount,
                failedCount,
                sentAt: new Date(),
                status: finalStatus,
            },
            include: {
                recipients: {
                    include: {
                        customer: true,
                    },
                },
            },
        });
    }
    async updateRecipientStatus(businessId, waMessageId, status, error) {
        const recipient = await this.prisma.broadcastRecipient.findFirst({
            where: {
                waMessageId,
                broadcast: {
                    businessId,
                },
            },
        });
        if (!recipient) {
            return null;
        }
        return this.prisma.broadcastRecipient.update({
            where: {
                id: recipient.id,
            },
            data: {
                status,
                error: error ??
                    (status === 'FAILED'
                        ? 'WhatsApp delivery failed'
                        : null),
            },
        });
    }
};
exports.BroadcastsService = BroadcastsService;
exports.BroadcastsService = BroadcastsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        whatsapp_client_service_1.WhatsappClientService,
        conversation_service_1.ConversationService])
], BroadcastsService);
//# sourceMappingURL=broadcasts.service.js.map