import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Req() req, @Body() createBookingDto: any) {
    return this.bookingsService.create(req.user.id, createBookingDto);
  }

  @Get()
  findMyBookings(@Req() req) {
    return this.bookingsService.findMyBookings(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    return this.bookingsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() updateBookingDto: any) {
    return this.bookingsService.update(id, req.user.id, updateBookingDto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.bookingsService.remove(id, req.user.id);
  }

  // Optional - customer completes + reviews in one step
  @Patch(':id/complete')
  completeAndReview(
    @Req() req,
    @Param('id') id: string,
    @Body() body: { rating: number; review?: string },
  ) {
    return this.bookingsService.completeAndReview(id, req.user.id, body);
  }
}
