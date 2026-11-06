import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type SeatState = 'AVAILABLE' | 'HELD' | 'SOLD';

@Injectable()
export class SeatsService {
  constructor(private readonly prisma: PrismaService) {}

  async listSeats(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);

    const now = new Date();
    const seats = await this.prisma.seat.findMany({
      where: { eventId },
      orderBy: { seatNumber: 'asc' },
      include: {
        // Chỉ lấy các booking đang có hiệu lực
        bookings: {
          where: {
            OR: [
              { status: 'CONFIRMED' },
              { status: 'PENDING', expiresAt: { gt: now } },
            ],
          },
          select: { status: true },
        },
      },
    });

    return seats.map((seat) => {
      const active = seat.bookings[0];
      let status: SeatState = 'AVAILABLE';
      if (active?.status === 'CONFIRMED') status = 'SOLD';
      else if (active?.status === 'PENDING') status = 'HELD';

      return {
        id: seat.id,
        seatNumber: seat.seatNumber,
        price: seat.price,
        status,
      };
    });
  }
}