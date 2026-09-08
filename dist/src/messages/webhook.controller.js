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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const messages_service_1 = require("./messages.service");
let WebhookController = WebhookController_1 = class WebhookController {
    config;
    prisma;
    messagesService;
    logger = new common_1.Logger(WebhookController_1.name);
    constructor(config, prisma, messagesService) {
        this.config = config;
        this.prisma = prisma;
        this.messagesService = messagesService;
    }
    verify(mode, token, challenge, res) {
        const expectedToken = this.config.get('WHATSAPP_VERIFY_TOKEN');
        this.logger.log('Webhook verification request received');
        if (mode === 'subscribe' &&
            token === expectedToken) {
            this.logger.log('WhatsApp webhook verification successful');
            return res
                .status(200)
                .send(challenge);
        }
        this.logger.warn('WhatsApp webhook verification failed');
        return res
            .status(403)
            .send('Verification failed');
    }
    async receive(payload, res) {
        res
            .status(200)
            .send('EVENT_RECEIVED');
        try {
            if (payload?.object !== 'whatsapp_business_account') {
                this.logger.warn('Received non-WhatsApp webhook payload');
                return;
            }
            const entries = payload?.entry;
            if (!Array.isArray(entries) ||
                entries.length === 0) {
                this.logger.warn('WhatsApp webhook contains no entries');
                return;
            }
            for (const entry of entries) {
                const changes = entry?.changes;
                if (!Array.isArray(changes) ||
                    changes.length === 0) {
                    continue;
                }
                for (const change of changes) {
                    const value = change?.value;
                    if (!value) {
                        continue;
                    }
                    const phoneNumberId = value?.metadata?.phone_number_id;
                    if (!phoneNumberId) {
                        this.logger.warn('Webhook event does not contain phone_number_id');
                        continue;
                    }
                    const business = await this.prisma.business.findFirst({
                        where: {
                            whatsappPhoneId: phoneNumberId,
                        },
                    });
                    if (!business) {
                        this.logger.warn(`No business found for WhatsApp phone_number_id ${phoneNumberId}`);
                        continue;
                    }
                    const messages = value?.messages;
                    const contacts = value?.contacts;
                    if (Array.isArray(messages) &&
                        messages.length > 0) {
                        for (const message of messages) {
                            await this.processInboundMessage(business.id, message, contacts);
                        }
                    }
                    const statuses = value?.statuses;
                    if (Array.isArray(statuses) &&
                        statuses.length > 0) {
                        for (const status of statuses) {
                            await this.processMessageStatus(business.id, status);
                        }
                    }
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to process WhatsApp webhook payload', error instanceof Error
                ? error.stack
                : String(error));
        }
    }
    async processInboundMessage(businessId, message, contacts) {
        try {
            const fromPhoneNumber = message?.from;
            const waMessageId = message?.id;
            const messageType = message?.type;
            if (!fromPhoneNumber ||
                !waMessageId) {
                this.logger.warn('Inbound WhatsApp message missing sender or message ID');
                return;
            }
            const existingMessage = await this.prisma.message.findFirst({
                where: {
                    waMessageId,
                },
            });
            if (existingMessage) {
                this.logger.log(`Ignoring duplicate WhatsApp message ${waMessageId}`);
                return;
            }
            const contactName = contacts?.[0]?.profile?.name;
            let content;
            switch (messageType) {
                case 'text':
                    content =
                        message?.text?.body ?? '';
                    break;
                case 'image':
                    content =
                        message?.image?.caption ??
                            '[Image received]';
                    break;
                case 'video':
                    content =
                        message?.video?.caption ??
                            '[Video received]';
                    break;
                case 'audio':
                    content =
                        '[Audio message received]';
                    break;
                case 'document':
                    content =
                        message?.document?.caption ??
                            '[Document received]';
                    break;
                case 'location':
                    content =
                        '[Location received]';
                    break;
                case 'contacts':
                    content =
                        '[Contact received]';
                    break;
                case 'sticker':
                    content =
                        '[Sticker received]';
                    break;
                case 'button':
                    content =
                        message?.button?.text ??
                            '[Button response received]';
                    break;
                case 'interactive':
                    content =
                        message?.interactive?.button_reply?.title ??
                            message?.interactive?.list_reply?.title ??
                            '[Interactive response received]';
                    break;
                default:
                    content =
                        `[Unsupported message type: ${messageType}]`;
            }
            const result = await this.messagesService.recordInbound({
                businessId,
                fromPhoneNumber,
                content,
                waMessageId,
                contactName,
            });
            this.logger.log(`Inbound WhatsApp message saved: ${waMessageId}`);
            if (result?.autoReply) {
                this.logger.log(`Auto-reply sent for keyword "${result.autoReply.keyword}" with WhatsApp ID ${result.autoReply.message.waMessageId}`);
            }
            if (result?.autoReplyError) {
                this.logger.warn(`Auto-reply failed: ${result.autoReplyError}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to process inbound WhatsApp message', error instanceof Error
                ? error.stack
                : String(error));
        }
    }
    async processMessageStatus(businessId, status) {
        try {
            const waMessageId = status?.id;
            const statusValue = status?.status;
            if (!waMessageId || !statusValue) {
                return;
            }
            this.logger.log(`WhatsApp message ${waMessageId} status: ${statusValue}`);
            if (statusValue.toLowerCase() === 'failed') {
                const errors = status?.errors;
                if (Array.isArray(errors) &&
                    errors.length > 0) {
                    this.logger.error(`WhatsApp delivery errors for ${waMessageId}: ${JSON.stringify(errors)}`);
                }
                else {
                    this.logger.warn(`WhatsApp message ${waMessageId} failed without error details in the webhook payload`);
                }
            }
            const updatedMessage = await this.messagesService.updateMessageStatus({
                businessId,
                waMessageId,
                status: statusValue,
            });
            if (!updatedMessage) {
                this.logger.warn(`No local message found for WhatsApp message ${waMessageId}`);
                return;
            }
            this.logger.log(`Message ${updatedMessage.id} updated to ${updatedMessage.status}`);
        }
        catch (error) {
            this.logger.error('Failed to process WhatsApp message status', error instanceof Error
                ? error.stack
                : String(error));
        }
    }
};
exports.WebhookController = WebhookController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('hub.mode')),
    __param(1, (0, common_1.Query)('hub.verify_token')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], WebhookController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "receive", null);
exports.WebhookController = WebhookController = WebhookController_1 = __decorate([
    (0, common_1.Controller)('webhook/whatsapp'),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        messages_service_1.MessagesService])
], WebhookController);
//# sourceMappingURL=webhook.controller.js.map