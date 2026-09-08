"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesModule = void 0;
const common_1 = require("@nestjs/common");
const messages_service_1 = require("./messages.service");
const messages_controller_1 = require("./messages.controller");
const webhook_controller_1 = require("./webhook.controller");
const customers_module_1 = require("../customers/customers.module");
const whatsapp_client_service_1 = require("../whatsapp/whatsapp-client.service");
const conversation_module_1 = require("../conversation/conversation.module");
const conversation_service_1 = require("./conversation.service");
let MessagesModule = class MessagesModule {
};
exports.MessagesModule = MessagesModule;
exports.MessagesModule = MessagesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            customers_module_1.CustomersModule,
            conversation_module_1.ConversationModule,
        ],
        providers: [
            messages_service_1.MessagesService,
            whatsapp_client_service_1.WhatsappClientService,
            conversation_service_1.ConversationService,
        ],
        controllers: [
            messages_controller_1.MessagesController,
            webhook_controller_1.WebhookController,
        ],
        exports: [
            messages_service_1.MessagesService,
            whatsapp_client_service_1.WhatsappClientService,
            conversation_service_1.ConversationService,
        ],
    })
], MessagesModule);
//# sourceMappingURL=messages.module.js.map