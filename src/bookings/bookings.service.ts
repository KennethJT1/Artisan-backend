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
    const actualAmount = artisan.hourlyRate * dto?.duration;
    const commission = actualAmount * commissionRate;
    const amount = actualAmount - commission;

    const status = BookingStatus.PENDING;
    // ✅ 6. Create booking
    const booking = await this.bookingModel.create({
      ...dto,
      customerId: new Types.ObjectId(customerId),
      artisanId: new Types.ObjectId(dto.artisanId),
      amount,
      commission,
      status,
    });

    // ✅ 7. Return populated booking
    const bookingData = await this.bookingModel
      .findById(booking._id)
      .populate('customerId', 'firstName lastName email')
      .populate({
        path: 'artisanId',
        populate: { path: 'user', select: 'firstName lastName email' },
      })
      .lean();

    // Flatten artisanId
    const result = {
      ...bookingData,
      artisanId: bookingData?.artisanId
        ? {
            firstName: bookingData.artisanId.user.firstName,
            lastName: bookingData.artisanId.user.lastName,
            email: bookingData.artisanId.user.email,
          }
        : null,
    };

    return result;
  }


async findMyBookings(
  customerId: string,
  page: number = 1,
  limit: number = 10,
  status?: any,
) {
  const skip = (page - 1) * limit;

  // Build filter
  const filter: any = { customerId: new Types.ObjectId(customerId), isDeleted: false };

  if (status) {
    const statuses = status
      .split(',')
      .map((s) => s.trim())
      .filter((s) => Object.values(BookingStatus).includes(s));

    if (statuses.length) filter.status = { $in: statuses };
  }

  // Fetch paginated bookings from latest to oldest
  const bookings = await this.bookingModel
    .find(filter)
    .populate('customerId', 'firstName lastName email')
    .populate({
      path: 'artisanId',
      populate: { path: 'user', select: 'firstName lastName email' },
    })
    .sort({ updatedAt: -1 }) // latest updated first
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await this.bookingModel.countDocuments(filter);

  const data = bookings.map((b) => ({
    ...b,
    customerId: {
      firstName: b.customerId.firstName,
      lastName: b.customerId.lastName,
      email: b.customerId.email,
    },
    artisanId: b.artisanId
      ? {
          commissionRate: b.artisanId.commissionRate,
          firstName: b.artisanId.user.firstName,
          lastName: b.artisanId.user.lastName,
          email: b.artisanId.user.email,
        }
      : null,
  }));

  return {
    data,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

  async findOne(bookingId: string, userId: string) {
    if (!Types.ObjectId.isValid(bookingId))
      throw new BadRequestException('Invalid booking id');

    const booking = await this.bookingModel
      .findById(bookingId)
      .populate('customerId', 'firstName lastName email')
      .populate({
        path: 'artisanId',
        populate: { path: 'user', select: 'firstName lastName email' },
      })
      .lean();

    if (!booking) throw new NotFoundException('Booking not found');

    const isOwner =
      (booking.customerId && booking.customerId._id.toString() === userId) ||
      (booking.artisanId && booking.artisanId.user._id.toString() === userId);

    if (!isOwner) throw new ForbiddenException('Access denied');

    return {
      ...booking,
      customerId: {
        firstName: booking.customerId.firstName,
        lastName: booking.customerId.lastName,
        email: booking.customerId.email,
      },
      artisanId: booking.artisanId
        ? {
            commissionRate: booking.artisanId.commissionRate,
            firstName: booking.artisanId.user.firstName,
            lastName: booking.artisanId.user.lastName,
            email: booking.artisanId.user.email,
          }
        : null,
    };
  }

  async update(bookingId: string, userId: string, dto: UpdateBookingDto) {
    const booking = await this.bookingModel.findById(bookingId);

    if (!booking) throw new NotFoundException('Booking not found');

    const isCustomer = booking.customerId.toString() === userId;
    const isArtisan = booking.artisanId.toString() === userId;

    if (!isCustomer && !isArtisan) {
      throw new BadRequestException(
        'You are not allowed to update this booking',
      );
    }

    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Completed or cancelled bookings cannot be updated',
      );
    }

    // Check for reschedule conflicts
    if (dto.date || dto.time) {
      const newDate = dto.date ?? booking.date;
      const newTime = dto.time ?? booking.time;

      const conflict = await this.bookingModel.findOne({
        _id: { $ne: bookingId },
        artisanId: booking.artisanId,
        date: newDate,
        time: newTime,
        status: { $in: ['pending', 'confirmed'] },
      });

      if (conflict) {
        throw new ConflictException(
          'Artisan already booked for the selected time',
        );
      }
    }

    // Recalculate amount if duration changes
    let amount = booking.amount;
    let commission = booking.commission;
    if (dto.duration && dto.duration !== booking.duration) {
      const artisan = await this.artisanModel.findById(booking.artisanId); // use booking.artisanId
      if (!artisan) throw new NotFoundException('Artisan not found');

      const actualAmount = artisan.hourlyRate * dto.duration;
      commission = actualAmount * artisan.commissionRate;
      amount = actualAmount - commission;
    }

    // Merge updates correctly
    Object.assign(booking, { ...dto, amount, commission });

    await booking.save();

    const updatedBooking = await this.bookingModel
      .findById(bookingId)
      .populate('customerId', 'firstName lastName email')
      .populate({
        path: 'artisanId',
        populate: { path: 'user', select: 'firstName lastName email' },
      })
      .lean();

    return {
      ...updatedBooking,
      customerId: {
        firstName: updatedBooking?.customerId.firstName,
        lastName: updatedBooking?.customerId.lastName,
        email: updatedBooking?.customerId.email,
      },
      artisanId: updatedBooking?.artisanId
        ? {
            commissionRate: updatedBooking?.artisanId.commissionRate,
            firstName: updatedBooking?.artisanId.user.firstName,
            lastName: updatedBooking?.artisanId.user.lastName,
            email: updatedBooking?.artisanId.user.email,
          }
        : null,
    };
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

    // Soft delete
    booking.isDeleted = true;
    await booking.save();

    return { message: 'Booking deleted (soft) successfully' };
  }

  async deleteAll() {
    // Deletes all bookings
    const result = this.bookingModel.deleteMany({});
    return {
      message: 'All bookings deleted successfully',
    };
  }

  // Optional: customer marks as completed + adds rating/review
  async completeAndReview(
    id: string,
    userId: string,
    reviewData: { rating: number; review?: string },
  ) {
    const booking = await this.findOne(id, userId);
    if (booking.status !== BookingStatus.CONFIRMED) {
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
