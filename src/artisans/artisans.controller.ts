import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ArtisansService } from './artisans.service';
import { Artisan } from './schemas/artisan.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PaginatedResult } from 'src/common/interfaces/paginated-result.interface';
import { ApplyArtisanDto } from './dto/create-artisan.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import type { UserDocument } from 'src/users/schemas/user.schema';

@Controller('artisans')
export class ArtisansController {
  constructor(
    private readonly artisansService: ArtisansService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // ✅ NEW: Get current artisan's profile
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@GetUser() user: any) {
    return this.artisansService.findByUserId(user._id);
  }

  // ✅ NEW: Update profile
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMyProfile(@GetUser() user: any, @Body() updateData: any) {
    return this.artisansService.updateByUserId(user._id, updateData);
  }

  // ✅ NEW: Update availability
  @UseGuards(JwtAuthGuard)
  @Patch('me/availability')
  async updateAvailability(
    @GetUser() user: any,
    @Body('isAvailable') isAvailable: boolean,
  ) {
    return this.artisansService.updateAvailability(user._id, isAvailable);
  }

  // ✅ NEW: Get artisan's bookings
  @UseGuards(JwtAuthGuard)
  @Get('me/bookings')
  async getMyBookings(@GetUser() user: any, @Query('status') status?: string) {
    return this.artisansService.getBookingsByArtisan(user._id, status);
  }

  // ✅ NEW: Get earnings summary
  @UseGuards(JwtAuthGuard)
  @Get('me/earnings/summary')
  async getEarningsSummary(@GetUser() user: any) {
    return this.artisansService.getEarningsSummary(user._id);
  }

  // ✅ NEW: Get earnings history
  @UseGuards(JwtAuthGuard)
  @Get('me/earnings/history')
  async getEarningsHistory(
    @GetUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.artisansService.getEarningsHistory(
      user._id,
      Number(page),
      Number(limit),
    );
  }

  // ✅ NEW: Get reviews
  @UseGuards(JwtAuthGuard)
  @Get('me/reviews')
  async getMyReviews(
    @GetUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.artisansService.getReviewsByArtisan(
      user._id,
      Number(page),
      Number(limit),
    );
  }

  @Post('apply')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'portfolio', maxCount: 5 },
      { name: 'certifications', maxCount: 5 },
    ]),
  )
  async apply(
    @UploadedFiles()
    files: {
      portfolio?: Express.Multer.File[];
      certifications?: Express.Multer.File[];
    },
    @Body()
    createArtisanData: Omit<ApplyArtisanDto, 'portfolio' | 'certifications'>,
  ) {
    const portfolioUrls: string[] = [];
    const certificationUrls: string[] = [];
    const safeFiles = files || {};

    // Upload portfolio files
    if (safeFiles.portfolio?.length) {
      const uploaded = await Promise.all(
        safeFiles.portfolio.map(async (file) => {
          const result = await this.cloudinaryService.uploadFile(
            file.buffer,
            'artisans/portfolio',
            file.mimetype,
          );
          return result.secure_url;
        }),
      );
      portfolioUrls.push(...uploaded);
    }

    // Upload certification files
    if (safeFiles.certifications?.length) {
      const uploaded = await Promise.all(
        safeFiles.certifications.map(async (file) => {
          const folder = file.mimetype.startsWith('image/')
            ? 'artisans/certifications'
            : 'artisans/certifications_docs';
          const result = await this.cloudinaryService.uploadFile(
            file.buffer,
            folder,
            file.mimetype,
          );
          return result.secure_url;
        }),
      );
      certificationUrls.push(...uploaded);
    }

    // Merge uploaded URLs into DTO
    const artisanDataWithUrls: ApplyArtisanDto = {
      ...createArtisanData,
      portfolio: portfolioUrls,
      certifications: certificationUrls,
    };

    return this.artisansService.apply(artisanDataWithUrls);
  }

  @Get('pending')
  async findPending(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResult<Artisan>> {
    return this.artisansService.findPending(page, limit);
  }

  @Get()
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<PaginatedResult<Artisan>> {
    return this.artisansService.findAll(page, limit);
  }

  // updateStatus must accept only 'approved' | 'rejected'
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected',
  ) {
    return this.artisansService.updateStatus(id, status);
  }

  // bulkCreate fixed
  @Post('bulk-create')
  async bulkCreate(@Body() artisansData: Partial<Artisan>[]) {
    if (!Array.isArray(artisansData)) {
      throw new BadRequestException('Request body must be an array');
    }
    return this.artisansService.bulkCreate(artisansData);
  }
}
