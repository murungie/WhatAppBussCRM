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
exports.AutoRepliesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AutoRepliesService = class AutoRepliesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(businessId, dto) {
        const keyword = dto.keyword.trim().toLowerCase();
        const existing = await this.prisma.autoReplyRule.findFirst({
            where: {
                businessId,
                keyword,
            },
        });
        if (existing) {
            throw new common_1.ConflictException('An auto-reply rule with this keyword already exists');
        }
        return this.prisma.autoReplyRule.create({
            data: {
                businessId,
                keyword,
                response: dto.response.trim(),
                isActive: dto.isActive ?? true,
            },
        });
    }
    async findAll(businessId) {
        return this.prisma.autoReplyRule.findMany({
            where: {
                businessId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }
    async findOne(businessId, id) {
        const rule = await this.prisma.autoReplyRule.findFirst({
            where: {
                id,
                businessId,
            },
        });
        if (!rule) {
            throw new common_1.NotFoundException('Auto-reply rule not found');
        }
        return rule;
    }
    async remove(businessId, id) {
        await this.findOne(businessId, id);
        return this.prisma.autoReplyRule.delete({
            where: {
                id,
            },
        });
    }
};
exports.AutoRepliesService = AutoRepliesService;
exports.AutoRepliesService = AutoRepliesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AutoRepliesService);
//# sourceMappingURL=auto-replies.service.js.map