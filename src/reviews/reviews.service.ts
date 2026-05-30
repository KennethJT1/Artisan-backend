import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { OrdersService } from '../orders/orders.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    private readonly ordersService: OrdersService,
    private readonly usersService: UsersService,
  ) {}

  // List reviews (with filters, pagination)
  async list(query: QueryReviewsDto) {
    const { artisanId, productId, page = 1, limit = 10, status } = query;
    const filter: any = {};
    if (artisanId) filter.artisanId = artisanId;
    if (productId) filter.productId = productId;
    if (status) filter.status = status;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.reviewModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.reviewModel.countDocuments(filter),
    ]);
    return {
      data: data.map(this.toContract),
      total,
      page,
      limit,
    };
  }

  // Aggregate ratings (average, total, breakdown)
  async aggregate(query: { artisanId?: string; productId?: string }) {
    const match: any = {};
    if (query.artisanId) match.artisanId = new Types.ObjectId(query.artisanId);
    if (query.productId) match.productId = new Types.ObjectId(query.productId);
    match.status = 'approved';
    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
          average: { $avg: '$rating' },
        },
      },
    ];
    const breakdown = await this.reviewModel.aggregate(pipeline);
    const total = breakdown.reduce((sum, b) => sum + b.count, 0);
    const average = total > 0 ? (breakdown.reduce((sum, b) => sum + b._id * b.count, 0) / total) : 0;
    return {
      average: Number(average.toFixed(2)),
      total,
      breakdown: breakdown.map(b => ({ rating: b._id, count: b.count })),
    };
  }

  // Create review (enforce business rules)
  async create(userId: string, dto: CreateReviewDto) {
    // 1. Only verified buyers (completed order) can review
    const toObjectId = (val?: string) => val && Types.ObjectId.isValid(val) ? new Types.ObjectId(val) : undefined;
    const orderObjectId = toObjectId(dto.orderId);
    if (!orderObjectId) throw new BadRequestException('Invalid orderId');
    const artisanObjectId = toObjectId(dto.artisanId);
    const productObjectId = toObjectId(dto.productId);

    const order = await this.ordersService.findById(userId, orderObjectId.toString());
    if (!order || order.status !== 'paid') {
      throw new ForbiddenException('You can only review after completing an order.');
    }
    // 2. One review per order per artisan/product
    const exists = await this.reviewModel.findOne({
      reviewerId: userId,
      orderId: orderObjectId,
      artisanId: artisanObjectId,
      productId: productObjectId,
    });
    if (exists) throw new BadRequestException('You have already reviewed this order.');
    // 3. Get reviewer name
    const user = await this.usersService.findOne(userId);
    const reviewerName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email;
    // 4. Create review
    const review = await this.reviewModel.create({
      reviewerId: userId,
      reviewerName,
      artisanId: artisanObjectId,
      productId: productObjectId,
      orderId: orderObjectId,
      rating: dto.rating,
      comment: dto.comment,
      images: dto.images || [],
      status: 'pending',
      reported: false,
    });
    return { data: this.toContract(review) };
  }

  // Edit review (only by reviewer, only if not yet moderated)
  async edit(userId: string, id: string, dto: UpdateReviewDto) {
    const review = await this.reviewModel.findById(id);
    if (!review) throw new NotFoundException('Review not found');
    if (review.reviewerId.toString() !== userId) throw new ForbiddenException('Not your review');
    if (review.status !== 'pending') throw new ForbiddenException('Cannot edit after moderation');
    Object.assign(review, dto);
    review.updatedAt = new Date();
    await review.save();
    return { data: this.toContract(review) };
  }

  // Delete review (by reviewer or admin)
  async delete(userId: string, id: string, isAdmin = false) {
    const review = await this.reviewModel.findById(id);
    if (!review) throw new NotFoundException('Review not found');
    if (!isAdmin && review.reviewerId.toString() !== userId) throw new ForbiddenException('Not your review');
    await review.deleteOne();
    return { success: true };
  }

  // Report review (any user)
  async report(userId: string, id: string) {
    const review = await this.reviewModel.findById(id);
    if (!review) throw new NotFoundException('Review not found');
    review.reported = true;
    await review.save();
    return { success: true };
  }

  // Admin: list reviews (with filters)
  async adminList(query: QueryReviewsDto) {
    const { status, page = 1, limit = 20 } = query;
    const filter: any = {};
    if (status) {
      if (Array.isArray(status)) {
        filter.status = { $in: status };
      } else if (typeof status === 'string' && status.includes(',')) {
        filter.status = { $in: status.split(',').map(s => s.trim()) };
      } else {
        filter.status = status;
      }
    }
    if (typeof (query as any).reported !== 'undefined') {
      const rep = (query as any).reported;
      filter.reported = rep === 'true' || rep === true;
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.reviewModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      this.reviewModel.countDocuments(filter),
    ]);
    return {
      data: data.map(this.toContract),
      total,
      page,
      limit,
    };
  }

  // Admin: moderate review
  async moderate(id: string, status: 'approved' | 'rejected') {
    const review = await this.reviewModel.findById(id);
    if (!review) throw new NotFoundException('Review not found');
    review.status = status;
    review.updatedAt = new Date();
    await review.save();
    return { data: this.toContract(review) };
  }

  // Format review to contract
  toContract(review: any) {
    return {
      id: review._id.toString(),
      reviewerId: review.reviewerId?.toString(),
      reviewerName: review.reviewerName,
      artisanId: review.artisanId?.toString() || null,
      productId: review.productId?.toString() || null,
      orderId: review.orderId?.toString(),
      rating: review.rating,
      comment: review.comment,
      images: review.images || [],
      status: review.status,
      reported: !!review.reported,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}
