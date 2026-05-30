
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';
import { Category, CategoryDocument } from '../category/schemas/category.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  // For analytics processor compatibility
  async logEvent(data: { userId: string; event: string; metadata: any }) {
    // Implement event logging logic here if needed
    console.log('📈 Logging event:', data);
  }

  async getAnalyticsSummary(months: number = 12, limit: number = 5) {
    // Revenue trends
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
    const revenuePipeline: any[] = [
      { $match: { paymentStatus: 'paid', createdAt: { $gte: start } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { '_id.year': 1 as 1, '_id.month': 1 as 1 } },
    ];
    const results = await this.paymentModel.aggregate(revenuePipeline);
    // Fill missing months and calculate growth
    const revenueTrends: Array<{ month: string; revenue: number; growth: number }> = [];
    let prevRevenue = 0;
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const found = results.find(r => r._id.year === year && r._id.month === month);
      const revenue = found ? found.revenue : 0;
      const growth = prevRevenue === 0 ? 0 : ((revenue - prevRevenue) / prevRevenue) * 100;
      revenueTrends.push({
        month: `${year}-${month.toString().padStart(2, '0')}`,
        revenue,
        growth: Number(growth.toFixed(2)),
      });
      prevRevenue = revenue;
    }

    // Popular categories
    const catPipeline: any[] = [
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: '$service',
          bookings: { $sum: 1 },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { bookings: -1 as -1 } },
      { $limit: limit },
    ];
    const catResults = await this.paymentModel.aggregate(catPipeline);
    const popularCategories = catResults.map(r => ({
      category: r._id,
      bookings: r.bookings,
      revenue: r.revenue,
    }));

    return {
      revenueTrends,
      popularCategories,
    };
  }
}
