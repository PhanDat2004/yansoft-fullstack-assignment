import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { User } from '../generated/prisma/client';
import { BookingsService } from './bookings.service';
import { CurrentUser } from './current-user.decorator';
import { CreateBookingDto } from './dto/create-booking.dto';
import { FakeAuthGuard } from './fake-auth.guard';

@Controller('bookings')
@UseGuards(FakeAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  hold(@CurrentUser() user: User, @Body() dto: CreateBookingDto) {
    return this.bookingsService.hold(user.id, dto);
  }

  @Post(':id/confirm')
  @HttpCode(200)
  confirm(@CurrentUser() user: User, @Param('id') id: string) {
    return this.bookingsService.confirm(user.id, id);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUser() user: User, @Param('id') id: string) {
    return this.bookingsService.cancel(user.id, id);
  }

  @Get('me')
  me(@CurrentUser() user: User) {
    return this.bookingsService.listMine(user.id);
  }
}
