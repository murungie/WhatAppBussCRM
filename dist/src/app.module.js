"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const customers_module_1 = require("./customers/customers.module");
const messages_module_1 = require("./messages/messages.module");
const orders_module_1 = require("./orders/orders.module");
const broadcasts_module_1 = require("./broadcasts/broadcasts.module");
const auto_replies_module_1 = require("./auto-replies/auto-replies.module");
const conversation_module_1 = require("./conversation/conversation.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            customers_module_1.CustomersModule,
            messages_module_1.MessagesModule,
            orders_module_1.OrdersModule,
            broadcasts_module_1.BroadcastsModule,
            auto_replies_module_1.AutoRepliesModule,
            conversation_module_1.ConversationModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map