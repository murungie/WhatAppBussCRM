"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WhatsappClientService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappClientService = void 0;
const common_1 = require("@nestjs/common");
let WhatsappClientService = WhatsappClientService_1 = class WhatsappClientService {
    logger = new common_1.Logger(WhatsappClientService_1.name);
    apiVersion = 'v21.0';
    async sendTextMessage(params) {
        const { phoneNumberId, accessToken, to, body, } = params;
        const url = `https://graph.facebook.com/${this.apiVersion}/${phoneNumberId}/messages`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to,
                type: 'text',
                text: {
                    body,
                },
            }),
        });
        if (!res.ok) {
            const errorBody = await res.text();
            this.logger.error(`WhatsApp send failed: ${res.status} ${errorBody}`);
            throw new Error(`WhatsApp API error (${res.status}): ${errorBody}`);
        }
        return res.json();
    }
    async sendTemplateMessage(params) {
        const { phoneNumberId, accessToken, to, templateName, languageCode, parameters = [], } = params;
        const url = `https://graph.facebook.com/${this.apiVersion}/${phoneNumberId}/messages`;
        const bodyParameters = parameters.map((value) => ({
            type: 'text',
            text: value,
        }));
        const payload = {
            messaging_product: 'whatsapp',
            to: to.trim().replace(/\D/g, ''),
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: languageCode,
                },
                ...(bodyParameters.length > 0
                    ? {
                        components: [
                            {
                                type: 'body',
                                parameters: bodyParameters,
                            },
                        ],
                    }
                    : {}),
            },
        };
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const errorBody = await res.text();
            this.logger.error(`WhatsApp template send failed: ${res.status} ${errorBody}`);
            throw new Error(`WhatsApp template API error (${res.status}): ${errorBody}`);
        }
        return res.json();
    }
};
exports.WhatsappClientService = WhatsappClientService;
exports.WhatsappClientService = WhatsappClientService = WhatsappClientService_1 = __decorate([
    (0, common_1.Injectable)()
], WhatsappClientService);
//# sourceMappingURL=whatsapp-client.service.js.map