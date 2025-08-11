import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const barberUser = await prisma.user.upsert({
    where: { email: 'barber@example.com' },
    update: {},
    create: {
      role: 'PROVIDER',
      name: 'Fade Master',
      email: 'barber@example.com',
      password: 'hashed-demo',
      tz: 'Africa/Casablanca',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      role: 'CUSTOMER',
      name: 'Alice',
      email: 'alice@example.com',
      password: 'hashed-demo',
      tz: 'Africa/Casablanca',
    },
  });

  const provider = await prisma.provider.upsert({
    where: { userId: barberUser.id },
    update: {},
    create: {
      userId: barberUser.id,
      display: 'Fade Master Barbershop',
      status: 'APPROVED',
      address: '123 Main St',
      lat: 34.020882,
      lng: -6.841650,
    },
  });

  await prisma.service.create({
    data: {
      providerId: provider.id,
      name: 'Men Haircut',
      duration: 30,
      priceCents: 1200,
      bufferBefore: 5,
      bufferAfter: 5,
    }
  });

  await prisma.scheduleRule.createMany({
    data: [1,2,3,4,5].map(w => ({
      providerId: provider.id,
      weekday: w,
      startMin: 9*60,
      endMin: 17*60,
      capacity: 1,
    }))
  });

  console.log('Seed complete');
}

main().catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
