import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { UserRole, type UserDocument } from 'src/users/schemas/user.schema';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // 1. List Reviews
  @Get()
  async list(@Query() query: QueryReviewsDto) {
    return await this.reviewsService.list(query);
  }

  // 2. Aggregate Ratings
  @Get('aggregate')
  async aggregate(@Query() query: { artisanId?: string; productId?: string }) {
    return await this.reviewsService.aggregate(query);
  }

  // 3. Create Review
  @Post()
  async create(@Req() req, @Body() dto: CreateReviewDto) {
    return await this.reviewsService.create(req.user.id, dto);
  }

  // 4. Edit Review
  @Patch(':id')
  async edit(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return await this.reviewsService.edit(req.user.id, id, dto);
  }

  // 5. Delete Review
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async delete(@Req() req, @Param('id') id: string) {
    return await this.reviewsService.delete(req.user.id, id);
  }

  // 6. Report Review
  @Post(':id/report')
  async report(@Req() req, @Param('id') id: string) {
    return await this.reviewsService.report(req.user.id, id);
  }

  // 7. Admin: List/Moderate Reviews
  @Get('/admin/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async adminList(@Query() query: QueryReviewsDto) {
    return await this.reviewsService.adminList(query);
  }

  @Patch('/admin/reviews/:id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async moderate(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected' },
  ) {
    return await this.reviewsService.moderate(id, body.status);
  }
}
