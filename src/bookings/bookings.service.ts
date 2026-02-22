import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Booking,
  BookingDocument,
  BookingStatus,
} from './schemas/bookings.schema';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Artisan, ArtisanDocument } from 'src/artisans/schemas/artisan.schema';

@Injectable()
export class BookingsService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Artisan.name)
    private artisanModel: Model<ArtisanDocument>,
  ) {}

  async findByCustomer(customerId: string) {
    return this.bookingModel.find({
      customerId: new Types.ObjectId(customerId),
    });
  }

  async create(customerId: string, dto: CreateBookingDto) {
    // ✅ 1. Prevent self booking
    if (customerId === dto.artisanId) {
      throw new BadRequestException('You cannot book yourself');
    }

    // ✅ 2. Verify artisan exists
    const artisan = await this.artisanModel.findById(dto.artisanId);
    if (!artisan) {
      throw new NotFoundException('Artisan not found');
    }

    // ✅ 3. Prevent double booking (same date & time)
    const conflict = await this.bookingModel.findOne({
      artisanId: dto.artisanId,
      date: dto.date,
      time: dto.time,
      status: { $in: ['pending', 'confirmed', 'upcoming'] },
    });

    if (conflict) {
      throw new ConflictException(
        'Artisan already booked for this date and time',
      );
    }

    // ✅ 4. Calculate commission (10%)
    const commissionRate = artisan.commissionRate;
    const amount = artisan.hourlyRate * dto?.duration;
    const commission = amount * commissionRate;

    // ✅ 5. Determine booking status
    const bookingDate = new Date(dto.date);
    const today = new Date();

    const status =
      bookingDate > today ? BookingStatus.UPCOMING : BookingStatus.PENDING;

    // ✅ 6. Create booking
    const booking = await this.bookingModel.create({
      ...dto,
      customerId,
      commission,
      status,
    });

    // ✅ 7. Return populated booking
    return this.bookingModel
      .findById(booking._id)
      .populate('customerId', 'firstName lastName email')
      .populate('artisanId', 'firstName lastName email');
  }

  async findMyBookings(customerId: string): Promise<Booking[]> {
    return this.bookingModel
      .find({ customer: customerId })
      .populate('artisan', 'firstName lastName category') // adjust fields
      .sort({ date: -1 })
      .exec();
  }

  async findOne(bookingId: string, userId: string) {
    if (!Types.ObjectId.isValid(bookingId))
      throw new BadRequestException('Invalid booking id');

    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('customerId', 'name email')
      .populate('artisanId', 'name email');

    if (!booking) throw new NotFoundException('Booking not found');

    const isOwner =
      booking.customerId.toString() === userId ||
      booking.artisanId.toString() === userId;

    if (!isOwner) throw new ForbiddenException('Access denied');

    return booking;
  }

  async update(bookingId: string, userId: string, dto: UpdateBookingDto) {
    const booking = await this.bookingModel.findById(bookingId);

    // ✅ 1. Booking must exist
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // ✅ 2. Only customer or artisan can update
    const isCustomer = booking.customerId.toString() === userId;
    const isArtisan = booking.artisanId.toString() === userId;

    if (!isCustomer && !isArtisan) {
      throw new BadRequestException(
        'You are not allowed to update this booking',
      );
    }

    // ✅ 3. Prevent updates on finished bookings
    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Completed or cancelled bookings cannot be updated',
      );
    }

    // ✅ 4. Prevent reschedule conflicts
    if (dto.date || dto.time) {
      const newDate = dto.date ?? booking.date;
      const newTime = dto.time ?? booking.time;

      const conflict = await this.bookingModel.findOne({
        _id: { $ne: bookingId },
        artisanId: booking.artisanId,
        date: newDate,
        time: newTime,
        status: { $in: ['pending', 'confirmed', 'upcoming'] },
      });

      if (conflict) {
        throw new ConflictException(
          'Artisan already booked for the selected time',
        );
      }
    }

    // ✅ 5. Recalculate commission if amount updated
    if (dto.amount !== undefined) {
      dto['commission'] = dto.amount * 0.1;
    }

    // ✅ 6. Restrict status changes (business rules)
    if (dto.status) {
      const allowedTransitions = {
        pending: ['cancelled', 'confirmed'],
        confirmed: ['upcoming', 'cancelled'],
        upcoming: ['completed', 'cancelled'],
      };

      const current = booking.status;
      const allowed = allowedTransitions[current] || [];

      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot change status from ${current} to ${dto.status}`,
        );
      }
    }

    // ✅ 7. Apply updates
    Object.assign(booking, dto);
    await booking.save();

    // ✅ 8. Return populated booking
    return this.bookingModel
      .findById(bookingId)
      .populate('customerId', 'firstName lastName email')
      .populate('artisanId', 'firstName lastName email');
  }

  async remove(bookingId: string, userId: string) {
    const booking = await this.bookingModel.findById(bookingId);

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.customerId.toString() !== userId) {
      throw new ForbiddenException('Only the customer can delete this booking');
    }

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Completed bookings cannot be deleted');
    }

    await booking.deleteOne();

    return { message: 'Booking deleted successfully' };
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
