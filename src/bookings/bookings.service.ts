import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Booking,
  BookingDocument,
  BookingStatus,
} from './schemas/bookings.schema';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  async findByCustomer(customerId: string) {
    return this.bookingModel.find({
      customerId: new Types.ObjectId(customerId),
    });
  }

  async create(customerId: string, createBookingDto: any): Promise<Booking> {
    return this.bookingModel.create({
      ...createBookingDto,
      customer: customerId,
      status: BookingStatus.PENDING,
    });
  }

  async findMyBookings(customerId: string): Promise<Booking[]> {
    return this.bookingModel
      .find({ customer: customerId })
      .populate('artisan', 'firstName lastName category') // adjust fields
      .sort({ date: -1 })
      .exec();
  }

  async findOne(id: string, userId: string): Promise<Booking> {
    const booking = await this.bookingModel.findById(id).populate('artisan');
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.customerId.toString() !== userId) {
      throw new ForbiddenException('Not your booking');
    }
    return booking;
  }

  async update(id: string, userId: string, updateDto: any): Promise<any> {
    const booking = await this.findOne(id, userId);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return await this.bookingModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .populate('artisan');
  }

  async remove(id: string, userId: string): Promise<any> {
    await this.findOne(id, userId); // ownership check
    await this.bookingModel.findByIdAndDelete(id);
    return { message: 'Booking deleted' };
  }

  // Optional: customer marks as completed + adds rating/review
  async completeAndReview(
    id: string,
    userId: string,
    reviewData: { rating: number; review?: string },
  ) {
    const booking = await this.findOne(id, userId);
    if (
      booking.status !== BookingStatus.CONFIRMED &&
      booking.status !== BookingStatus.UPCOMING
    ) {
      throw new BadRequestException('Booking cannot be completed yet');
    }

    return this.bookingModel.findByIdAndUpdate(
      id,
      {
        status: BookingStatus.COMPLETED,
        rating: reviewData.rating,
        review: reviewData.review,
      },
      { new: true },
    );
  }
}
