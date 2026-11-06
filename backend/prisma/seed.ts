import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DAY = 24 * 60 * 60 * 1000;

async function seedEvent(
  id: string,
  name: string,
  startTime: Date,
  status: 'UPCOMING' | 'FINISHED',
  rowLetter: string,
  seatCount: number,
) {
  await prisma.event.upsert({
    where: { id },
    update: { name, startTime, status },
    create: { id, name, startTime, status },
  });

  for (let i = 1; i <= seatCount; i++) {
    const seatNumber = `${rowLetter}${String(i).padStart(2, '0')}`;
    const seatId = `${id}-${seatNumber}`;
    await prisma.seat.upsert({
      where: { id: seatId },
      update: {},
      create: { id: seatId, eventId: id, seatNumber, price: 100000 },
    });
  }
}

async function main() {
  for (const id of ['u1', 'u2', 'u3']) {
    await prisma.user.upsert({
      where: { id },
      update: {},
      create: { id, email: `${id}@example.com` },
    });
  }

  await seedEvent(
    'evt-upcoming',
    'Concert Upcoming',
    new Date(Date.now() + 30 * DAY),
    'UPCOMING',
    'A',
    12,
  );

  await seedEvent(
    'evt-finished',
    'Concert Finished',
    new Date(Date.now() - 30 * DAY),
    'FINISHED',
    'B',
    4,
  );

  console.log('Seed done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
