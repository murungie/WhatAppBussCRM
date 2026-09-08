"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationService = void 0;
const common_1 = require("@nestjs/common");
let ConversationService = class ConversationService {
    windowMs = 24 * 60 * 60 * 1000;
    isWithin24HourWindow(lastInboundAt) {
        if (!lastInboundAt) {
            return false;
        }
        const elapsed = Date.now() - lastInboundAt.getTime();
        return (elapsed >= 0 &&
            elapsed < this.windowMs);
    }
    getRemainingWindowMs(lastInboundAt) {
        if (!lastInboundAt) {
            return 0;
        }
        const remaining = this.windowMs -
            (Date.now() - lastInboundAt.getTime());
        return Math.max(0, remaining);
    }
    getWindowExpiry(lastInboundAt) {
        if (!lastInboundAt) {
            return null;
        }
        return new Date(lastInboundAt.getTime() +
            this.windowMs);
    }
    getConversationStatus(lastInboundAt) {
        const isOpen = this.isWithin24HourWindow(lastInboundAt);
        const expiresAt = this.getWindowExpiry(lastInboundAt);
        const remainingMs = this.getRemainingWindowMs(lastInboundAt);
        return {
            isOpen,
            lastInboundAt,
            expiresAt,
            remainingMs,
        };
    }
};
exports.ConversationService = ConversationService;
exports.ConversationService = ConversationService = __decorate([
    (0, common_1.Injectable)()
], ConversationService);
//# sourceMappingURL=conversation.service.js.map