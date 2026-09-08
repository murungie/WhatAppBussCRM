"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const customerId = process.argv[2];
    const timestamp = process.argv[3];
    if (!customerId || !timestamp) {
        throw new Error('Usage: npx tsx scripts/restore-inbound-window.ts CUSTOMER_ID ISO_TIMESTAMP');
    }
    const customer = await prisma.customer.update({
        where: {
            id: customerId,
        },
        data: {
            lastInboundAt: new Date(timestamp),
        },
        select: {
            id: true,
            phoneNumber: true,
            lastInboundAt: true,
        },
    });
    console.log(customer);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=restore-inbound-window.js.map