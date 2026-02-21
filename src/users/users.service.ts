import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, Schema as MongooseSchema } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

import { PaymentMethod, User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { sendEmail } from '../utils/email';
import {
  Booking,
  BookingDocument,
  BookingStatus,
} from 'src/bookings/schemas/bookings.schema';
import { Review, ReviewsDocument } from 'src/reviews/schemas/review.schema';
import {
  Favourite,
  FavouritesDocument,
} from 'src/favourites/schemas/favourite.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaymentMethodInput } from 'src/payments/interface/payment-interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Booking.name)
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewsDocument>,
    @InjectModel(Favourite.name)
    private readonly favouriteModel: Model<FavouritesDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userModel.findOne({
      email: createUserDto.email,
    });

    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const hashed = await bcrypt.hash(createUserDto.password, 10);

    return this.userModel.create({
      ...createUserDto,
      password: hashed,
    });
  }

  async findAll(
    pagination: PaginationQueryDto,
  ): Promise<PaginatedResult<User>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.userModel.find().select('-password').skip(skip).limit(limit),
      this.userModel.countDocuments(),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).select('-password');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findOneByEmail(email: string) {
    const user = await this.userModel
      .findOne({ email })
      .select('-password -resetToken -resetTokenExpiry');
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: any, updateDto: UpdateProfileDto): Promise<any> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateDto.email && updateDto.email !== user?.email) {
      const emailExists = await this.userModel.findOne({
        email: updateDto.email.toLowerCase(),
        _id: { $ne: userId },
      });

      if (emailExists) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Only update fields that were actually sent

    const allowedUpdates = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'address',
    ];

    const updates: Partial<UserDocument> = {};
    allowedUpdates.forEach((field) => {
      if (updateDto[field] !== undefined) {
        updates[field] = updateDto[field];
      }
    });

    // Apply updates

    Object.assign(user, updates);

    await user.save();

    // Return clean user object without password

    const { password, resetToken, ...safeUser } = user.toObject();
    return safeUser;
  }

  async remove(id: string) {
    return await this.userModel.findByIdAndDelete(id).select('-password');
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) throw new BadRequestException('Current password is incorrect');

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return { message: 'Password updated successfully' };
  }

  // 🧠 Forgot password
  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('User not found');

    const resetToken = randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    await sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html: `
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
      `,
    });

    return { message: 'Password reset email sent' };
  }

  // ✅ FIXED RESET PASSWORD
  async resetPassword(token: string, newPassword: string) {
    const user = await this.userModel.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;

    await user.save();

    return { message: 'Password reset successful' };
  }

  async getCustomerDashboardStats(userId: string) {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      thisMonthBookings,
      lastMonthBookings,
      thisMonthSpent,
      lastMonthSpent,
      favoriteCount,
      ratingStats,
    ] = await Promise.all([
      // This month bookings
      this.bookingModel.countDocuments({
        customer: new Types.ObjectId(userId),
        createdAt: { $gte: thisMonthStart },
      }),
      // Last month bookings
      this.bookingModel.countDocuments({
        customer: new Types.ObjectId(userId),
        createdAt: { $gte: lastMonthStart, $lt: thisMonthStart },
      }),
      // This month spent
      this.bookingModel.aggregate([
        {
          $match: {
            customer: new Types.ObjectId(userId),
            status: { $in: ['completed', 'confirmed'] },
            createdAt: { $gte: thisMonthStart },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Last month spent
      this.bookingModel.aggregate([
        {
          $match: {
            customer: new Types.ObjectId(userId),
            status: { $in: ['completed', 'confirmed'] },
            createdAt: { $gte: lastMonthStart, $lt: thisMonthStart },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      this.favouriteModel.countDocuments({
        customer: new Types.ObjectId(userId),
      }),
      this.reviewModel.aggregate([
        { $match: { customer: new Types.ObjectId(userId) } },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ]),
    ]);

    const currentBookings = thisMonthBookings;
    const prevBookings = lastMonthBookings;
    const bookingsChange =
      prevBookings === 0
        ? currentBookings > 0
          ? 100
          : 0
        : Math.round(((currentBookings - prevBookings) / prevBookings) * 100);

    const currentSpent = thisMonthSpent[0]?.total || 0;
    const prevSpent = lastMonthSpent[0]?.total || 0;
    const spentChange =
      prevSpent === 0
        ? currentSpent > 0
          ? 100
          : 0
        : Math.round(((currentSpent - prevSpent) / prevSpent) * 100);

    const avgRating = ratingStats[0]?.avg || 0;

    return {
      totalBookings: currentBookings + (thisMonthBookings - prevBookings), // or just total ever
      amountSpent: Math.round(currentSpent),
      favoriteArtisans: favoriteCount,
      avgRatingGiven: Number(avgRating.toFixed(1)),

      // Optional: if you want to return change values too
      changes: {
        bookings: bookingsChange,
        spent: spentChange,
      },
    };
  }

  async addPaymentMethod(
    userId: string,
    input: PaymentMethodInput,
  ): Promise<{ message: string; paymentMethod: PaymentMethod }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!input.type || !input.last4) {
      throw new BadRequestException('Type and last4 are required');
    }

    const shouldBeDefault =
      input.isDefault || (user.paymentMethods?.length ?? 0) === 0;

    const newMethod: PaymentMethod = {
      _id: new Types.ObjectId(),
      type: input.type,
      brand: input.brand || 'unknown',
      last4: input.last4,
      expMonth: input.expMonth,
      expYear: input.expYear,
      isDefault: shouldBeDefault,
      stripePaymentMethodId: input.stripePaymentMethodId,
      createdAt: new Date(),
    };

    if (shouldBeDefault) {
      user.paymentMethods = user.paymentMethods.map((m) => ({
        ...m,
        isDefault: false,
      }));
    }

    user.paymentMethods.push(newMethod); // ← cleaner than spread + assign
    // or: user.paymentMethods = [...user.paymentMethods, newMethod];

    await user.save();

    return {
      message: 'Payment method added',
      paymentMethod: newMethod,
    };
  }

  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const user = await this.userModel
      .findById(userId)
      .select('paymentMethods')
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.paymentMethods ?? [];
  }

  // ────────────────────────────────────────────────
  // Set an existing payment method as default
  // ────────────────────────────────────────────────
  async setDefaultPaymentMethod(userId: string, methodId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.paymentMethods?.length) {
      throw new BadRequestException('No payment methods found');
    }

    const methodIndex = user.paymentMethods.findIndex(
      (m) => m._id.toString() === methodId,
    );

    if (methodIndex === -1) {
      throw new BadRequestException('Payment method not found');
    }

    // Unset all defaults
    user.paymentMethods = user.paymentMethods.map((m) => ({
      ...m,
      isDefault: false,
    }));

    // Set the chosen one as default
    user.paymentMethods[methodIndex].isDefault = true;

    await user.save();

    return {
      message: 'Payment method set as default',
      defaultMethodId: methodId,
    };
  }

  // ────────────────────────────────────────────────
  // Remove a payment method by its internal _id
  // ────────────────────────────────────────────────
  async removePaymentMethod(userId: string, methodId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.paymentMethods?.length) {
      throw new BadRequestException('No payment methods to remove');
    }

    const initialLength = user.paymentMethods.length;

    user.paymentMethods = user.paymentMethods.filter(
      (m) => m._id.toString() !== methodId,
    );

    if (user.paymentMethods.length === initialLength) {
      throw new BadRequestException('Payment method not found');
    }

    // If we removed the only default → make first remaining one default (if any)
    if (
      user.paymentMethods.length > 0 &&
      !user.paymentMethods.some((m) => m.isDefault)
    ) {
      user.paymentMethods[0].isDefault = true;
    }

    await user.save();

    return {
      message: 'Payment method removed successfully',
      remaining: user.paymentMethods.length,
    };
  }
}
