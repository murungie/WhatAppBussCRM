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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let OrdersService = class OrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(businessId, dto) {
        const customer = await this.prisma.customer.findFirst({
            where: { id: dto.customerId, businessId },
        });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        return this.prisma.order.create({
            data: {
                businessId,
                customerId: dto.customerId,
                description: dto.description,
                amount: dto.amount,
            },
        });
    }
    async findAll(businessId) {
        return this.prisma.order.findMany({
            where: { businessId },
            include: { customer: true, payment: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async markPaid(businessId, orderId, dto) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, businessId },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        const [, , updatedCustomer] = await this.prisma.$transaction([
            this.prisma.order.update({
                where: { id: orderId },
                data: { status: client_1.OrderStatus.PAID },
            }),
            this.prisma.payment.create({
                data: {
                    orderId,
                    method: dto.method ?? 'mpesa',
                    reference: dto.reference,
                },
            }),
            this.prisma.customer.update({
                where: { id: order.customerId },
                data: {
                    lastOrderAt: new Date(),
                    totalSpent: { increment: order.amount },
                },
            }),
        ]);
        return updatedCustomer;
    }
    async cancel(businessId, orderId) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, businessId },
        });
        if (!order)
            throw new common_1.NotFoundException('Order not found');
        return this.prisma.order.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.CANCELLED },
        });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map