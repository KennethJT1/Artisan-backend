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
  create(@Req() req, @Body() createBookingDto: CreateBookingDto): Promise<any> {
    return this.bookingsService.create(req.user.id, createBookingDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ARTISAN, UserRole.CUSTOMER)
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ): Promise<any> {
    return this.bookingsService.update(id, req.user.id, updateBookingDto);
  }

  @Get('me/all')
  @UseGuards(JwtAuthGuard)
  async getAllUserActivity(
    @Req() req,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('type') type?: 'booking' | 'order',
  ) {
    return this.bookingsService.getAllUserActivity(
      req.user.id,
      req.user.role,
      Number(page) || 1,
      Number(limit) || 10,
      type,
    );
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

  // Admin: view all bookings
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  findAllBookings(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('status') status?: any,
  ) {
    return this.bookingsService.findAllBookings(
      Number(page) || 1,
      Number(limit) || 10,
      status,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Req() req, @Param('id') id: string): Promise<any>{
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
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER)
  completeAndReview(
    @Req() req,
    @Param('id') id: string,
    @Body() body: { rating: number; review?: string },
  ) {
    return this.bookingsService.completeAndReview(id, req.user.id, body);
  }

  @Patch(':id/respond')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ARTISAN)
  respondToBooking(
    @Req() req,
    @Param('id') id: string,
    @Body('action') action: 'accept' | 'reject',
  ) {
    return this.bookingsService.respondToBooking(id, req.user.id, action);
  }
}
