import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}
@Post()
  create(@Req() req, @Body() createReviewDto: any) {
    return this.reviewsService.create(req.user.id, createReviewDto);
  }

  @Get()
  findMyReviews(@Req() req) {
    return this.reviewsService.findMyReviews(req.user.id);
  }

}
