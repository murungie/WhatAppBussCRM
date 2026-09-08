import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const customerId =
    process.argv[2];

  if (!customerId) {
    throw new Error(
      'Customer ID is required',
    );
  }

  const oldDate = new Date(
    Date.now() -
      25 * 60 * 60 * 1000,
  );

  const customer =
    await prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        lastInboundAt: oldDate,
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
  .finally(() =>
    prisma.$disconnect(),
  );

  