import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { EventsController } from './events.controller';
import { SeatsService } from './seats.service';
import { BookingsService } from './bookings.service';

@Module({
  controllers: [BookingsController, EventsController],
  providers: [SeatsService, BookingsService],
})
export class BookingModule {}
