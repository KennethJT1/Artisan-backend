import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Review, ReviewsDocument } from './schemas/review.schema';
import { Model } from 'mongoose';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewsDocument>,
  ) {}
  async create(customerId: string, createReviewDto: any) {
    // Optional: check if customer already reviewed this booking/artisan
    return this.reviewModel.create({
      ...createReviewDto,
      customer: customerId,
    });
  }

  async findMyReviews(customerId: string) {
    return this.reviewModel
      .find({ customer: customerId })
      .populate('artisan', 'firstName lastName')
      .sort({ createdAt: -1 })
      .exec();
  }
}
