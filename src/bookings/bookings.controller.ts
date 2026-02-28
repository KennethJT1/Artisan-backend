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
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { UserRole } from 'src/users/schemas/user.schema';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(req.user.id, createBookingDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTISAN, UserRole.CUSTOMER)
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    return this.bookingsService.update(id, req.user.id, updateBookingDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findMyBookings(
    @Req() req,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status?: any,
  ) {
    return this.bookingsService.findMyBookings(
      req.user.id,
      Number(page) || 1,
      Number(limit) || 10,
      status,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Req() req, @Param('id') id: string) {
    return this.bookingsService.findOne(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Req() req, @Param('id') id: string) {
    return this.bookingsService.remove(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete()
  async deleteAllBookings() {
    return await this.bookingsService.deleteAll();
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
