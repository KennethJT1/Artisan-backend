import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { RecentActivityItem, PlatformAlert } from './dto/activity.dto';
import { Artisan, ArtisanDocument } from 'src/artisans/schemas/artisan.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Artisan.name) private artisanModel: Model<ArtisanDocument>,
  ) {}

  async getDashboardStats(timeframe: string) {
    const dateRange = this.calculateDateRange(timeframe);
    const previousDateRange = this.calculatePreviousDateRange(timeframe);

    // Get total artisans count (using isApproved instead of status)
    const totalArtisans = await this.artisanModel.countDocuments({
      status: 'approved',
    });

    const previousArtisans = await this.artisanModel.countDocuments({
      status: 'approved',
      createdAt: { $lt: dateRange.startDate },
    });

    const artisansChange = this.calculatePercentageChange(
      previousArtisans,
      totalArtisans,
    );

    // Get total revenue from payments
    const revenueResult = await this.paymentModel.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    const previousRevenueResult = await this.paymentModel.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: {
            $gte: previousDateRange.startDate,
            $lt: dateRange.startDate,
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const previousRevenue =
      previousRevenueResult.length > 0 ? previousRevenueResult[0].total : 0;
    const revenueChange = this.calculatePercentageChange(
      previousRevenue,
      totalRevenue,
    );

    // Get active bookings count
    const activeBookings = await this.paymentModel.countDocuments({
      status: { $in: ['pending', 'in_progress'] },
      createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
    });
    const previousActiveBookings = await this.paymentModel.countDocuments({
      status: { $in: ['pending', 'in_progress'] },
      createdAt: {
        $gte: previousDateRange.startDate,
        $lt: dateRange.startDate,
      },
    });
    const bookingsChange = this.calculatePercentageChange(
      previousActiveBookings,
      activeBookings,
    );

    // Get commission earned
    const commissionResult = await this.paymentModel.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: dateRange.startDate, $lte: dateRange.endDate },
        },
      },
      { $group: { _id: null, total: { $sum: '$platformFee' } } },
    ]);
    const commissionEarned =
      commissionResult.length > 0 ? commissionResult[0].total : 0;

    const previousCommissionResult = await this.paymentModel.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: {
            $gte: previousDateRange.startDate,
            $lt: dateRange.startDate,
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$platformFee' } } },
    ]);
    const previousCommission =
      previousCommissionResult.length > 0
        ? previousCommissionResult[0].total
        : 0;
    const commissionChange = this.calculatePercentageChange(
      previousCommission,
      commissionEarned,
    );

    return [
      {
        title: 'Total Artisans',
        value: totalArtisans.toString(),
        change: `${artisansChange > 0 ? '+' : ''}${artisansChange.toFixed(0)}%`,
        icon: 'Users',
        color: 'text-blue-600',
        trend: artisansChange >= 0 ? 'up' : 'down',
      },
      {
        title: 'Total Revenue',
        value: `$${totalRevenue.toFixed(2)}`,
        change: `${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(0)}%`,
        icon: 'DollarSign',
        color: 'text-green-600',
        trend: revenueChange >= 0 ? 'up' : 'down',
      },
      {
        title: 'Active Bookings',
        value: activeBookings.toString(),
        change: `${bookingsChange > 0 ? '+' : ''}${bookingsChange.toFixed(0)}%`,
        icon: 'Calendar',
        color: 'text-orange-600',
        trend: bookingsChange >= 0 ? 'up' : 'down',
      },
      {
        title: 'Commission Earned',
        value: `$${commissionEarned.toFixed(2)}`,
        change: `${commissionChange > 0 ? '+' : ''}${commissionChange.toFixed(0)}%`,
        icon: 'TrendingUp',
        color: 'text-purple-600',
        trend: commissionChange >= 0 ? 'up' : 'down',
      },
    ];
  }

async getRecentBookings() {
  const bookings = await this.paymentModel
    .find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('customer') // User
    .populate({
      path: 'artisan',
      populate: { path: 'user' }, // Artisan → User
    })
    .exec();

  return bookings.map((booking) => {
    const customer = booking.customer as any;
    const artisan = booking.artisan as any;
    const artisanUser = artisan?.user;

    return {
      id: booking._id,
      customer: customer
        ? `${customer.firstName} ${customer.lastName}`
        : 'Unknown',
      artisan: artisanUser
        ? `${artisanUser.firstName} ${artisanUser.lastName}`
        : 'Unknown',
      service: booking.service,
      amount: `$${booking.total}`,
      commission: `$${booking.platformFee}`,
      status: booking.status,
      date: booking.createdAt,
      location: booking.location,
    };
  });
}

async getTopArtisans() {
  const topArtisans = await this.paymentModel.aggregate([
    // 1️⃣ Only completed/paid payments
    {
      $match: {
        paymentStatus: 'paid',
      },
    },

    // 2️⃣ Group by artisan
    {
      $group: {
        _id: '$artisan', // Artisan _id
        totalEarnings: {
          $sum: { $subtract: ['$total', '$platformFee'] },
        },
        totalJobs: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },

    // 3️⃣ Sort & limit
    { $sort: { totalEarnings: -1 } },
    { $limit: 3 },

    // 4️⃣ Join Artisan
    {
      $lookup: {
        from: 'artisans',
        localField: '_id',
        foreignField: '_id',
        as: 'artisan',
      },
    },
    { $unwind: '$artisan' },

    // 5️⃣ Join User (via artisan.user)
    {
      $lookup: {
        from: 'users',
        localField: 'artisan.user',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },

    // 6️⃣ Join Category
    {
      $lookup: {
        from: 'categories',
        localField: 'artisan.category',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
  ]);

  return topArtisans.map((a) => ({
    id: a._id,
    name: `${a.user.firstName} ${a.user.lastName}`,
    category: a.category.name,
    earnings: `$${a.totalEarnings.toFixed(2)}`,
    rating: a.averageRating || 0,
    jobs: a.totalJobs,
  }));
}

  async getPendingArtisans() {
    const pendingArtisans = await this.artisanModel
      .find({ status: 'pending' })
      .populate('user')
      .populate('category')
      .sort({ createdAt: -1 })
      .exec();

    return pendingArtisans.map((artisan) => {
      const user = artisan.user as any;
      const category = artisan.category as any;

      return {
        id: artisan._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone || 'Not provided',
        category: category?.name || 'Not specified',
        location: artisan.location,
        experience: artisan.experience,
        hourlyRate: artisan.hourlyRate,
        appliedDate: artisan.createdAt.toISOString().split('T')[0],
      };
    });
  }

  async approveArtisan(id: string) {
    return await this.artisanModel.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true },
    );
  }

  async rejectArtisan(id: string) {
    return await this.artisanModel.findByIdAndUpdate(
      id,
      { status: 'rejected' },
      { new: true },
    );
  }

  async getCommissionSettings() {
    // This would come from a settings collection - for now using default values
    return {
      defaultRate: 15,
      premiumArtisans: 12,
      newArtisans: 10,
    };
  }

  async updateCommissionSettings(settings: any) {
    // Save to a settings collection
    return settings;
  }

  async getPendingPayouts() {
    const pendingPayouts = await this.paymentModel.aggregate([
      { $match: { paymentStatus: 'paid', payoutStatus: 'pending' } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: { $subtract: ['$total', '$platformFee'] } },
          artisanCount: { $addToSet: '$artisan' },
        },
      },
    ]);

    const result =
      pendingPayouts.length > 0
        ? pendingPayouts[0]
        : { totalAmount: 0, artisanCount: [] };

    return {
      total: result.totalAmount,
      artisans: result.artisanCount.length,
      nextPayoutDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    };
  }

  async processPayouts() {
    const result = await this.paymentModel.updateMany(
      { paymentStatus: 'paid', payoutStatus: 'pending' },
      { payoutStatus: 'processed', processedAt: new Date() },
    );

    return {
      success: true,
      processed: result.modifiedCount,
      total: await this.getPendingPayouts().then((p) => p.total),
    };
  }

  async getRevenueSummary() {
    const summary = await this.paymentModel.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          commissionEarned: { $sum: '$platformFee' },
          artisanPayouts: { $sum: { $subtract: ['$total', '$platformFee'] } },
        },
      },
    ]);

    return summary.length > 0
      ? summary[0]
      : {
          totalRevenue: 0,
          commissionEarned: 0,
          artisanPayouts: 0,
        };
  }

  async getPopularCategories() {
    const categories = await this.paymentModel.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: '$service',
          bookings: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { bookings: -1 } },
      { $limit: 4 },
    ]);

    return categories.map((cat) => ({
      category: cat._id,
      bookings: cat.bookings,
      revenue: `$${cat.revenue.toFixed(2)}`,
    }));
  }

  async getPlatformSettings() {
    // Get from settings collection or return defaults
    return {
      platformName: 'ArtisanHub',
      supportEmail: 'support@artisanhub.com',
      maxBookingsPerArtisan: 10,
      autoApprovalSettings: 'Configure automatic approval criteria...',
    };
  }

  async updatePlatformSettings(settings: any) {
    // Save to settings collection
    return settings;
  }

  async getRecentActivity() {
    const artisanApplications = await this.artisanModel
      .find({ status: 'pending' })
      .populate('user')
      .sort({ createdAt: -1 })
      .limit(2)
      .exec();

    const recentBookings = await this.paymentModel
      .find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(2)
      .populate('customer')
      .populate('artisan')
      .exec();

    const activities: RecentActivityItem[] = [];

    for (const app of artisanApplications) {
      const user = app.user as any;
      activities.push({
        action: 'New artisan application',
        user: `${user.firstName} ${user.lastName}`,
        time: this.formatTimeAgo(app.createdAt),
        type: 'application',
      });
    }

    for (const booking of recentBookings) {
      const customer = booking.customer as any;
      activities.push({
        action: 'Booking completed',
        user: customer
          ? `${customer.firstName} ${customer.lastName}`
          : 'Unknown Customer',
        time: this.formatTimeAgo(booking.createdAt),
        type: 'booking',
      });
    }

    return activities.slice(0, 4);
  }

  async getPlatformAlerts() {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const oldPendingArtisans = await this.artisanModel.countDocuments({
      status: 'pending',
      createdAt: { $lt: twoDaysAgo },
    });

    const pendingPayoutsCount = await this.paymentModel.countDocuments({
      paymentStatus: 'paid',
      payoutStatus: 'pending',
    });

    const totalPayoutAmount = await this.paymentModel.aggregate([
      { $match: { paymentStatus: 'paid', payoutStatus: 'pending' } },
      { $group: { _id: null, total: { $sum: '$platformFee' } } },
    ]);

    const alerts: PlatformAlert[] = [];

    if (oldPendingArtisans > 0) {
      alerts.push({
        type: 'warning',
        message: `${oldPendingArtisans} artisan applications pending review`,
        details: 'Applications older than 48 hours',
        actionText: 'Review',
      });
    }

    if (pendingPayoutsCount > 0) {
      alerts.push({
        type: 'info',
        message: `${pendingPayoutsCount} payouts pending`,
        details: `Total payout: $${totalPayoutAmount[0]?.total || 0}`,
        actionText: 'Process',
      });
    }

    return alerts;
  }

  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  }

  // Helper methods
  private calculateDateRange(timeframe: string) {
    const endDate = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    return { startDate, endDate };
  }

  private calculatePreviousDateRange(timeframe: string) {
    const currentRange = this.calculateDateRange(timeframe);
    const daysDiff = Math.floor(
      (currentRange.endDate.getTime() - currentRange.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return {
      startDate: new Date(
        currentRange.startDate.getTime() - daysDiff * 24 * 60 * 60 * 1000,
      ),
      endDate: currentRange.startDate,
    };
  }

  private calculatePercentageChange(
    previousValue: number,
    currentValue: number,
  ) {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  }
}
