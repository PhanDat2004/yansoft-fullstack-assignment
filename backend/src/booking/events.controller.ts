import { Controller, Get, Param } from '@nestjs/common';
import { SeatsService } from './seats.service';

@Controller('events')
export class EventsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Get(':id/seats')
  getSeats(@Param('id') id: string) {
    return this.seatsService.listSeats(id);
  }
}
