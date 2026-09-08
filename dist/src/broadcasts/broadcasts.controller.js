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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_business_decorator_1 = require("../common/decorators/current-business.decorator");
const add_recipients_dto_1 = require("./dto/add-recipients.dto");
const broadcasts_service_1 = require("./broadcasts.service");
const create_broadcast_dto_1 = require("./dto/create-broadcast.dto");
let BroadcastsController = class BroadcastsController {
    broadcastsService;
    constructor(broadcastsService) {
        this.broadcastsService = broadcastsService;
    }
    create(business, dto) {
        return this.broadcastsService.create(business.businessId, dto);
    }
    findAll(business) {
        return this.broadcastsService.findAll(business.businessId);
    }
    findOne(business, id) {
        return this.broadcastsService.findOne(business.businessId, id);
    }
    addRecipients(business, id, dto) {
        return this.broadcastsService.addRecipients(business.businessId, id, dto.customerIds);
    }
    sendBroadcast(business, id) {
        return this.broadcastsService.sendBroadcast(business.businessId, id);
    }
};
exports.BroadcastsController = BroadcastsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_business_decorator_1.CurrentBusiness)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_broadcast_dto_1.CreateBroadcastDto]),
    __metadata("design:returntype", void 0)
], BroadcastsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_business_decorator_1.CurrentBusiness)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BroadcastsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_business_decorator_1.CurrentBusiness)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BroadcastsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/recipients'),
    __param(0, (0, current_business_decorator_1.CurrentBusiness)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, add_recipients_dto_1.AddRecipientsDto]),
    __metadata("design:returntype", void 0)
], BroadcastsController.prototype, "addRecipients", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    __param(0, (0, current_business_decorator_1.CurrentBusiness)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BroadcastsController.prototype, "sendBroadcast", null);
exports.BroadcastsController = BroadcastsController = __decorate([
    (0, common_1.Controller)('broadcasts'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [broadcasts_service_1.BroadcastsService])
], BroadcastsController);
//# sourceMappingURL=broadcasts.controller.js.map