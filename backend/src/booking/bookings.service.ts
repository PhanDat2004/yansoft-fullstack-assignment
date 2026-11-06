import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async hold(userId: string, dto: CreateBookingDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });
    if (!event) throw new NotFoundException(`Event ${dto.eventId} not found`);
    if (event.status !== 'UPCOMING' || event.startTime <= new Date()) {
      throw new BadRequestException('Event is not open for booking');
    }

    const seat = await this.prisma.seat.findFirst({
      where: { id: dto.seatId, eventId: dto.eventId },
    });
    if (!seat) throw new NotFoundException('Seat not found in this event');

    const parsed = Number(this.config.get<string>('HOLD_MINUTES'));
    const holdMinutes = Number.isFinite(parsed) && parsed > 0 ? parsed : 5;

    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM seats WHERE id = ${seat.id} FOR UPDATE`;

      const now = new Date();

      await tx.booking.updateMany({
        where: { seatId: seat.id, status: 'PENDING', expiresAt: { lte: now } },
        data: { status: 'EXPIRED' },
      });

      const active = await tx.booking.findFirst({
        where: { seatId: seat.id, status: { in: ['PENDING', 'CONFIRMED'] } },
      });
      if (active) throw new ConflictException('Seat is no longer available');

      return tx.booking.create({
        data: {
          userId,
          seatId: seat.id,
          expiresAt: new Date(now.getTime() + holdMinutes * 60_000),
        },
      });
    });
  }

  async confirm(userId: string, bookingId: string) {
    const now = new Date();

    const result = await this.prisma.booking.updateMany({
      where: {
        id: bookingId,
        userId,
        status: 'PENDING',
        expiresAt: { gt: now },
      },
      data: { status: 'CONFIRMED', confirmedAt: now },
    });

    if (result.count === 1) {
      return this.prisma.booking.findUniqueOrThrow({
        where: { id: bookingId },
      });
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);
    if (booking.userId !== userId) {
      throw new ForbiddenException('Booking does not belong to you');
    }

    if (booking.status === 'PENDING') {
      await this.prisma.booking.updateMany({
        where: { id: bookingId, status: 'PENDING', expiresAt: { lte: now } },
        data: { status: 'EXPIRED' },
      });
      throw new ConflictException('Booking has expired');
    }

    throw new ConflictException(`Booking is already ${booking.status}`);
  }

  async cancel(userId: string, bookingId: string) {
    const result = await this.prisma.booking.updateMany({
      where: { id: bookingId, userId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });

    if (result.count === 1) {
      return this.prisma.booking.findUniqueOrThrow({
        where: { id: bookingId },
      });
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException(`Booking ${bookingId} not found`);
    if (booking.userId !== userId) {
      throw new ForbiddenException('Booking does not belong to you');
    }
    if (booking.status === 'CONFIRMED') {
      throw new ConflictException('Cannot cancel a confirmed booking');
    }
    throw new ConflictException(`Booking is already ${booking.status}`);
  }

  async listMine(userId: string) {
    const now = new Date();
    const bookings = await this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        seat: { select: { seatNumber: true, eventId: true, price: true } },
      },
    });

    return bookings.map((b) => ({
      id: b.id,
      eventId: b.seat.eventId,
      seatId: b.seatId,
      seatNumber: b.seat.seatNumber,
      price: b.seat.price,
      status:
        b.status === 'PENDING' && b.expiresAt <= now ? 'EXPIRED' : b.status,
      expiresAt: b.expiresAt,
      confirmedAt: b.confirmedAt,
      createdAt: b.createdAt,
    }));
  }
}
