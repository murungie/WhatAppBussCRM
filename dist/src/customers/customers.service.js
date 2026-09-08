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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const conversation_service_1 = require("../conversation/conversation.service");
let CustomersService = class CustomersService {
    prisma;
    conversationService;
    constructor(prisma, conversationService) {
        this.prisma = prisma;
        this.conversationService = conversationService;
    }
    normalizePhoneNumber(phoneNumber) {
        return phoneNumber
            .trim()
            .replace(/\D/g, '');
    }
    async findOrCreate(businessId, dto) {
        const phoneNumber = this.normalizePhoneNumber(dto.phoneNumber);
        if (!phoneNumber) {
            throw new Error('Phone number cannot be empty');
        }
        const existing = await this.prisma.customer.findUnique({
            where: {
                businessId_phoneNumber: {
                    businessId,
                    phoneNumber,
                },
            },
        });
        if (existing) {
            if (dto.name &&
                dto.name !== existing.name) {
                return this.prisma.customer.update({
                    where: {
                        id: existing.id,
                    },
                    data: {
                        name: dto.name,
                    },
                });
            }
            return existing;
        }
        return this.prisma.customer.create({
            data: {
                businessId,
                phoneNumber,
                name: dto.name,
            },
        });
    }
    async findAll(businessId) {
        return this.prisma.customer.findMany({
            where: {
                businessId,
            },
            orderBy: {
                lastOrderAt: 'desc',
            },
        });
    }
    async findOne(businessId, id) {
        const customer = await this.prisma.customer.findFirst({
            where: {
                id,
                businessId,
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
                orders: {
                    orderBy: {
                        createdAt: 'desc',
                    },
                    include: {
                        payment: true,
                    },
                },
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        return customer;
    }
    async findInactive(businessId, days) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return this.prisma.customer.findMany({
            where: {
                businessId,
                OR: [
                    {
                        lastOrderAt: null,
                    },
                    {
                        lastOrderAt: {
                            lt: cutoff,
                        },
                    },
                ],
            },
        });
    }
    async getConversationStatus(businessId, customerId) {
        const customer = await this.prisma.customer.findFirst({
            where: {
                id: customerId,
                businessId,
            },
            select: {
                id: true,
                phoneNumber: true,
                name: true,
                lastInboundAt: true,
            },
        });
        if (!customer) {
            throw new common_1.NotFoundException('Customer not found');
        }
        return {
            customer: {
                id: customer.id,
                phoneNumber: customer.phoneNumber,
                name: customer.name,
            },
            conversation: this.conversationService.getConversationStatus(customer.lastInboundAt),
        };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        conversation_service_1.ConversationService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map