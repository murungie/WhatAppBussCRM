import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const oldCustomerId =
  '9542e14d-d72c-4ff1-aaee-b105baa675ce';

const canonicalCustomerId =
  '3fca7bda-cc0e-4f31-a84e-5ee3f57f37d8';

async function main() {
  const oldCustomer =
    await prisma.customer.findUnique({
      where: {
        id: oldCustomerId,
      },
      include: {
        messages: true,
        orders: true,
      },
    });

  const canonicalCustomer =
    await prisma.customer.findUnique({
      where: {
        id: canonicalCustomerId,
      },
      include: {
        messages: true,
        orders: true,
      },
    });

  if (!oldCustomer) {
    throw new Error(
      `Old customer ${oldCustomerId} was not found`,
    );
  }

  if (!canonicalCustomer) {
    throw new Error(
      `Canonical customer ${canonicalCustomerId} was not found`,
    );
  }

  console.log('OLD CUSTOMER');
  console.log({
    id: oldCustomer.id,
    phoneNumber: oldCustomer.phoneNumber,
    name: oldCustomer.name,
    messages: oldCustomer.messages.length,
    orders: oldCustomer.orders.length,
  });

  console.log('\nCANONICAL CUSTOMER');
  console.log({
    id: canonicalCustomer.id,
    phoneNumber: canonicalCustomer.phoneNumber,
    name: canonicalCustomer.name,
    messages: canonicalCustomer.messages.length,
    orders: canonicalCustomer.orders.length,
  });

  if (oldCustomer.orders.length > 0) {
    throw new Error(
      'Old customer has orders. Stop and migrate orders separately.',
    );
  }

  await prisma.$transaction(async (tx) => {
    // Move all old messages to the canonical customer.
    await tx.message.updateMany({
      where: {
        customerId: oldCustomerId,
      },
      data: {
        customerId: canonicalCustomerId,
      },
    });

    // Delete the duplicate customer.
    await tx.customer.delete({
      where: {
        id: oldCustomerId,
      },
    });
  });

  console.log('\nMerge completed successfully.');
}

main()
  .catch((error) => {
    console.error('\nMerge failed:');
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });