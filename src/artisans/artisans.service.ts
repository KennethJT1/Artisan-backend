import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types, ClientSession } from 'mongoose';
import { Artisan, ArtisanDocument } from './schemas/artisan.schema';
import { CategoriesService } from 'src/category/category.service';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { User, UserDocument, UserRole } from 'src/users/schemas/user.schema';
import { ApplyArtisanDto } from './dto/create-artisan.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ArtisansService {
  constructor(
    @InjectModel(Artisan.name)
    private readonly artisanModel: Model<ArtisanDocument>,
    private readonly categoriesService: CategoriesService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  // NEW: Artisan Dashboard Endpoints
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Find artisan by user ID
   */
async findByUserId(userId: any): Promise<ArtisanDocument> {
  
  // Try to find user first
  const userModel = this.connection.model('User');
  const user = await userModel.findById(userId);
  
  if (!user) {
    console.error("❌ User not found!");
    throw new NotFoundException('User not found');
  }
  
 
  
  // Find artisan
  const artisan = await this.artisanModel
    .findOne({ 
      user: new Types.ObjectId(userId) 
      // Remove status filter temporarily for debugging
    })
    .populate('category');
  
  if (!artisan) {
    console.error("❌ Artisan not found for user:", userId);
    
    // Check if ANY artisan exists for this user ID (string comparison)
    const anyArtisan = await this.artisanModel.findOne({
      user: userId.toString()
    });
    
    
    throw new NotFoundException('Artisan profile not found');
  }

  
  return artisan;
}

  /**
   * Update artisan profile by user ID
   */
  async updateByUserId(
    userId: any,
    updateData: Partial<Artisan>,
  ): Promise<ArtisanDocument> {
    const allowedFields = [
      'description',
      'hourlyRate',
      'location',
      'skills',
      'portfolio',
      'certifications',
      'experience',
    ];

    const sanitizedData = Object.keys(updateData).reduce((acc, key) => {
      if (allowedFields.includes(key)) {
        acc[key] = updateData[key];
      }
      return acc;
    }, {});

    const artisan = await this.artisanModel
      .findOneAndUpdate({ user: new Types.ObjectId(userId) }, sanitizedData, {
        new: true,
      })
      .populate('category');

    if (!artisan) {
      throw new NotFoundException('Artisan not found');
    }
    return artisan;
  }

  /**
   * Update artisan availability status
   */
  async updateAvailability(
    userId: any,
    isAvailable: boolean,
  ): Promise<ArtisanDocument> {
    const artisan = await this.artisanModel
      .findOneAndUpdate(
        { user: new Types.ObjectId(userId) },
        { isAvailable },
        { new: true },
      )
      .populate('category');

    if (!artisan) {
      throw new NotFoundException('Artisan not found');
    }
    return artisan;
  }

  /**
   * Get bookings by artisan
   */
  async getBookingsByArtisan(userId: any, status?: string): Promise<any[]> {
    const artisan = await this.findByUserId(userId);
    const filter: any = { artisan: artisan._id };
    if (status) {
      filter.status = status;
    }

    const paymentModel = this.connection.model('Payment');
    const bookings = await paymentModel
      .find(filter)
      .populate('customer')
      .sort({ createdAt: -1 });

    return bookings.map((booking: any) => ({
      id: booking._id,
      customer: (booking.customer as any)?.firstName
        ? `${(booking.customer as any).firstName} ${(booking.customer as any).lastName}`
        : 'Unknown',
      service: booking.service,
      date: booking.date,
      time: booking.time,
      duration: booking.duration,
      amount: `$${booking.total}`,
      status: booking.status,
      location: booking.location,
      phone: (booking.customer as any)?.phone || '',
      notes: booking.notes || '',
    }));
  }

  /**
   * Get earnings summary for artisan
   */
  async getEarningsSummary(userId: any) {
    const artisan = await this.findByUserId(userId);
    const paymentModel = this.connection.model('Payment');

    const completedPayments = await paymentModel
      .find({
        artisan: artisan._id,
        paymentStatus: 'paid',
      })
      .exec();

    const totalEarnings = completedPayments.reduce(
      (sum, p) => sum + (p.total - p.platformFee),
      0,
    );

    const monthlyEarnings = completedPayments.reduce((acc, payment) => {
      const month = new Date(payment.createdAt).getMonth();
      if (!acc[month]) {
        acc[month] = { earnings: 0, jobs: 0 };
      }
      acc[month].earnings += payment.total - payment.platformFee;
      acc[month].jobs += 1;
      return acc;
    }, {});

    return {
      totalEarnings: totalEarnings.toFixed(2),
      totalJobs: completedPayments.length,
      monthlyBreakdown: Object.entries(monthlyEarnings).map(
        ([month, data]: [string, any]) => ({
          month: new Date(2024, Number(month)).toLocaleString('default', {
            month: 'short',
          }),
          earnings: data.earnings.toFixed(2),
          jobs: data.jobs,
        }),
      ),
      commissionRate: '15%',
    };
  }

  /**
   * Get earnings history with pagination
   */
  async getEarningsHistory(
    userId: any,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<any>> {
    const artisan = await this.findByUserId(userId);
    const paymentModel = this.connection.model('Payment');

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      paymentModel
        .find({ artisan: artisan._id, paymentStatus: 'paid' })
        .populate('customer')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      paymentModel.countDocuments({
        artisan: artisan._id,
        paymentStatus: 'paid',
      }),
    ]);

    const data = payments.map((payment: any) => ({
      id: payment._id,
      date: payment.createdAt,
      customer: (payment.customer as any)?.firstName
        ? `${(payment.customer as any).firstName} ${(payment.customer as any).lastName}`
        : 'Unknown',
      service: payment.service,
      grossAmount: payment.total,
      commission: payment.platformFee,
      netEarnings: payment.total - payment.platformFee,
      status: payment.status,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get reviews by artisan with pagination
   */
  async getReviewsByArtisan(
    userId: any,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<any>> {
    const artisan = await this.findByUserId(userId);
    const paymentModel = this.connection.model('Payment');

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      paymentModel
        .find({
          artisan: artisan._id,
          rating: { $exists: true, $ne: null },
        })
        .populate('customer')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      paymentModel.countDocuments({
        artisan: artisan._id,
        rating: { $exists: true, $ne: null },
      }),
    ]);

    const data = reviews.map((review: any) => ({
      id: review._id,
      customer: (review.customer as any)?.firstName
        ? `${(review.customer as any).firstName} ${(review.customer as any).lastName}`
        : 'Anonymous',
      service: review.service,
      rating: review.rating,
      review: review.review || 'No review provided',
      date: review.createdAt,
    }));

    const averageRating =
      reviews.length > 0
        ? (
            reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
            reviews.length
          ).toFixed(1)
        : '0.0';

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        averageRating,
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EXISTING: Artisan Application & Management
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Apply as a new artisan (create user + artisan profile)
   */
  async apply(data: ApplyArtisanDto): Promise<ArtisanDocument> {
    const session: ClientSession = await this.connection.startSession();

    try {
      session.startTransaction();

      // Check existing user
      const existing = await this.userModel
        .findOne({ email: data.email.toLowerCase() })
        .session(session);

      if (existing) {
        throw new BadRequestException('Email already in use');
      }

      const hashed = await bcrypt.hash(data.password, 10);

      // Create User
      const user = new this.userModel({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        password: hashed,
        role: UserRole.ARTISAN,
        phone: data.phone,
      });
      await user.save({ session });

      // Resolve category
      const categoryDoc = await this.categoriesService.findByName(
        data.category,
        session,
      );

      if (!categoryDoc || !categoryDoc.isActive) {
        throw new NotFoundException('Category not found or inactive');
      }

      // Create Artisan
      const artisan = new this.artisanModel({
        user: user._id,
        category: categoryDoc._id,
        experience: data.experience,
        hourlyRate: data.hourlyRate,
        description: data.description,
        location: data.location,
        portfolio: data.portfolio || [],
        certifications: data.certifications || [],
      });
      await artisan.save({ session });

      // Update User
      user.artisanProfile = artisan._id;
      await user.save({ session });

      await session.commitTransaction();
      session.endSession();

      await artisan.populate('category');

      return artisan;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Find all approved artisans with pagination
   */
  async findAll(page = 1, limit = 10): Promise<PaginatedResult<Artisan>> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.artisanModel
        .find({ status: 'approved' })
        .populate('category')
        .skip(skip)
        .limit(limit),
      this.artisanModel.countDocuments({ status: 'approved' }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find pending artisan applications with pagination
   */
  async findPending(page = 1, limit = 10): Promise<PaginatedResult<Artisan>> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.artisanModel
        .find({ status: 'pending' })
        .populate('category')
        .skip(skip)
        .limit(limit),
      this.artisanModel.countDocuments({ status: 'pending' }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update artisan application status
   */
  async updateStatus(
    id: string,
    status: 'approved' | 'rejected',
  ): Promise<ArtisanDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid artisan ID');
    }

    const artisan = await this.artisanModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .populate('category');

    if (!artisan) {
      throw new NotFoundException('Artisan not found');
    }

    return artisan;
  }

  /**
   * Find single artisan by ID
   */
  async findOne(id: string): Promise<ArtisanDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid artisan ID');
    }
    const artisan = await this.artisanModel.findById(id).populate('category');
    if (!artisan) {
      throw new NotFoundException('Artisan not found');
    }
    return artisan;
  }

  /**
   * Bulk create artisans
   */
  async bulkCreate(data: Partial<Artisan>[]): Promise<ArtisanDocument[]> {
    const inserted = await this.artisanModel.insertMany(data, {
      ordered: false,
    });
    return this.artisanModel.populate(inserted, { path: 'category' });
  }
}