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
exports.AutoRepliesController = void 0;
const common_1 = require("@nestjs/common");
const auto_replies_service_1 = require("./auto-replies.service");
const create_auto_reply_dto_1 = require("./dto/create-auto-reply.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let AutoRepliesController = class AutoRepliesController {
    autoRepliesService;
    constructor(autoRepliesService) {
        this.autoRepliesService = autoRepliesService;
    }
    create(req, dto) {
        return this.autoRepliesService.create(req.user.businessId, dto);
    }
    findAll(req) {
        return this.autoRepliesService.findAll(req.user.businessId);
    }
    findOne(req, id) {
        return this.autoRepliesService.findOne(req.user.businessId, id);
    }
    remove(req, id) {
        return this.autoRepliesService.remove(req.user.businessId, id);
    }
};
exports.AutoRepliesController = AutoRepliesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_auto_reply_dto_1.CreateAutoReplyDto]),
    __metadata("design:returntype", void 0)
], AutoRepliesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AutoRepliesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AutoRepliesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AutoRepliesController.prototype, "remove", null);
exports.AutoRepliesController = AutoRepliesController = __decorate([
    (0, common_1.Controller)('auto-replies'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [auto_replies_service_1.AutoRepliesService])
], AutoRepliesController);
//# sourceMappingURL=auto-replies.controller.js.map